import React, { useState } from 'react';
import { 
  Target, AlertCircle, Repeat, Wallet, 
  Edit2, CreditCard, Landmark, LogOut, Car, Activity, X, Save
} from 'lucide-react';
import { formatCurrency } from './formatters';
import { EmptyState, TransactionItem } from './UI';
import { supabase } from './supabaseClient';

export const DashboardView = ({ stats, transactions, categories, deleteTx, openModal, darkMode }) => {
  const recentTx = transactions.slice(0, 5);
  const budget = categories.monthly_budget || 0;
  const budgetProgress = budget > 0 ? Math.min((stats.totalExpenses / budget) * 100, 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`rounded-[24px] border p-6 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-[#0F172A]'}`}>
        <p className={`text-sm font-medium uppercase tracking-[0.18em] mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Flujo de caja mensual</p>
        <h2 className={`text-4xl font-semibold ${stats.cashFlow < 0 ? (darkMode ? 'text-slate-300' : 'text-[#BE123C]') : darkMode ? 'text-slate-100' : 'text-[#0D9488]'}`}>
          {formatCurrency(stats.cashFlow)}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className={`rounded-[20px] border p-4 ${darkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-[#ECFDF5]'}`}>
             <p className={`text-[10px] font-bold uppercase tracking-[0.25em] mb-1 ${darkMode ? 'text-slate-400' : 'text-[#0F766E]'}`}>Ingresos</p>
             <p className={`text-xl font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div className={`rounded-[20px] border p-4 ${darkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-[#FFF1F2]'}`}>
             <p className={`text-[10px] font-bold uppercase tracking-[0.25em] mb-1 ${darkMode ? 'text-slate-400' : 'text-[#981B3A]'}`}>Gastos</p>
             <p className={`text-xl font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{formatCurrency(stats.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {budget > 0 && (
        <div className={`rounded-[24px] border p-5 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-end justify-between mb-3">
            <h3 className={`text-xs font-bold uppercase tracking-[0.25em] flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}><Target size={14} className={darkMode ? 'text-slate-400' : 'text-[#4F46E5]'}/> Presupuesto</h3>
            <span className={`text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{budgetProgress.toFixed(0)}%</span>
          </div>
          <div className={`mb-3 h-2 overflow-hidden rounded-full ${darkMode ? 'bg-slate-800 border border-slate-800' : 'bg-[#E0F2FE] border border-slate-200'}`}>
            <div className={`h-full ${stats.totalExpenses > budget ? (darkMode ? 'bg-slate-700' : 'bg-[#FECACA]') : (darkMode ? 'bg-slate-700' : 'bg-[#93C5FD]')}`} style={{ width: `${budgetProgress}%` }}></div>
          </div>
          <div className={`flex justify-between text-[10px] font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>{formatCurrency(stats.totalExpenses)}</span>
            <span>Meta: {formatCurrency(budget)}</span>
          </div>
        </div>
      )}

      {stats.upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className={`flex items-center gap-2 text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}><AlertCircle size={16} className={darkMode ? 'text-slate-400' : 'text-[#F59E0B]'}/> Pendientes</h3>
          {stats.upcoming.map((u, i) => (
            <div key={i} className={`flex items-center justify-between rounded-[20px] border p-4 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
              <div>
                <p className={`font-semibold text-sm ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{u.name}</p>
                <p className={`mt-1 text-[10px] ${u.isLate ? (darkMode ? 'text-slate-200 font-bold' : 'text-[#BE123C] font-bold') : darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{u.isLate ? '¡Atrasado!' : `Faltan ${u.days} días`}</p>
              </div>
              <button onClick={() => openModal({ type: u.type === 'Subscription' ? 'pay_subscription' : 'pay_card', relatedItem: u })} className={`rounded-[16px] px-3 py-2 text-[10px] font-bold transition ${darkMode ? 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border border-[#DBEAFE] bg-[#EFF6FF] text-[#4F46E5] hover:bg-[#DBEAFE]'}`}>Pagar</button>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className={`mb-3 text-sm font-semibold uppercase tracking-[0.16em] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Actividad reciente</h3>
        <div className={`space-y-3 rounded-[24px] border p-4 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          {recentTx.map(tx => <TransactionItem key={tx.id} tx={tx} onDelete={deleteTx} darkMode={darkMode} />)}
        </div>
      </div>
    </div>
  );
};

export const AccountsView = ({ accounts, transactions, openModal, deleteTx, darkMode }) => {
  const liquid = accounts.filter(a => a.type !== 'Activo Fijo');
  const assets = accounts.filter(a => a.type === 'Activo Fijo');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className={`text-xl font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>Mis Cuentas</h2>
        <button onClick={() => openModal({ type: 'account' })} className={`rounded-[16px] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] transition ${darkMode ? 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border border-[#DBEAFE] bg-[#ECFDF5] text-[#0D9488] hover:bg-[#D1FAE5]'}`}>Añadir</button>
      </div>

      {liquid.map(acc => (
        <div key={acc.id} className={`rounded-[24px] border p-6 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-[#EFF6FF] text-[#4F46E5]'}`}><Wallet size={20} /></div>
              <div>
                <h3 className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{acc.name}</h3>
                <p className={`mt-1 text-[10px] uppercase tracking-[0.22em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{acc.type}</p>
              </div>
            </div>
            <button onClick={() => openModal({ type: 'account', isEdit: true, relatedItem: acc })} className={`transition ${darkMode ? 'text-slate-300 hover:text-slate-100' : 'text-slate-500 hover:text-[#0D9488]'}`}><Edit2 size={16} /></button>
          </div>
          <p className={`text-3xl font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0D9488]'}`}>{formatCurrency(acc.balance)}</p>
        </div>
      ))}

      {assets.length > 0 && (
        <div className={`rounded-[24px] border p-5 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
          <h3 className={`mb-4 text-xs font-semibold uppercase tracking-[0.24em] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Activos Fijos</h3>
          {assets.map(asset => (
            <div key={asset.id} className={`mb-3 flex items-center justify-between rounded-[18px] border p-4 ${darkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-[#F8FAFC]'}`}>
               <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-500'}`}><Car size={16} /></div>
                  <h4 className={`font-semibold text-sm ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{asset.name}</h4>
               </div>
               <p className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{formatCurrency(asset.balance)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CreditCardsView = ({ cards, openModal, darkMode }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className={`text-xl font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>Tarjetas</h2>
      <button onClick={() => openModal({ type: 'card' })} className={`rounded-[16px] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] transition ${darkMode ? 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border border-[#DBEAFE] bg-[#ECFDF5] text-[#0D9488] hover:bg-[#D1FAE5]'}`}>Nueva</button>
    </div>
    {cards.map(card => (
      <div key={card.id} className={`rounded-[24px] border p-6 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-start justify-between gap-3 mb-6">
          <div>
            <h3 className={`font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{card.name}</h3>
            <p className={`mt-1 text-[10px] uppercase tracking-[0.22em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{card.bank}</p>
          </div>
          <button onClick={() => openModal({ type: 'card', isEdit: true, relatedItem: card })} className={`transition ${darkMode ? 'text-slate-300 hover:text-slate-100' : 'text-slate-500 hover:text-[#0D9488]'}`}><Edit2 size={16} /></button>
        </div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className={`rounded-[20px] border p-4 ${darkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-[#FFF1F2]'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-1 ${darkMode ? 'text-slate-400' : 'text-[#981B3A]'}`}>Deuda</p>
            <p className={`text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-[#981B3A]'}`}>{formatCurrency(card.balance)}</p>
          </div>
          <div className={`rounded-[20px] border p-4 text-right ${darkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-[#F8FAFC]'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Límite</p>
            <p className={`text-sm font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{formatCurrency(card.limit_amount)}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={() => openModal({ type: 'card_expense', relatedItem: card })} className={`flex-1 rounded-[16px] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.24em] transition ${darkMode ? 'bg-slate-800 text-slate-100 border border-slate-800 hover:bg-slate-700' : 'bg-[#FEE2E2] text-[#981B3A] border border-[#FECACA] hover:bg-[#FCD5D6]'}`}>Gasto</button>
          <button onClick={() => openModal({ type: 'pay_card', relatedItem: card })} className={`flex-1 rounded-[16px] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.24em] transition ${darkMode ? 'bg-slate-800 text-slate-100 border border-slate-800 hover:bg-slate-700' : 'bg-[#ECFDF5] text-[#0D9488] border border-[#DBEAFE] hover:bg-[#D1FAE5]'}`}>Pagar</button>
        </div>
      </div>
    ))}
    {cards.length === 0 && <EmptyState icon={<CreditCard />} title="Sin tarjetas" desc="Agrega tu primera tarjeta para controlarla." />}
  </div>
);

export const LoansView = ({ loans, openModal, darkMode }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 className={`text-xl font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>Préstamos</h2>
      <button onClick={() => openModal({ type: 'loan' })} className={`rounded-[16px] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] transition ${darkMode ? 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border border-[#DBEAFE] bg-[#ECFDF5] text-[#0D9488] hover:bg-[#D1FAE5]'}`}>Nuevo</button>
    </div>
    {loans.map(loan => (
      <div key={loan.id} className={`rounded-[24px] border p-6 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{loan.name}</h3>
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${darkMode ? 'bg-slate-800 text-slate-100 border border-slate-800' : 'bg-[#FEE2E2] text-[#981B3A]'}`}>{loan.remaining_installments} cuotas</span>
        </div>
        <p className={`mb-4 text-2xl font-semibold ${darkMode ? 'text-slate-100' : 'text-[#981B3A]'}`}>{formatCurrency(loan.pending_balance)}</p>
        <button onClick={() => openModal({ type: 'pay_loan', relatedItem: loan })} className={`w-full rounded-[16px] px-4 py-3 text-[10px] font-bold uppercase tracking-[0.24em] transition ${darkMode ? 'border border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border border-[#DBEAFE] bg-[#ECFDF5] text-[#0D9488] hover:bg-[#D1FAE5]'}`}>Pagar Cuota</button>
      </div>
    ))}
  </div>
);

export const SettingsView = ({ categories, subscriptions, openModal, userEmail, userId, refresh, darkMode, setDarkMode }) => {
  const [budget, setBudget] = useState(categories.monthly_budget || '');
  const [newCat, setNewCat] = useState('');
  const [activeList, setActiveList] = useState('expense');
  const surface = darkMode ? 'border-slate-800 bg-black text-slate-100' : 'border-slate-200 bg-white text-[#0F172A]';
  const surfaceSoft = darkMode ? 'border-slate-800 bg-slate-800 text-slate-100' : 'border-slate-200 bg-[#F8FAFC] text-[#0F172A]';

  const saveBudget = async () => {
    await supabase.from('user_preferences').update({ monthly_budget: Number(budget) }).eq('user_id', userId);
    refresh();
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    const key = activeList === 'expense' ? 'expense_categories' : 'income_categories';
    const currentList = categories[key] || [];
    if (!currentList.includes(newCat.trim())) {
      await supabase.from('user_preferences').update({ [key]: [...currentList, newCat.trim()] }).eq('user_id', userId);
      setNewCat('');
      refresh();
    }
  };

  const removeCategory = async (catToRemove) => {
    const key = activeList === 'expense' ? 'expense_categories' : 'income_categories';
    const newList = categories[key].filter(c => c !== catToRemove);
    await supabase.from('user_preferences').update({ [key]: newList }).eq('user_id', userId);
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`rounded-[24px] border p-4 flex items-center gap-3 ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-100' : 'border-[#D1FAE5] bg-[#ECFDF5] text-[#0F172A]'}`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-[#D1FAE5] text-[#0D9488]'}`}>{userEmail?.[0].toUpperCase()}</div>
        <div className="flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-[0.25em] ${darkMode ? 'text-slate-400' : 'text-[#0D9488]'}`}>Bóveda Asegurada</p>
          <p className="text-xs font-medium text-slate-400 truncate">{userEmail}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className={`rounded-[16px] p-2 transition ${darkMode ? 'text-slate-300 hover:text-[#FECACA]' : 'text-slate-500 hover:text-[#BE123C]'}`}><LogOut size={20} /></button>
      </div>

      <div className={`rounded-[24px] border p-6 shadow-sm ${surface}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Tema</p>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Activa o desactiva el modo oscuro.</p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} className={`rounded-full px-4 py-3 text-sm font-semibold transition ${darkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-[#0F172A] text-white hover:bg-[#34435b]'}`}>
            {darkMode ? 'Desactivar modo oscuro' : 'Activar modo oscuro'}
          </button>
        </div>
      </div>

      <div className={`rounded-[24px] border p-6 shadow-sm ${surface}`}>
        <h3 className={`mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}><Target size={18} className={darkMode ? 'text-slate-300' : 'text-[#4F46E5]'}/> Presupuesto Mensual</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
           <input type="number" value={budget} onChange={(e)=>setBudget(e.target.value)} onBlur={saveBudget} className={`flex-1 rounded-[16px] border ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-100 focus:border-slate-500' : 'border-slate-200 bg-[#F8FAFC] text-[#0F172A] focus:border-[#4F46E5]'} px-4 py-3 text-sm font-semibold outline-none transition`} placeholder="0.00"/>
           <button onClick={saveBudget} className={`rounded-[16px] px-4 py-3 text-sm font-semibold text-white transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}>Guardar</button>
        </div>
      </div>

      <div className={`rounded-[24px] border p-6 shadow-sm ${surface}`}>
        <div className="mb-6 flex items-center justify-between">
           <h3 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}><Repeat size={18} className={darkMode ? 'text-slate-300' : 'text-[#0D9488]'}/> Suscripciones</h3>
           <button onClick={()=>openModal({type: 'subscription'})} className={`text-[10px] font-bold transition ${darkMode ? 'text-slate-100 hover:text-slate-200' : 'text-[#4F46E5] hover:text-[#1E40AF]'}`}>+ Crear</button>
        </div>
        {subscriptions.map(sub => (
          <div key={sub.id} className={`mb-3 flex items-center justify-between rounded-[18px] border p-4 ${darkMode ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-[#F8FAFC]'}`}>
            <div>
              <p className={`font-semibold text-sm ${darkMode ? 'text-slate-100' : 'text-[#0F172A]'}`}>{sub.name}</p>
              <p className={`mt-1 text-[10px] uppercase tracking-[0.18em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Día: {sub.next_payment_date?.split('-')[2]}</p>
            </div>
            <p className={`font-semibold text-sm ${darkMode ? 'text-slate-200' : 'text-[#BE123C]'}`}>{formatCurrency(sub.amount)}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-[24px] border p-6 shadow-sm ${surface}`}>
        <h3 className={`mb-4 text-sm font-semibold uppercase tracking-[0.22em] ${darkMode ? 'text-slate-300' : 'text-slate-500'}`}>Gestionar Categorías</h3>
        <div className={`mb-4 flex gap-2 rounded-[18px] border p-1 ${surfaceSoft}`}>
          <button onClick={() => setActiveList('expense')} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${activeList === 'expense' ? (darkMode ? 'bg-slate-700 text-slate-100' : 'bg-white text-[#0F172A]') : (darkMode ? 'text-slate-400' : 'text-slate-500')}`}>Gastos</button>
          <button onClick={() => setActiveList('income')} className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${activeList === 'income' ? (darkMode ? 'bg-slate-700 text-slate-100' : 'bg-white text-[#0F172A]') : (darkMode ? 'text-slate-400' : 'text-slate-500')}`}>Ingresos</button>
        </div>
        <form onSubmit={addCategory} className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input type="text" value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Ej. ✈️ Viajes" className={`flex-1 rounded-[16px] border px-4 py-3 text-sm outline-none transition ${darkMode ? 'focus:border-slate-500' : 'focus:border-[#4F46E5]'} ${surfaceSoft}`} />
          <button type="submit" className={`rounded-[16px] px-4 py-3 text-sm font-bold text-white transition ${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}>+</button>
        </form>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-2">
          {(activeList === 'expense' ? categories.expense_categories : categories.income_categories)?.map((cat, i) => (
            <div key={i} className={`flex items-center justify-between rounded-[16px] border px-4 py-3 text-sm ${surfaceSoft}`}>
              <span>{cat}</span><button onClick={() => removeCategory(cat)} className={`transition ${darkMode ? 'text-slate-300 hover:text-slate-100' : 'text-slate-500 hover:text-[#BE123C]'}`}><X size={14} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};