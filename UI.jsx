import React from 'react';
import { ArrowUpRight, ArrowRightLeft, ArrowDownRight, Trash2 } from 'lucide-react';
import { formatCurrency } from './formatters';

export const NavItem = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
  >
    {React.cloneElement(icon, { size: 20, strokeWidth: active ? 2.5 : 2 })}
    <span className="font-medium">{label}</span>
  </button>
);

export const FabOption = ({ icon, label, color, onClick }) => (
  <div className="flex items-center gap-3">
    <span className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">{label}</span>
    <button onClick={onClick} className={`w-10 h-10 rounded-full ${color} text-white shadow-lg flex items-center justify-center transform hover:scale-110 transition`}>{icon}</button>
  </div>
);

export const EmptyState = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
    <div className="mb-4">{React.cloneElement(icon, { size: 48 })}</div>
    <h3 className="font-bold text-slate-300">{title}</h3>
    <p className="text-xs text-slate-500">{desc}</p>
  </div>
);

export const TransactionItem = ({ tx, onDelete }) => {
  const isInc = tx.type === 'income';
  const isTrans = tx.type === 'transfer';
  return (
    <div className="flex justify-between items-center border-b border-slate-800/50 py-3 last:border-0 group">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isInc ? 'bg-emerald-500/20 text-emerald-400' : isTrans ? 'bg-indigo-500/20 text-indigo-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {isInc ? <ArrowUpRight size={16}/> : isTrans ? <ArrowRightLeft size={16}/> : <ArrowDownRight size={16}/>}
        </div>
        <div>
          <p className="font-semibold text-sm text-slate-200">{tx.description}</p>
          <p className="text-[10px] text-slate-500">{tx.date} • {tx.category || 'Movimiento'}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className={`font-bold text-sm ${isInc ? 'text-emerald-400' : isTrans ? 'text-indigo-400' : 'text-slate-300'}`}>
          {isInc ? '+' : isTrans ? '' : '-'}{formatCurrency(tx.amount)}
        </p>
        <button onClick={() => onDelete(tx)} className="text-slate-600 hover:text-rose-500 transition p-1 bg-slate-900 rounded-full border border-slate-800">
          <Trash2 size={12}/>
        </button>
      </div>
    </div>
  );
};