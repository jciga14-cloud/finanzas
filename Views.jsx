import React, { useState } from 'react';
import { 
  Target, AlertCircle, Repeat, Wallet, 
  Edit2, CreditCard, Landmark, LogOut, Car, Activity
} from 'lucide-react';
import { formatCurrency } from './formatters';
import { EmptyState, TransactionItem } from './UI';
import { supabase } from './supabaseClient';

export const DashboardView = ({ stats, transactions, categories, deleteTx, openModal }) => {
  const recentTx = transactions.slice(0, 5);
  const budget = categories.monthly_budget || 0;
  const budgetProgress = budget > 0 ? Math.min((stats.totalExpenses / budget) * 100, 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <p className="text-slate-400 text-sm mb-1 font-medium">Flujo de Caja Mensual</p>
        <h2 className={`text-4xl font-bold ${stats.cashFlow < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
          {formatCurrency(stats.cashFlow)}
        </h2>
        <div className="flex gap-4 mt-6">
          <div className="flex-1 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
             <p className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Ingresos</p>
             <p className="font-bold text-slate-200">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div className="flex-1 bg-slate-950/50 p-3 rounded-2xl border border-slate-800">
             <p className="text-[10px] text-rose-400 font-bold uppercase mb-1">Gastos</p>
             <p className="font-bold text-slate-200">{formatCurrency(stats.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {budget > 0 && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-bold text-slate-300 text-xs flex items-center gap-2 uppercase"><Target size={14} className="text-indigo-400"/> Presupuesto</h3>
            <span className="text-[10px] font-bold text-slate-500">{budgetProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 mb-2 border border-slate-800 overflow-hidden">
            <div className={`h-full transition-all duration-1000 ${stats.totalExpenses > budget ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${budgetProgress}%` }}></div>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-500">
            <span>{formatCurrency(stats.totalExpenses)}</span>
            <span>Meta: {formatCurrency(budget)}</span>
          </div>
        </div>
      )}

      {stats.upcoming.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-300 text-sm flex items-center gap-2"><AlertCircle size={16} className="text-amber-500"/> Pendientes</h3>
          {stats.upcoming.map((u, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
              <div>
                <p className="font-bold text-sm text-slate-200">{u.name}</p>
                <p className={`text-[10px] ${u.isLate ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>{u.isLate ? '¡Atrasado!' : `Faltan ${u.days} días`}</p>
              </div>
              <button onClick={() => openModal({type: u.type === 'Subscription' ? 'pay_subscription' : 'pay_card', relatedItem: u})} className="bg-slate-800 text-emerald-400 text-[10px] px-3 py-1 rounded-lg border border-slate-700 font-bold">Pagar</button>
            </div>
          ))}
        </div>
      )}

      <div>
        <h3 className="font-bold text-slate-300 text-sm mb-3">Actividad Reciente</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          {recentTx.map(tx => <TransactionItem key={tx.id} tx={tx} onDelete={deleteTx} />)}
        </div>
      </div>
    </div>
  );
};

export const AccountsView = ({ accounts, transactions, openModal, deleteTx }) => {
  const liquid = accounts.filter(a => a.type !== 'Activo Fijo');
  const assets = accounts.filter(a => a.type === 'Activo Fijo');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-xl text-slate-200">Mis Cuentas</h2>
        <button onClick={() => openModal({type: 'account'})} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-wider">Añadir</button>
      </div>
      
      {liquid.map(acc => (
        <div key={acc.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-emerald-400"><Wallet size={20}/></div>
              <div><h3 className="font-bold text-slate-200 leading-none">{acc.name}</h3><p className="text-[10px] text-slate-500 uppercase mt-1 tracking-widest">{acc.type}</p></div>
            </div>
            <button onClick={() => openModal({type: 'account', isEdit: true, relatedItem: acc})} className="text-slate-600 hover:text-emerald-400 transition"><Edit2 size={16}/></button>
          </div>
          <p className="text-3xl font-bold text-emerald-400">{formatCurrency(acc.balance)}</p>
        </div>
      ))}

      {assets.length > 0 && (
        <div className="pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Activos Fijos</h3>
          {assets.map(asset => (
            <div key={asset.id} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center mb-3">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-400"><Car size={16}/></div>
                  <h4 className="font-bold text-sm text-slate-300">{asset.name}</h4>
               </div>
               <p className="font-bold text-slate-300">{formatCurrency(asset.balance)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const CreditCardsView = ({ cards, openModal }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="font-bold text-xl text-slate-200">Tarjetas</h2>
      <button onClick={() => openModal({type: 'card'})} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase">Nueva</button>
    </div>
    {cards.map(card => (
      <div key={card.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex justify-between mb-6">
          <div><h3 className="font-bold text-slate-200">{card.name}</h3><p className="text-[10px] text-slate-500 uppercase tracking-widest">{card.bank}</p></div>
          <button onClick={() => openModal({type: 'card', isEdit: true, relatedItem: card})} className="text-slate-600 hover:text-emerald-400 transition"><Edit2 size={16}/></button>
        </div>
        <div className="flex justify-between items-end mb-4">
          <div><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Deuda</p><p className="text-2xl font-bold text-rose-400">{formatCurrency(card.balance)}</p></div>
          <div className="text-right"><p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Límite</p><p className="text-sm font-bold text-slate-400">{formatCurrency(card.limit_amount)}</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal({type: 'card_expense', relatedItem: card})} className="flex-1 bg-slate-800 text-rose-400 font-bold py-2 rounded-xl text-[10px] uppercase border border-slate-700">Gasto</button>
          <button onClick={() => openModal({type: 'pay_card', relatedItem: card})} className="flex-1 bg-emerald-500/20 text-emerald-400 font-bold py-2 rounded-xl text-[10px] uppercase border border-emerald-500/20">Pagar</button>
        </div>
      </div>
    ))}
    {cards.length === 0 && <EmptyState icon={<CreditCard/>} title="Sin tarjetas" desc="Agrega tu primera tarjeta para controlarla." />}
  </div>
);

export const LoansView = ({ loans, openModal }) => (
  <div className="space-y-6 animate-fade-in">
    <div className="flex justify-between items-center">
      <h2 className="font-bold text-xl text-slate-200">Préstamos</h2>
      <button onClick={() => openModal({type: 'loan'})} className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase">Nuevo</button>
    </div>
    {loans.map(loan => (
      <div key={loan.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex justify-between mb-4">
          <h3 className="font-bold text-slate-200">{loan.name}</h3>
          <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-md font-bold">{loan.remaining_installments} cuotas</span>
        </div>
        <p className="text-2xl font-bold text-rose-400 mb-4">{formatCurrency(loan.pending_balance)}</p>
        <button onClick={() => openModal({type: 'pay_loan', relatedItem: loan})} className="w-full bg-emerald-500/10 text-emerald-400 font-bold py-3 rounded-2xl text-[10px] uppercase border border-emerald-500/20">Pagar Cuota</button>
      </div>
    ))}
  </div>
);

export const SettingsView = ({ categories, subscriptions, openModal, userEmail, refresh }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">{userEmail?.[0].toUpperCase()}</div>
        <div className="flex-1">
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Bóveda Asegurada</p>
          <p className="text-xs text-slate-400 font-medium truncate">{userEmail}</p>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="text-slate-600 hover:text-rose-400 transition p-2"><LogOut size={20}/></button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div className="flex justify-between items-center mb-6">
           <h3 className="font-bold text-slate-300 flex items-center gap-2 text-sm uppercase"><Repeat size={18} className="text-emerald-500"/> Suscripciones</h3>
           <button onClick={()=>openModal({type: 'subscription'})} className="text-[10px] font-bold text-emerald-400">+ Crear</button>
        </div>
        {subscriptions.map(sub => (
          <div key={sub.id} className="flex justify-between items-center bg-slate-950/50 border border-slate-800 p-4 rounded-2xl mb-2">
            <div><p className="font-bold text-sm text-slate-200">{sub.name}</p><p className="text-[10px] text-slate-500 uppercase">Día: {sub.next_payment_date?.split('-')[2]}</p></div>
            <p className="font-bold text-rose-400 text-sm">{formatCurrency(sub.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};