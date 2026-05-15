-- 1. Crear tablas
CREATE TABLE IF NOT EXISTS accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL, -- 'income', 'expense', 'transfer', 'card_payment', 'loan_payment'
  category TEXT,
  date DATE DEFAULT CURRENT_DATE,
  description TEXT,
  from_account_id TEXT, -- Puede ser ID de cuenta o 'external'
  to_account_id TEXT,
  related_id TEXT, -- ID de tarjeta o préstamo relacionado
  is_full_quota BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  bank TEXT,
  limit_amount DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2) DEFAULT 0,
  cutoff_date DATE,
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  pending_balance DECIMAL(12,2) NOT NULL,
  remaining_installments INTEGER NOT NULL,
  payment_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT,
  account_id TEXT,
  next_payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid REFERENCES auth.users PRIMARY KEY DEFAULT auth.uid(),
  monthly_budget DECIMAL(12,2) DEFAULT 1000,
  income_categories TEXT[] DEFAULT ARRAY['💰 Salario', '💼 Negocio', '📈 Inversiones', '🎁 Otros'],
  expense_categories TEXT[] DEFAULT ARRAY['🛒 Alimentos', '🚗 Transporte', '💡 Servicios', '🎬 Ocio', '💊 Salud', '📚 Educación', '📦 Otros']
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas (Ejemplo para accounts, repetir para las demás)
DROP POLICY IF EXISTS "Users can manage their own accounts" ON accounts;
CREATE POLICY "Users can manage their own accounts" ON accounts 
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Users can manage their own transactions" ON transactions;
CREATE POLICY "Users can manage their own transactions" ON transactions 
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Users can manage their own credit_cards" ON credit_cards;
CREATE POLICY "Users can manage their own credit_cards" ON credit_cards 
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Users can manage their own loans" ON loans;
CREATE POLICY "Users can manage their own loans" ON loans 
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Users can manage their own subscriptions" ON subscriptions;
CREATE POLICY "Users can manage their own subscriptions" ON subscriptions 
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

DROP POLICY IF EXISTS "Users can manage their own user_preferences" ON user_preferences;
CREATE POLICY "Users can manage their own user_preferences" ON user_preferences 
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');