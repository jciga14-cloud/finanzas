import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { 
  Home, CreditCard, Wallet, Landmark, Plus, 
  TrendingUp, TrendingDown, Settings, Activity, LogOut, 
  ArrowRightLeft
} from 'lucide-react';
import { formatCurrency, getDaysUntil } from './formatters';
import { NavItem, FabOption } from './UI';
import { DashboardView, AccountsView, CreditCardsView, LoansView, SettingsView } from './Views';
import { ActionModal } from './ActionModal';

export const formatInputValue = (val) => {
  if (!val) return '';
  return val;
};

export const handleBlurFormatting = (val, setter) => {
  if (!val) return;
  const num = parseFloat(val);
  if (!isNaN(num)) setter(num.toFixed(2));
};

export default function App() {
  // Forzamos un usuario local para desarrollo
  const [user, setUser] = useState({ id: '00000000-0000-0000-0000-000000000000', email: 'usuario@desarrollo.com' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  // Estados de datos
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loans, setLoans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [categories, setCategories] = useState({
    income_categories: ['💰 Salario', '💼 Negocio', '📈 Inversiones', '🎁 Otros'],
    expense_categories: ['🛒 Alimentos', '🚗 Transporte', '💡 Servicios', '🎬 Ocio', '💊 Salud', '📚 Educación', '📦 Otros'],
    monthly_budget: 1000
  });

  useEffect(() => {
    // Comentamos la autenticación real por ahora
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setUser(session?.user ?? null);
    //   setLoading(false);
    // });

    // const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    //   setUser(session?.user ?? null);
    // });

    // return () => authListener.subscription.unsubscribe();
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchInitialData();
    
    // Configurar tiempo real (opcional pero recomendado)
    const channels = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => fetchInitialData())
      .subscribe();

    return () => supabase.removeChannel(channels);
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchInitialData = async () => {
    const [acc, tx, cards, ln, sub] = await Promise.all([
      supabase.from('accounts').select('*'),
      supabase.from('transactions').select('*').order('date', { ascending: false }).limit(50),
      supabase.from('credit_cards').select('*'),
      supabase.from('loans').select('*'),
      supabase.from('subscriptions').select('*')
    ]);

    const { data: prefs } = await supabase.from('user_preferences').select('*').single();

    if (acc.data) setAccounts(acc.data);
    if (tx.data) setTransactions(tx.data);
    if (cards.data) setCreditCards(cards.data);
    if (ln.data) setLoans(ln.data);
    if (sub.data) setSubscriptions(sub.data);
    if (prefs) setCategories({ ...prefs, monthly_budget: Number(prefs.monthly_budget) });
  };

  const dashboardStats = useMemo(() => {
    let totalIncome = 0, totalExpenses = 0, netWorth = 0, categoryTotals = {};
    accounts.forEach(a => netWorth += (Number(a.balance) || 0));
    creditCards.forEach(c => netWorth -= (Number(c.balance) || 0));
    loans.forEach(l => netWorth -= (Number(l.pending_balance) || 0));

    transactions.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') totalIncome += amt;
      if (['expense', 'card_payment', 'loan_payment', 'pay_subscription'].includes(tx.type) && tx.from_account_id !== 'external') {
        totalExpenses += amt;
        if (tx.type === 'expense' || tx.type === 'pay_subscription') {
          categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
        }
      }
    });

    const upcoming = [];
    creditCards.forEach(c => {
      const days = getDaysUntil(c.payment_date);
      if (days !== null && days <= 7) upcoming.push({ ...c, type: 'Card Due', days, title: 'Pago Tarjeta', isLate: days < 0 });
    });
    loans.forEach(l => {
      const days = getDaysUntil(l.payment_date);
      if (days !== null && days <= 7) upcoming.push({ ...l, type: 'Loan Due', days, title: 'Cuota Préstamo', isLate: days < 0 });
    });
    subscriptions.forEach(s => {
      const days = getDaysUntil(s.next_payment_date);
      if (days !== null && days <= 7) upcoming.push({ ...s, type: 'Subscription', days, title: 'Recibo', isLate: days < 0 });
    });

    return { totalIncome, totalExpenses, cashFlow: totalIncome - totalExpenses, upcoming: upcoming.sort((a,b) => a.days - b.days), netWorth, categoryTotals };
  }, [transactions, creditCards, loans, accounts, subscriptions]);

  const deleteTransaction = async (tx) => {
    try {
      if (tx.type === 'expense' || tx.type === 'income' || tx.type === 'pay_subscription') {
        if (tx.from_account_id && tx.from_account_id !== 'external' && tx.from_account_id !== 'credit_card') {
          const acc = accounts.find(a => a.id === tx.from_account_id);
          if (acc) {
            const newBal = (tx.type === 'expense' || tx.type === 'pay_subscription') 
              ? Number(acc.balance) + Number(tx.amount) 
              : Number(acc.balance) - Number(tx.amount);
            await supabase.from('accounts').update({ balance: newBal }).eq('id', acc.id);
          }
        }
      } 
      else if (tx.type === 'card_payment' || tx.type === 'loan_payment') {
        const isCard = tx.type === 'card_payment';
        const table = isCard ? 'credit_cards' : 'loans';
        const item = isCard ? creditCards.find(c => c.id === tx.related_id) : loans.find(l => l.id === tx.related_id);
        
        if (item) {
          if (isCard) {
            await supabase.from(table).update({ balance: Number(item.balance) + Number(tx.amount) }).eq('id', item.id);
          } else {
            const updatePayload = { 
              pending_balance: Number(item.pending_balance) + Number(tx.amount),
              remaining_installments: tx.is_full_quota ? Number(item.remaining_installments) + 1 : item.remaining_installments
            };
            if (tx.is_full_quota && item.payment_date) {
              const d = new Date(item.payment_date);
              d.setMonth(d.getMonth() - 1);
              updatePayload.payment_date = d.toISOString().split('T')[0];
            }
            await supabase.from(table).update(updatePayload).eq('id', item.id);
          }

          if (tx.from_account_id && tx.from_account_id !== 'external') {
            const acc = accounts.find(a => a.id === tx.from_account_id);
            if (acc) {
              await supabase.from('accounts').update({ balance: Number(acc.balance) + Number(tx.amount) }).eq('id', acc.id);
            }
          }
        }
      }
      else if (tx.type === 'transfer') {
         const from = accounts.find(a => a.id === tx.from_account_id);
         const to = accounts.find(a => a.id === tx.to_account_id);
         if(from) await supabase.from('accounts').update({ balance: Number(from.balance) + Number(tx.amount) }).eq('id', from.id);
         if(to) await supabase.from('accounts').update({ balance: Number(to.balance) - Number(tx.amount) }).eq('id', to.id);
      }
    } catch (e) { 
      console.error("Error revert", e); 
    }

    const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
    if (!error) {
      showToast('Movimiento eliminado y saldo restaurado');
      fetchInitialData();
    }
  };

  const deleteEntity = async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      showToast('Eliminado correctamente');
      setModalConfig(null);
      fetchInitialData();
    }
  };

  if (loading) return <div className="flex h-screen bg-slate-950 items-center justify-center"><Activity className="animate-pulse text-emerald-500" /></div>;

  // if (!user) {
  //   return (
  //     <div className="flex h-screen bg-slate-950 items-center justify-center p-6 text-center">
  //       <div className="max-w-md space-y-6">
  //         <h1 className="text-3xl font-bold text-emerald-500">Finanzas Personales</h1>
  //         <p className="text-slate-400">Inicia sesión para gestionar tu patrimonio de forma segura.</p>
  //         <button 
  //           onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
  //           className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2"
  //         >
  //           Continuar con Google
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col md:flex-row overflow-hidden">
      {/* Toast - Posicionamiento fijo para todas las resoluciones */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 animate-bounce ${toastMessage.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-900'}`}>
          {toastMessage.msg}
        </div>
      )}

      {/* Sidebar para Desktop (oculto en móvil) */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 border-r border-slate-800 p-8 z-50 h-screen sticky top-0">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 text-xl font-black">
             {user.email?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Patrimonio Neto</p>
            <p className={`font-black text-xl leading-none truncate ${dashboardStats.netWorth < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatCurrency(dashboardStats.netWorth)}
            </p>
          </div>
        </div>

        <nav className="space-y-4">
          <NavItem icon={<Home size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Wallet size={20} />} label="Mis Cuentas" active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} />
          <NavItem icon={<CreditCard size={20} />} label="Tarjetas" active={activeTab === 'cards'} onClick={() => setActiveTab('cards')} />
          <NavItem icon={<Landmark size={20} />} label="Préstamos" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
          <NavItem icon={<Settings size={20} />} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        {/* FAB en Sidebar para Desktop */}
        <div className="mt-4">
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)} 
            className={`w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/20 transition-all hover:scale-110 active:scale-95 ${isFabOpen ? 'rotate-45 bg-slate-800 text-emerald-500' : ''}`}
          >
            <Plus size={24} strokeWidth={3} />
          </button>
          
          {isFabOpen && (
            <div className="absolute bottom-16 left-0 flex flex-col items-start gap-3 pb-2 animate-fade-in-up w-max">
              <FabOption icon={<ArrowRightLeft size={18} />} label="Transferencia" color="bg-indigo-500" onClick={() => {setModalConfig({type: 'transfer'}); setIsFabOpen(false);}} />
              <FabOption icon={<TrendingDown size={18} />} label="Gasto" color="bg-rose-500" onClick={() => {setModalConfig({type: 'expense'}); setIsFabOpen(false);}} />
              <FabOption icon={<TrendingUp size={18} />} label="Ingreso" color="bg-emerald-500" onClick={() => {setModalConfig({type: 'income'}); setIsFabOpen(false);}} />
            </div>
          )}
        </div>

        <button onClick={() => supabase.auth.signOut()} className="mt-auto flex items-center gap-3 p-4 text-slate-500 hover:text-rose-400 transition-all rounded-2xl hover:bg-rose-500/10 font-semibold text-sm">
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </aside>

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        
        {/* Header para Móvil (Oculto en desktop) */}
        <header className="md:hidden bg-slate-900 px-6 py-5 flex justify-between items-center z-10 border-b border-slate-800 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
               {user.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Patrimonio</p>
              <p className={`font-bold text-lg leading-none ${dashboardStats.netWorth < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatCurrency(dashboardStats.netWorth)}
              </p>
            </div>
          </div>
          <button onClick={() => setActiveTab('settings')} className="text-slate-500 hover:text-emerald-400 transition-colors p-2">
            <Settings size={20} />
          </button>
        </header>

        {/* Contenedor del Main: Ajustamos el padding y el ancho máximo */}
        <main className="flex-1 overflow-y-auto pb-32 md:pb-12 p-4 md:p-12 hide-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            {activeTab === 'dashboard' && <DashboardView stats={dashboardStats} transactions={transactions} categories={categories} deleteTx={deleteTransaction} openModal={setModalConfig} />}
            {activeTab === 'accounts' && <AccountsView accounts={accounts} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} />}
            {activeTab === 'cards' && <CreditCardsView cards={creditCards} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} />}
            {activeTab === 'loans' && <LoansView loans={loans} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} />}
            {activeTab === 'settings' && <SettingsView categories={categories} subscriptions={subscriptions} openModal={setModalConfig} userEmail={user.email} userId={user.id} refresh={fetchInitialData} />}
          </div>
        </main>

        {/* Navegación Inferior Móvil (Oculta en desktop) */}
        <nav className="md:hidden fixed bottom-0 w-full bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 px-6 py-4 flex justify-between items-center z-40 pb-safe">
          <NavItem icon={<Home />} label="Inicio" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Wallet />} label="Cuentas" active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} />
          <NavItem icon={<Plus />} label="" active={false} onClick={() => setIsFabOpen(!isFabOpen)} />
          <NavItem icon={<CreditCard />} label="Tarjetas" active={activeTab === 'cards'} onClick={() => setActiveTab('cards')} />
          <NavItem icon={<Landmark />} label="Préstamos" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
        </nav>

        {isFabOpen && (
          <div className="md:hidden fixed bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pb-2 animate-fade-in-up w-max z-50">
            <FabOption icon={<ArrowRightLeft size={18} />} label="Transferencia" color="bg-indigo-500" onClick={() => {setModalConfig({type: 'transfer'}); setIsFabOpen(false);}} />
            <FabOption icon={<TrendingDown size={18} />} label="Gasto" color="bg-rose-500" onClick={() => {setModalConfig({type: 'expense'}); setIsFabOpen(false);}} />
            <FabOption icon={<TrendingUp size={18} />} label="Ingreso" color="bg-emerald-500" onClick={() => {setModalConfig({type: 'income'}); setIsFabOpen(false);}} />
          </div>
        )}


      </div>

      {modalConfig && (
        <ActionModal 
          config={modalConfig} 
          onClose={() => setModalConfig(null)} 
          userId={user.id}
          categories={categories}
          accounts={accounts}
          creditCards={creditCards}
          refresh={fetchInitialData}
          showToast={showToast}
          deleteEntity={deleteEntity}
        />
      )}
    </div>
  );
}