CREATE TABLE IF NOT EXISTS cash_flow_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  terreiro_id TEXT REFERENCES terreiros(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('recebimento','pagamento','previsao_recebimento','previsao_pagamento')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  realized BOOLEAN DEFAULT false,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terreiro_members_cash_flow" ON cash_flow_entries FOR ALL USING (terreiro_id IN (SELECT terreiro_id FROM users WHERE id = auth.uid()::text));
