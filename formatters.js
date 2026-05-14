export const formatCurrency = (amount) => 
  new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(amount || 0);

export const getDaysUntil = (dateString) => {
  if (!dateString) return null;
  const target = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const formatInputValue = (val) => val === undefined || val === null ? '' : val;

export const handleBlurFormatting = (val, setter) => {
  if (!val) return;
  const num = parseFloat(val);
  if (!isNaN(num)) setter(num.toFixed(2));
};