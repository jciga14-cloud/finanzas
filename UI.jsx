import React from 'react';
import { ArrowUpRight, ArrowRightLeft, ArrowDownRight, Trash2 } from 'lucide-react';
import { formatCurrency } from './formatters';

export const NavItem = ({ icon, label, active, onClick, layout = 'row', darkMode = false }) => {
  const isFab = !label;
  const isCol = layout === 'col';
  return (
    <button
      onClick={onClick}
      className={
        isFab
          ? `${darkMode ? 'w-12 h-12 rounded-[16px] bg-slate-700 text-slate-100 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.55)]' : 'w-12 h-12 rounded-[16px] bg-[#4F46E5] text-white shadow-[0_12px_30px_-18px_rgba(79,70,229,0.55)]'} flex items-center justify-center transition-transform hover:scale-105 active:scale-95`
          : isCol
            ? `flex flex-col items-center gap-1 text-center transition ${active ? (darkMode ? 'text-slate-100' : 'text-[#4F46E5]') : (darkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-700')}`
            : `flex items-center gap-3 rounded-[18px] px-4 py-3 transition-all ${active ? (darkMode ? 'bg-slate-800 text-slate-100 border border-slate-700' : 'bg-[#EFF6FF] text-[#1E293B] border border-[#DBEAFE]') : (darkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800')}`
      }
    >
      {React.cloneElement(icon, { size: isFab ? 24 : 20, strokeWidth: active ? 2.5 : 2 })}
      {label && <span className={isCol ? "text-[10px] font-medium" : "font-medium"}>{label}</span>}
    </button>
  );
};

export const FabOption = ({ icon, label, color, darkMode = false, onClick }) => {
  const buttonColor = darkMode ? 'bg-slate-700 hover:bg-slate-600' : color;
  const labelColor = darkMode ? 'bg-slate-900 border border-slate-700 text-slate-200' : 'bg-white border border-slate-200 text-slate-600';
  return (
    <div className="flex items-center gap-3">
      <span className={`rounded-[14px] px-3 py-1.5 text-xs font-bold shadow-sm ${labelColor}`}>
        {label}
      </span>
      <button onClick={onClick} className={`w-10 h-10 rounded-full ${buttonColor} text-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] flex items-center justify-center transition-transform hover:scale-105`}>
        {icon}
      </button>
    </div>
  );
};

export const EmptyState = ({ icon, title, desc, darkMode = false }) => (
  <div className={`flex flex-col items-center justify-center rounded-[24px] p-10 text-center shadow-sm ${darkMode ? 'bg-slate-950 border border-slate-800 text-slate-100' : 'bg-white border border-slate-200 text-slate-900'}`}>
    <div className="mb-4">{React.cloneElement(icon, { size: 48, className: darkMode ? 'text-slate-100' : 'text-[#4F46E5]' })}</div>
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className={darkMode ? 'mt-2 text-sm text-slate-400' : 'mt-2 text-sm text-slate-500'}>{desc}</p>
  </div>
);

export const TransactionItem = ({ tx, onDelete, darkMode = false }) => {
  const isInc = tx.type === 'income';
  const isTrans = tx.type === 'transfer';
  const highlightClass = isInc
    ? `${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-[#ECFDF5] text-[#0F766E]'}`
    : isTrans
      ? `${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-[#DBEAFE] text-[#0F172A]'}`
      : `${darkMode ? 'bg-slate-800 text-slate-100' : 'bg-[#FFF1F2] text-[#981B3A]'}`;

  return (
    <div className={`rounded-[20px] p-4 shadow-sm sm:flex sm:items-center sm:justify-between ${darkMode ? 'border border-slate-800 bg-slate-950 text-slate-100' : 'border border-slate-200 bg-white text-slate-900'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-[16px] ${highlightClass}`}>
          {isInc ? <ArrowUpRight size={16} /> : isTrans ? <ArrowRightLeft size={16} /> : <ArrowDownRight size={16} />}
        </div>
        <div>
          <p className="font-semibold text-sm">{tx.description}</p>
          <p className={darkMode ? 'mt-1 text-xs text-slate-400' : 'mt-1 text-xs text-slate-500'}>{tx.date} • {tx.category || 'Movimiento'}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 sm:mt-0">
        <p className={`font-semibold text-sm ${darkMode ? 'text-slate-100' : isInc ? 'text-[#0F766E]' : isTrans ? 'text-[#0F172A]' : 'text-[#981B3A]'}`}>{isInc ? '+' : isTrans ? '' : '-'}{formatCurrency(tx.amount)}</p>
        <button onClick={() => onDelete(tx)} className={`rounded-full p-2 transition ${darkMode ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600 hover:bg-slate-700 hover:text-slate-100' : 'border border-slate-200 bg-slate-50 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500'}`}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};