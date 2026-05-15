import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { formatInputValue, handleBlurFormatting } from './App';

export const ActionModal = ({ config, onClose, userId, categories, creditCards, accounts, deleteEntity, showToast, refresh }) => {
  const [loading, setLoading] = useState(false);
  const { type, isEdit, relatedItem } = config;
  const usableAccounts = accounts.filter(a => a.type !== 'Activo Fijo');

  const panamaBanks = ['Banco General', 'BAC', 'Banesco', 'Banistmo', 'Banco Nacional', 'Banco Panamá', 'Banco Azteca', 'Multibank', 'Capital Bank', 'Banco Delta'];

  const [amount, setAmount] = useState('');
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(categories.expense_categories?.[0] || 'Otros');
  const [accountId, setAccountId] = useState('external');

  // Estados adicionales para tipos específicos
  const [bank, setBank] = useState('');
  const [limit, setLimit] = useState('');
  const [cutoffDate, setCutoffDate] = useState('');
  const [installments, setInstallments] = useState('');
  const [accType, setAccType] = useState('Ahorro');

  const titles = { 
    expense: 'Gasto de Cuenta', income: 'Nuevo Ingreso', card: 'Nueva Tarjeta', loan: 'Nuevo Préstamo', account: 'Nueva Cuenta/Activo',
    card_expense: 'Gasto en Tarjeta', pay_card: 'Pagar Tarjeta', pay_loan: 'Pagar Préstamo', transfer: 'Transferencia',
    subscription: 'Nueva Suscripción', pay_subscription: 'Pagar Suscripción'
  };

  useEffect(() => {
    if (isEdit && relatedItem) {
      setName(relatedItem.name || '');
      setAmount(relatedItem.balance ?? relatedItem.pending_balance ?? relatedItem.amount ?? '');
      if (type === 'account') setAccType(relatedItem.type);
      if (type === 'card') { 
        setBank(relatedItem.bank || ''); 
        setLimit(relatedItem.limit_amount || ''); 
        setCutoffDate(relatedItem.cutoff_date || ''); 
        setDate(relatedItem.payment_date || ''); 
      }
      if (type === 'loan') { 
        setLimit(relatedItem.total_amount || ''); 
        setInstallments(relatedItem.remaining_installments || ''); 
        setDate(relatedItem.payment_date || ''); 
      }
      if (type === 'subscription') {
        setCategory(relatedItem.category || categories.expense_categories?.[0] || 'Otros');
        setAccountId(relatedItem.account_id || usableAccounts[0]?.id || 'external');
        setDate(relatedItem.next_payment_date || '');
      }
    } else {
      if (type === 'income') setCategory(categories.income_categories?.[0] || 'Ingreso');
      if (type === 'subscription') {
        setCategory(categories.expense_categories?.[0] || 'Otros');
        setAccountId(usableAccounts.length > 0 ? usableAccounts[0].id : 'external');
      }
      if (usableAccounts.length > 0 && accountId === 'external' && ['expense', 'transfer'].includes(type)) setAccountId(usableAccounts[0].id);
    }
  }, [isEdit, relatedItem, type, categories, usableAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (!numAmt && !['card', 'loan', 'account'].includes(type)) return showToast('Monto inválido', 'error');
    setLoading(true);
    
    try {
      if (isEdit) {
        const table = type === 'account' ? 'accounts' : type === 'card' ? 'credit_cards' : type === 'loan' ? 'loans' : 'subscriptions';
        const payload = { name };
        if (type === 'account') { payload.balance = numAmt; payload.type = accType; }
        if (type === 'card') { payload.balance = numAmt; payload.bank = bank; payload.limit_amount = Number(limit); payload.cutoff_date = cutoffDate; payload.payment_date = date; }
        if (type === 'loan') { payload.pending_balance = numAmt; payload.total_amount = Number(limit); payload.remaining_installments = Number(installments); payload.payment_date = date; }
        if (type === 'subscription') { payload.amount = numAmt; payload.category = category; payload.account_id = accountId; payload.next_payment_date = date; }
        
        await supabase.from(table).update(payload).eq('id', relatedItem.id);
      } else {
        if (type === 'account') await supabase.from('accounts').insert([{ user_id: userId, name, balance: numAmt, type: accType }]);
        else if (type === 'card') await supabase.from('credit_cards').insert([{ user_id: userId, name, bank, limit_amount: Number(limit), balance: numAmt, cutoff_date: cutoffDate, payment_date: date }]);
        else if (type === 'loan') await supabase.from('loans').insert([{ user_id: userId, name, total_amount: Number(limit), pending_balance: numAmt, remaining_installments: Number(installments), payment_date: date }]);
        else if (type === 'subscription') await supabase.from('subscriptions').insert([{ user_id: userId, name, amount: numAmt, category, account_id: accountId, next_payment_date: date }]);
        else if (type === 'income' || type === 'expense') {
          await supabase.from('transactions').insert([{ user_id: userId, type, amount: numAmt, category, date, description: name, from_account_id: accountId }]);
          if (accountId !== 'external') {
            const acc = accounts.find(a => a.id === accountId);
            await supabase.from('accounts').update({ balance: type === 'expense' ? Number(acc.balance) - numAmt : Number(acc.balance) + numAmt }).eq('id', accountId);
          }
        }
        else if (type === 'card_expense') {
          await supabase.from('transactions').insert([{ user_id: userId, type: 'expense', amount: numAmt, category, date, description: `${name} (Tarjeta)`, related_id: relatedItem.id, from_account_id: 'credit_card' }]);
          await supabase.from('credit_cards').update({ balance: Number(relatedItem.balance) + numAmt }).eq('id', relatedItem.id);
        }
        else if (type === 'pay_card') {
           await supabase.from('transactions').insert([{ user_id: userId, type: 'card_payment', amount: numAmt, date, description: `Pago: ${relatedItem.name}`, related_id: relatedItem.id, from_account_id: accountId }]);
           await supabase.from('credit_cards').update({ balance: Math.max(0, Number(relatedItem.balance) - numAmt) }).eq('id', relatedItem.id);
           if (accountId !== 'external') {
             const acc = accounts.find(a => a.id === accountId);
             await supabase.from('accounts').update({ balance: Number(acc.balance) - numAmt }).eq('id', accountId);
           }
        }
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
          {isEdit ? 'Editar' : (titles[type] || 'Nuevo registro')}
          {isEdit && (
            <button 
              onClick={() => deleteEntity(type === 'account' ? 'accounts' : type === 'card' ? 'credit_cards' : type === 'loan' ? 'loans' : 'subscriptions', relatedItem.id)} 
              className="text-xs text-rose-500 font-bold uppercase"
            >
              Borrar
            </button>
          )}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'card' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Banco</label>
              <select required value={bank} onChange={(e)=>setBank(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none">
                <option value="">Seleccionar Banco</option>
                {panamaBanks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {type === 'card' && (
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Límite Total</label>
                 <input type="number" required value={limit} onChange={(e)=>setLimit(e.target.value)} onBlur={(e)=>handleBlurFormatting(e.target.value, setLimit)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none" placeholder="0.00"/>
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Deuda Actual</label>
                 <input type="number" required value={amount} onChange={(e)=>setAmount(e.target.value)} onBlur={(e)=>handleBlurFormatting(e.target.value, setAmount)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none" placeholder="0.00"/>
               </div>
            </div>
          )}

          {['expense', 'income', 'card_expense', 'pay_card', 'account', 'subscription'].includes(type) && (
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">{type === 'account' ? 'Saldo Inicial ($)' : 'Monto ($)'}</label>
            <input 
              type="number" 
              step="any" 
              required 
              value={amount} 
              onChange={(e)=>setAmount(formatInputValue(e.target.value))} 
              onBlur={(e)=>handleBlurFormatting(e.target.value, setAmount)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-3xl font-bold text-emerald-400 outline-none" 
              placeholder="0.00"
            />
          </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">{type === 'card' ? 'Nombre de la Tarjeta' : 'Descripción'}</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none" 
              placeholder="Ej. Supermercado"
            />
          </div>

          {type === 'account' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Tipo</label>
              <select value={accType} onChange={(e)=>setAccType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none">
                <option>Ahorro</option>
                <option>Corriente</option>
                <option>Efectivo</option>
                <option value="Activo Fijo">Activo Fijo</option>
              </select>
            </div>
          )}

          {type === 'subscription' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Categoría</label>
              <select value={category} onChange={(e)=>setCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none">
                {categories.expense_categories?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}

          {type === 'subscription' && (
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

          {type === 'subscription' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Próxima Fecha de Pago</label>
              <input type="date" required value={date} onChange={(e)=>setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"/>
            </div>
          )}

          {type === 'card' && (
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Día Corte</label>
                 <input type="date" required value={cutoffDate} onChange={(e)=>setCutoffDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"/>
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-widest">Próx Pago</label>
                 <input type="date" required value={date} onChange={(e)=>setDate(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"/>
               </div>
            </div>
          )}

          {['expense', 'income', 'pay_card'].includes(type) && (
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