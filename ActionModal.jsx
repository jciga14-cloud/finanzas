import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { formatInputValue, handleBlurFormatting } from './App';

export const ActionModal = ({ config, onClose, userId, categories, creditCards, accounts, deleteEntity, showToast, refresh, darkMode }) => {
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
  const [toAccountId, setToAccountId] = useState('');
  const [installments, setInstallments] = useState('');
  const [accType, setAccType] = useState('Ahorro');

  const titles = { 
    expense: 'Gasto de Cuenta', income: 'Nuevo Ingreso', card: 'Nueva Tarjeta', loan: 'Nuevo Préstamo', account: 'Nueva Cuenta/Activo',
    card_expense: 'Gasto en Tarjeta', pay_card: 'Pagar Tarjeta', pay_loan: 'Pagar Préstamo', transfer: 'Transferencia',
    subscription: 'Nueva Suscripción', pay_subscription: 'Pagar Suscripción'
  };

  const inputTheme = darkMode ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-400' : 'bg-[#F8FAFC] border-slate-200 text-[#0F172A]';
  const focusBorder = darkMode ? 'focus:border-slate-500' : 'focus:border-[#4F46E5]';
  const labelTheme = darkMode ? 'text-slate-300' : 'text-slate-500';
  const cardTheme = darkMode ? 'bg-black border-slate-800 text-slate-100' : 'bg-white border border-slate-200 text-[#0F172A]';
  const surfaceTheme = darkMode ? 'bg-slate-800 border-slate-800 text-slate-100' : 'bg-white border border-slate-200 text-[#0F172A]';
  const dangerButtonTheme = darkMode ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700' : 'border border-[#FECACA] bg-[#FEF2F2] text-[#BE123C] hover:bg-[#FEE2E2]';
  const submitButtonTheme = darkMode ? 'bg-slate-700 text-slate-100 hover:bg-slate-600' : 'bg-[#4F46E5] text-white hover:bg-[#4338CA]';

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
      if (type === 'transfer' && usableAccounts.length > 1) {
        setToAccountId(usableAccounts[1].id);
      }
      if (usableAccounts.length > 0 && accountId === 'external' && ['expense', 'transfer'].includes(type)) setAccountId(usableAccounts[0].id);
    }
  }, [isEdit, relatedItem, type, categories, usableAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmt = Number(amount);
    if (!numAmt && !['card', 'loan', 'account', 'transfer'].includes(type)) return showToast('Monto inválido', 'error');
    setLoading(true);
    
    try {
      let response;
      if (isEdit) {
        const table = type === 'account' ? 'accounts' : type === 'card' ? 'credit_cards' : type === 'loan' ? 'loans' : 'subscriptions';
        const payload = { name };
        if (type === 'account') { payload.balance = numAmt; payload.type = accType; }
        if (type === 'card') { payload.balance = numAmt; payload.bank = bank; payload.limit_amount = Number(limit); payload.cutoff_date = cutoffDate; payload.payment_date = date; }
        if (type === 'loan') { payload.pending_balance = numAmt; payload.total_amount = Number(limit); payload.remaining_installments = Number(installments); payload.payment_date = date; }
        if (type === 'subscription') { payload.amount = numAmt; payload.category = category; payload.account_id = accountId; payload.next_payment_date = date; }
        
        response = await supabase.from(table).update(payload).eq('id', relatedItem.id);
      } else {
        if (type === 'account') response = await supabase.from('accounts').insert([{ user_id: userId, name, balance: numAmt, type: accType }]);
        else if (type === 'card') response = await supabase.from('credit_cards').insert([{ user_id: userId, name, bank, limit_amount: Number(limit), balance: numAmt, cutoff_date: cutoffDate, payment_date: date }]);
        else if (type === 'loan') response = await supabase.from('loans').insert([{ user_id: userId, name, total_amount: Number(limit), pending_balance: numAmt, remaining_installments: Number(installments), payment_date: date }]);
        else if (type === 'subscription') response = await supabase.from('subscriptions').insert([{ user_id: userId, name, amount: numAmt, category, account_id: accountId, next_payment_date: date }]);
        else if (type === 'income' || type === 'expense') {
          response = await supabase.from('transactions').insert([{ user_id: userId, type, amount: numAmt, category, date, description: name, from_account_id: accountId }]);
          if (accountId !== 'external') {
            const acc = accounts.find(a => a.id === accountId);
            await supabase.from('accounts').update({ balance: type === 'expense' ? Number(acc.balance) - numAmt : Number(acc.balance) + numAmt }).eq('id', accountId);
          }
        }
        else if (type === 'card_expense') {
          response = await supabase.from('transactions').insert([{ user_id: userId, type: 'expense', amount: numAmt, category, date, description: `${name} (Tarjeta)`, related_id: relatedItem.id, from_account_id: 'credit_card' }]);
          await supabase.from('credit_cards').update({ balance: Number(relatedItem.balance) + numAmt }).eq('id', relatedItem.id);
        }
        else if (type === 'pay_card') {
           response = await supabase.from('transactions').insert([{ user_id: userId, type: 'card_payment', amount: numAmt, date, description: `Pago: ${relatedItem.name}`, related_id: relatedItem.id, from_account_id: accountId }]);
           await supabase.from('credit_cards').update({ balance: Math.max(0, Number(relatedItem.balance) - numAmt) }).eq('id', relatedItem.id);
           if (accountId !== 'external') {
             const acc = accounts.find(a => a.id === accountId);
             await supabase.from('accounts').update({ balance: Number(acc.balance) - numAmt }).eq('id', accountId);
           }
        }
        else if (type === 'transfer') {
          response = await supabase.from('transactions').insert([{ user_id: userId, type: 'transfer', amount: numAmt, date, description: name, from_account_id: accountId, to_account_id: toAccountId }]);
          const fromAcc = accounts.find(a => a.id === accountId);
          const toAcc = accounts.find(a => a.id === toAccountId);
          if (fromAcc) await supabase.from('accounts').update({ balance: Number(fromAcc.balance) - numAmt }).eq('id', accountId);
          if (toAcc) await supabase.from('accounts').update({ balance: Number(toAcc.balance) + numAmt }).eq('id', toAccountId);
        }
        else if (type === 'pay_loan') {
          response = await supabase.from('transactions').insert([{ user_id: userId, type: 'loan_payment', amount: numAmt, date, description: `Pago Préstamo: ${relatedItem.name}`, related_id: relatedItem.id, from_account_id: accountId, is_full_quota: true }]);
          await supabase.from('loans').update({ 
            pending_balance: Math.max(0, Number(relatedItem.pending_balance) - numAmt),
            remaining_installments: Math.max(0, Number(relatedItem.remaining_installments) - 1)
          }).eq('id', relatedItem.id);
          if (accountId !== 'external') {
            const acc = accounts.find(a => a.id === accountId);
            await supabase.from('accounts').update({ balance: Number(acc.balance) - numAmt }).eq('id', accountId);
          }
        }
        else if (type === 'pay_subscription') {
          response = await supabase.from('transactions').insert([{ user_id: userId, type: 'expense', amount: numAmt, category: relatedItem.category, date, description: `Suscripción: ${relatedItem.name}`, related_id: relatedItem.id, from_account_id: accountId }]);
          if (accountId !== 'external') {
            const acc = accounts.find(a => a.id === accountId);
            await supabase.from('accounts').update({ balance: Number(acc.balance) - numAmt }).eq('id', accountId);
          }
          const nextDate = new Date(relatedItem.next_payment_date);
          nextDate.setMonth(nextDate.getMonth() + 1);
          await supabase.from('subscriptions').update({ next_payment_date: nextDate.toISOString().split('T')[0] }).eq('id', relatedItem.id);
        }
      }
      if (response?.error) throw response.error;
      refresh();
      onClose();
    } catch (err) { 
      console.error(err); 
      showToast(err.message || 'Error al guardar', 'error'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className={`absolute inset-0 ${darkMode ? 'bg-black/80' : 'bg-[#E0F2FE]/80'} backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4`}>
      <div className={`w-full max-w-md rounded-[28px] p-6 shadow-[0_25px_80px_-40px_rgba(15,23,42,0.18)] relative animate-slide-up max-h-[90vh] overflow-y-auto ${cardTheme}`}>
        <button onClick={onClose} className={`absolute top-4 right-4 rounded-full p-2 transition ${darkMode ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100' : 'text-slate-500 hover:bg-[#EFF6FF] hover:text-[#0F172A]'}`}>✕</button>
        <h2 className="font-bold text-xl mb-6 flex justify-between items-center text-current">
          {isEdit ? 'Editar' : (titles[type] || 'Nuevo registro')}
          {isEdit && (
            <button 
              onClick={() => deleteEntity(type === 'account' ? 'accounts' : type === 'card' ? 'credit_cards' : type === 'loan' ? 'loans' : 'subscriptions', relatedItem.id)} 
              className={`rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition ${dangerButtonTheme}`}
            >
              Borrar
            </button>
          )}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'card' && (
            <div>
              <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Banco</label>
              <select required value={bank} onChange={(e)=>setBank(e.target.value)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`}>
                <option value="">Seleccionar Banco</option>
                {panamaBanks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {(type === 'card' || type === 'loan') && (
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>{type === 'card' ? 'Límite Total' : 'Monto Total'}</label>
                 <input type="number" required value={limit} onChange={(e)=>setLimit(e.target.value)} onBlur={(e)=>handleBlurFormatting(e.target.value, setLimit)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`} placeholder="0.00"/>
               </div>
               {type === 'card' ? (
               <div>
                 <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Deuda Actual</label>
                 <input type="number" required value={amount} onChange={(e)=>setAmount(e.target.value)} onBlur={(e)=>handleBlurFormatting(e.target.value, setAmount)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`} placeholder="0.00"/>
               </div>
               ) : (
               <div>
                 <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Cuotas Rest.</label>
                 <input type="number" required value={installments} onChange={(e)=>setInstallments(e.target.value)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`} placeholder="0"/>
               </div>
               )}
            </div>
          )}

          {['expense', 'income', 'card_expense', 'pay_card', 'account', 'subscription', 'transfer', 'pay_loan', 'pay_subscription', 'loan'].includes(type) && (
          <div>
            <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>{type === 'account' ? 'Saldo Inicial ($)' : 'Monto ($)'}</label>
            <input 
              type="number" 
              step="any" 
              required 
              value={amount} 
              onChange={(e)=>setAmount(formatInputValue(e.target.value))} 
              onBlur={(e)=>handleBlurFormatting(e.target.value, setAmount)}
              className={`w-full rounded-[24px] px-4 py-4 text-3xl font-bold outline-none transition ${focusBorder} ${inputTheme}`} 
              placeholder="0.00"
            />
          </div>
          )}

          <div>
            <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>{type === 'card' ? 'Nombre de la Tarjeta' : 'Descripción'}</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
              className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`} 
              placeholder="Ej. Supermercado"
            />
          </div>

          {(type === 'account' || type === 'loan') && (
            <div>
              <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>{type === 'account' ? 'Tipo' : 'Fecha de Pago'}</label>
              {type === 'account' ? (
              <select value={accType} onChange={(e)=>setAccType(e.target.value)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`}>
                <option>Ahorro</option>
                <option>Corriente</option>
                <option>Efectivo</option>
                <option value="Activo Fijo">Activo Fijo</option>
              </select>
              ) : (
                <input type="date" required value={date} onChange={(e)=>setDate(e.target.value)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`}/>
              )}
            </div>
          )}

          {['subscription', 'expense', 'income'].includes(type) && (
            <div>
              <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Categoría</label>
              <select value={category} onChange={(e)=>setCategory(e.target.value)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`}>
                {(type === 'income' ? categories.income_categories : categories.expense_categories)?.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          )}

          {type === 'subscription' && (
            <div>
              <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Cuenta de origen</label>
              <select 
                value={accountId} 
                onChange={(e)=>setAccountId(e.target.value)} 
                className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition focus:border-[#4F46E5] ${inputTheme}`}
              >
                {usableAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                <option value="external">Efectivo Externo</option>
              </select>
            </div>
          )}

          {type === 'subscription' && (
            <div>
              <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Próxima Fecha de Pago</label>
              <input type="date" required value={date} onChange={(e)=>setDate(e.target.value)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition focus:border-[#4F46E5] ${inputTheme}`}/>
            </div>
          )}

          {type === 'transfer' && (
            <div>
              <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Cuenta de destino</label>
              <select 
                required
                value={toAccountId} 
                onChange={(e)=>setToAccountId(e.target.value)} 
                className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition focus:border-[#4F46E5] ${inputTheme}`}
              >
                <option value="">Seleccionar destino</option>
                {usableAccounts.map(a => a.id !== accountId && <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          {type === 'card' && (
            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Día Corte</label>
                 <input type="date" required value={cutoffDate} onChange={(e)=>setCutoffDate(e.target.value)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`}/>
               </div>
               <div>
                 <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Próx Pago</label>
                 <input type="date" required value={date} onChange={(e)=>setDate(e.target.value)} className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition ${focusBorder} ${inputTheme}`}/>
               </div>
            </div>
          )}

          {['expense', 'income', 'pay_card'].includes(type) && (
            <div>
              <label className={`text-[10px] font-bold uppercase mb-2 block tracking-widest ${labelTheme}`}>Cuenta de origen</label>
              <select 
                value={accountId} 
                onChange={(e)=>setAccountId(e.target.value)} 
                className={`w-full rounded-[18px] px-4 py-3 text-sm outline-none transition focus:border-[#4F46E5] ${inputTheme}`}
              >
                {usableAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                <option value="external">Efectivo Externo</option>
              </select>
            </div>
          )}
          <button 
            disabled={loading} 
            type="submit" 
            className={`w-full mt-4 font-bold py-4 rounded-[22px] transition disabled:opacity-50 uppercase text-xs tracking-[0.2em] ${submitButtonTheme}`}
          >
            {loading ? 'Procesando...' : 'Confirmar'}
          </button>
        </form>
      </div>
    </div>
  );
};