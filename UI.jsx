import React from 'react';
import { ArrowUpRight, ArrowRightLeft, ArrowDownRight, Trash2 } from 'lucide-react';
import { formatCurrency } from './formatters';

export const NavItem = ({ icon, label, active, onClick, layout = 'row' }) => {
  const isFab = !label;
  const isCol = layout === 'col';
  return (
    <button
      onClick={onClick}
      className={
        isFab
          ? 'w-12 h-12 rounded-[16px] bg-[#4F46E5] text-white flex items-center justify-center shadow-[0_12px_30px_-18px_rgba(79,70,229,0.55)] transition-transform hover:scale-105 active:scale-95'
          : isCol
            ? `flex flex-col items-center gap-1 text-center transition ${active ? 'text-[#4F46E5]' : 'text-slate-500 hover:text-slate-700'}`
            : `flex items-center gap-3 rounded-[18px] px-4 py-3 transition-all ${active ? 'bg-[#EFF6FF] text-[#1E293B] border border-[#DBEAFE]' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'}`
      }
    >
      {React.cloneElement(icon, { size: isFab ? 24 : 20, strokeWidth: active ? 2.5 : 2 })}
      {label && <span className={isCol ? "text-[10px] font-medium" : "font-medium"}>{label}</span>}
    </button>
  );
};

export const FabOption = ({ icon, label, color, onClick }) => (
  <div className="flex items-center gap-3">
    <span className="rounded-[14px] bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm">
      {label}
    </span>
    <button onClick={onClick} className={`w-10 h-10 rounded-full ${color} text-white shadow-[0_12px_30px_-18px_rgba(15,23,42,0.35)] flex items-center justify-center transition-transform hover:scale-105`}>
      {icon}
    </button>
  </div>
);

export const EmptyState = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center rounded-[24px] bg-white border border-slate-200 p-10 text-center shadow-sm">
    <div className="mb-4">{React.cloneElement(icon, { size: 48, className: 'text-[#4F46E5]' })}</div>
    <h3 className="font-semibold text-lg text-[#0F172A]">{title}</h3>
    <p className="mt-2 text-sm text-slate-500">{desc}</p>
  </div>
);

export const TransactionItem = ({ tx, onDelete }) => {
  const isInc = tx.type === 'income';
  const isTrans = tx.type === 'transfer';
  const highlightClass = isInc
    ? 'bg-[#ECFDF5] text-[#0F766E]'
    : isTrans
      ? 'bg-[#DBEAFE] text-[#0F172A]'
      : 'bg-[#FFF1F2] text-[#981B3A]';

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-[16px] ${highlightClass}`}>
          {isInc ? <ArrowUpRight size={16} /> : isTrans ? <ArrowRightLeft size={16} /> : <ArrowDownRight size={16} />}
        </div>
        <div>
          <p className="font-semibold text-sm text-[#0F172A]">{tx.description}</p>
          <p className="mt-1 text-xs text-slate-500">{tx.date} • {tx.category || 'Movimiento'}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 sm:mt-0">
        <p className={`font-semibold text-sm ${isInc ? 'text-[#0F766E]' : isTrans ? 'text-[#0F172A]' : 'text-[#981B3A]'}`}>{isInc ? '+' : isTrans ? '' : '-'}{formatCurrency(tx.amount)}</p>
        <button onClick={() => onDelete(tx)} className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};