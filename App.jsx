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
    // Revertir saldos antes de borrar
    try {
      if (tx.type === 'expense' || tx.type === 'income') {
        if (tx.from_account_id && tx.from_account_id !== 'external' && tx.from_account_id !== 'credit_card') {
          const acc = accounts.find(a => a.id === tx.from_account_id);
          if (acc) {
            const newBal = tx.type === 'expense' ? Number(acc.balance) + Number(tx.amount) : Number(acc.balance) - Number(tx.amount);
            await supabase.from('accounts').update({ balance: newBal }).eq('id', acc.id);
          }
        }
      }
      // Lógica de reversión similar para préstamos/tarjetas...
    } catch (e) { console.error("Error revert", e); }

    const { error } = await supabase.from('transactions').delete().eq('id', tx.id);
    if (!error) {
      showToast('Movimiento eliminado');
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
    <div className="max-w-md mx-auto h-screen flex flex-col bg-slate-950 text-slate-300 shadow-2xl relative overflow-hidden sm:rounded-3xl sm:h-[90vh] sm:my-auto">
      {toastMessage && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center gap-2 ${toastMessage.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500 text-slate-900'}`}>
          {toastMessage.msg}
        </div>
      )}

      <header className="bg-slate-900 px-6 py-5 flex justify-between items-center z-10 border-b border-slate-800 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30">
             {user.email?.[0].toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Patrimonio Neto</p>
            <p className={`font-bold text-lg leading-none ${dashboardStats.netWorth < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatCurrency(dashboardStats.netWorth)}
            </p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-slate-500 hover:text-rose-400">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 p-6 hide-scrollbar">
        {activeTab === 'dashboard' && <DashboardView stats={dashboardStats} transactions={transactions} categories={categories} deleteTx={deleteTransaction} openModal={setModalConfig} />}
        {activeTab === 'accounts' && <AccountsView accounts={accounts} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} />}
        {activeTab === 'cards' && <CreditCardsView cards={creditCards} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} />}
        {activeTab === 'loans' && <LoansView loans={loans} transactions={transactions} openModal={setModalConfig} deleteTx={deleteTransaction} />}
        {activeTab === 'settings' && <SettingsView categories={categories} subscriptions={subscriptions} openModal={setModalConfig} userEmail={user.email} refresh={fetchInitialData} />}
      </main>

      <nav className="absolute bottom-0 w-full bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-between items-center z-40 pb-safe">
        <NavItem icon={<Home />} label="Inicio" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavItem icon={<Wallet />} label="Cuentas" active={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} />
        <div className="w-12"></div>
        <NavItem icon={<CreditCard />} label="Tarjetas" active={activeTab === 'cards'} onClick={() => setActiveTab('cards')} />
        <NavItem icon={<Landmark />} label="Préstamos" active={activeTab === 'loans'} onClick={() => setActiveTab('loans')} />
      </nav>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button onClick={() => setIsFabOpen(!isFabOpen)} className={`w-14 h-14 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center transition-transform ${isFabOpen ? 'rotate-45 bg-slate-800 text-emerald-500' : ''}`}>
          <Plus size={28} />
        </button>
        {isFabOpen && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pb-2 animate-fade-in-up w-max">
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