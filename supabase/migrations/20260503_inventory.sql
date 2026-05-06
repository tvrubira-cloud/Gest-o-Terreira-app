CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  terreiro_id TEXT REFERENCES terreiros(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT '',
  unit TEXT DEFAULT 'un',
  current_stock NUMERIC DEFAULT 0,
  minimum_stock NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terreiro_members_inventory" ON inventory_items FOR ALL USING (terreiro_id IN (SELECT terreiro_id FROM users WHERE id = auth.uid()::text));

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  terreiro_id TEXT REFERENCES terreiros(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'un',
  estimated_price NUMERIC DEFAULT 0,
  purchased BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "terreiro_members_shopping" ON shopping_list_items FOR ALL USING (terreiro_id IN (SELECT terreiro_id FROM users WHERE id = auth.uid()::text));
