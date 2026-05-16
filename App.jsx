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
  const [darkMode, setDarkMode] = useState(false);
  
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

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) setDarkMode(stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

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

  const toastTheme = toastMessage ? (darkMode ? 'bg-black/90 text-slate-100' : toastMessage.type === 'error' ? 'bg-[#FEE2E2] text-[#9B1C1C]' : 'bg-[#DBEAFE] text-[#1E293B]') : '';

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <div className="rounded-[24px] border border-slate-200 bg-white px-10 py-10 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.15)]">
        <Activity className="animate-pulse text-[#4F46E5] w-14 h-14" />
      </div>
    </div>
  );

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
    <div className={`min-h-screen font-sans flex flex-col md:flex-row ${darkMode ? 'bg-black text-slate-100' : 'bg-[#F8FAFC] text-[#1E293B]'}`}>
      {/* Toast - Posicionamiento fijo para todas las resoluciones */}
      {toastMessage && (
        <div className={`fixed top-6 left-1/2 z-[100] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-semibold shadow-[0_18px_50px_-30px_rgba(15,23,42,0.2)] ${toastTheme}`}>
          {toastMessage.msg}
        </div>
      )}

      {/* Sidebar para Desktop (oculto en móvil) */}
      <aside className={`hidden md:flex w-72 flex-col gap-8 p-6 rounded-[24px] shadow-[0_20px_80px_-40px_rgba(15,23,42,0.12)] sticky top-6 self-start m-6 ${darkMode ? 'bg-black border-slate-800 text-slate-100' : 'bg-white border border-slate-200 text-slate-900'}`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-[20px] ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-[#4F46E5] text-white'} text-xl font-semibold`}>
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Tu balance total</p>
            <p className={`mt-1 text-xl font-semibold truncate ${dashboardStats.netWorth < 0 ? (darkMode ? 'text-slate-300' : 'text-[#BE123C]') : (darkMode ? 'text-slate-100' : 'text-[#0D9488]')}`}>
              {formatCurrency(dashboardStats.netWorth)}
            </p>
          </div>
        </div>

        <nav className="space-y-3">
          <NavItem icon={<Home size={20} />} label="Dashboard" active={activeTab === 'dashboard'} darkMode={darkMode} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Wallet size={20} />} label="Mis Cuentas" active={activeTab === 'accounts'} darkMode={darkMode} onClick={() => setActiveTab('accounts')} />
          <NavItem icon={<CreditCard size={20} />} label="Tarjetas" active={activeTab === 'cards'} darkMode={darkMode} onClick={() => setActiveTab('cards')} />
          <NavItem icon={<Landmark size={20} />} label="Préstamos" active={activeTab === 'loans'} darkMode={darkMode} onClick={() => setActiveTab('loans')} />
          <NavItem icon={<Settings size={20} />} label="Configuración" active={activeTab === 'settings'} darkMode={darkMode} onClick={() => setActiveTab('settings')} />
        </nav>

        {/* FAB en Sidebar para Desktop */}
        <div className="space-y-4">
          <button
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`flex h-12 w-12 items-center justify-center rounded-[16px] ${darkMode ? 'bg-slate-700 text-slate-100 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.45)]' : 'bg-[#0D9488] text-white shadow-[0_12px_28px_-18px_rgba(13,148,136,0.7)]'} transition-transform hover:scale-105 active:scale-95 ${isFabOpen ? (darkMode ? 'rotate-45 bg-slate-600' : 'rotate-45 bg-[#4F46E5]') : ''}`}
          >
            <Plus size={24} strokeWidth={3} />
          </button>

          {isFabOpen && (
            <div className={`absolute bottom-20 left-6 flex flex-col items-start gap-3 rounded-[24px] p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.14)] ${darkMode ? 'bg-slate-950 border border-slate-800' : 'bg-white border border-slate-200'}`}>
              <FabOption icon={<ArrowRightLeft size={18} />} label="Transferencia" color="bg-[#4F46E5]" darkMode={darkMode} onClick={() => { setModalConfig({ type: 'transfer' }); setIsFabOpen(false); }} />
              <FabOption icon={<TrendingDown size={18} />} label="Gasto" color="bg-[#F97316]" darkMode={darkMode} onClick={() => { setModalConfig({ type: 'expense' }); setIsFabOpen(false); }} />
              <FabOption icon={<TrendingUp size={18} />} label="Ingreso" color="bg-[#0D9488]" darkMode={darkMode} onClick={() => { setModalConfig({ type: 'income' }); setIsFabOpen(false); }} />
            </div>
          )}
        </div>

        <button onClick={() => supabase.auth.signOut()} className={`mt-auto flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm font-semibold transition ${darkMode ? 'border-slate-800 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </aside>

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        
        {/* Header para Móvil (Oculto en desktop) */}
        <header className={`md:hidden px-5 py-4 shadow-sm ${darkMode ? 'bg-black border-b border-slate-800 text-slate-100' : 'bg-white border-b border-slate-200 text-slate-900'}`}>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-[#ECFDF5] text-[#0D9488]'}`}>
              {user.email?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Tu balance total</p>
              <p className={`mt-1 text-lg font-semibold ${dashboardStats.netWorth < 0 ? 'text-[#BE123C]' : 'text-[#0D9488]'}`}>
                {formatCurrency(dashboardStats.netWorth)}
              </p>
            </div>
          </div>
          <button onClick={() => setActiveTab('settings')} className={`transition p-2 ${darkMode ? 'text-slate-200 hover:text-slate-50' : 'text-slate-500 hover:text-[#0D9488]'}`}>
            <Settings size={20} />
          </button>
        </header>

        {/* Contenedor del Main: Ajustamos el padding y el ancho máximo */}
        <main className="flex-1 overflow-y-auto pb-32 md:pb-12 p-4 md:p-12 hide-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">
            {activeTab === 'dashboard' && <DashboardView stats={dashboardStats} transactions={transactions} categories={categories} deleteTx={deleteTransaction} openModal={setModalConfig} darkMode={darkMode} />}
            {activeTab === 'accounts' && <AccountsView accounts={accounts} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} darkMode={darkMode} />}
            {activeTab === 'cards' && <CreditCardsView cards={creditCards} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} darkMode={darkMode} />}
            {activeTab === 'loans' && <LoansView loans={loans} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} darkMode={darkMode} />}
            {activeTab === 'settings' && <SettingsView categories={categories} subscriptions={subscriptions} openModal={setModalConfig} userEmail={user.email} userId={user.id} refresh={fetchInitialData} darkMode={darkMode} setDarkMode={setDarkMode} />}
          </div>
        </main>

        {/* Navegación Inferior Móvil (Oculta en desktop) */}
        <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 shadow-[0_-10px_30px_-20px_rgba(15,23,42,0.12)] ${darkMode ? 'border-t border-slate-800 bg-black/95' : 'border-t border-slate-200 bg-white/95'}`}>
          <NavItem icon={<Home />} label="Inicio" active={activeTab === 'dashboard'} darkMode={darkMode} onClick={() => setActiveTab('dashboard')} layout='col' />
          <NavItem icon={<Wallet />} label="Cuentas" active={activeTab === 'accounts'} darkMode={darkMode} onClick={() => setActiveTab('accounts')} layout='col' />
          <NavItem icon={<Plus />} label="" active={false} onClick={() => setIsFabOpen(!isFabOpen)} layout='col' />
          <NavItem icon={<CreditCard />} label="Tarjetas" active={activeTab === 'cards'} darkMode={darkMode} onClick={() => setActiveTab('cards')} layout='col' />
          <NavItem icon={<Landmark />} label="Préstamos" active={activeTab === 'loans'} darkMode={darkMode} onClick={() => setActiveTab('loans')} layout='col' />
        </nav>

        {isFabOpen && (
          <div className={`md:hidden fixed bottom-20 left-1/2 z-50 flex w-max -translate-x-1/2 flex-col items-center gap-3 rounded-[24px] p-4 shadow-[0_20px_50px_-30px_rgba(15,23,42,0.14)] ${darkMode ? 'bg-black border-slate-800' : 'bg-white border border-slate-200'}`}>
            <FabOption icon={<ArrowRightLeft size={18} />} label="Transferencia" color="bg-[#4F46E5]" darkMode={darkMode} onClick={() => { setModalConfig({ type: 'transfer' }); setIsFabOpen(false); }} />
            <FabOption icon={<TrendingDown size={18} />} label="Gasto" color="bg-[#F97316]" darkMode={darkMode} onClick={() => { setModalConfig({ type: 'expense' }); setIsFabOpen(false); }} />
            <FabOption icon={<TrendingUp size={18} />} label="Ingreso" color="bg-[#0D9488]" darkMode={darkMode} onClick={() => { setModalConfig({ type: 'income' }); setIsFabOpen(false); }} />
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
          darkMode={darkMode}
        />
      )}
    </div>
  );
}