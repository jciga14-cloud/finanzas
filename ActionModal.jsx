import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export const ActionModal = ({ config, onClose, userId, categories, creditCards, accounts, deleteEntity, showToast, refresh }) => {
  const [loading, setLoading] = useState(false);
  const { type, isEdit, relatedItem } = config;
  const usableAccounts = accounts.filter(a => a.type !== 'Activo Fijo');

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(categories.expense_categories?.[0] || 'Otros');
  const [accountId, setAccountId] = useState('external');

  useEffect(() => {
    if (isEdit && relatedItem) {
      setName(relatedItem.name || '');
      setAmount(relatedItem.balance ?? relatedItem.pending_balance ?? relatedItem.amount ?? '');
    }
  }, [isEdit, relatedItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (!numAmt || numAmt <= 0) return showToast('Monto inválido', 'error');
    setLoading(true);
    
    try {
      if (isEdit) {
        const table = type === 'account' ? 'accounts' : type === 'card' ? 'credit_cards' : type === 'loan' ? 'loans' : 'subscriptions';
        await supabase.from(table).update({ name, balance: numAmt }).eq('id', relatedItem.id);
      } else {
        if (type === 'account') await supabase.from('accounts').insert([{ name, balance: numAmt, type: 'Ahorro' }]);
        else if (type === 'income' || type === 'expense') {
          await supabase.from('transactions').insert([{ type, amount: numAmt, category, date, description: name, from_account_id: accountId }]);
          if (accountId !== 'external') {
            const acc = accounts.find(a => a.id === accountId);
            await supabase.from('accounts').update({ balance: type === 'expense' ? Number(acc.balance) - numAmt : Number(acc.balance) + numAmt }).eq('id', accountId);
          }
        }
        // Agregar más lógica según tipo...
      }
      refresh();
      onClose();
    } catch (err) { 
      console.error(err); 
      showToast('Error al guardar', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-slide-up max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500">✕</button>
        <h2 className="font-bold text-xl text-slate-200 mb-6 flex justify-between">
          {isEdit ? 'Editar' : 'Nuevo registro'}
          {isEdit && (
            <button 
              onClick={() => deleteEntity(type === 'account' ? 'accounts' : 'credit_cards', relatedItem.id)} 
              className="text-xs text-rose-500 font-bold uppercase"
            >
              Borrar
            </button>
          )}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Monto ($)</label>
            <input 
              type="number" 
              step="any" 
              required 
              value={amount} 
              onChange={(e)=>setAmount(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-3xl font-bold text-emerald-400 outline-none" 
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Descripción</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none" 
              placeholder="Ej. Supermercado"
            />
          </div>
          {['expense', 'income'].includes(type) && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Cuenta de origen</label>
              <select 
                value={accountId} 
                onChange={(e)=>setAccountId(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              >
                {usableAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                <option value="external">Efectivo Externo</option>
              </select>
            </div>
          )}
          <button 
            disabled={loading} 
            type="submit" 
            className="w-full mt-4 bg-emerald-500 text-slate-950 font-bold py-4 rounded-2xl hover:bg-emerald-400 transition disabled:opacity-50 uppercase text-xs tracking-widest"
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
};