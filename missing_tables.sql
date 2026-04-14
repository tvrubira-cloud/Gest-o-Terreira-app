-- Script to create missing tables for the message and broadcast feature

-- 1. Create broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id TEXT PRIMARY KEY DEFAULT ('brd-' || gen_random_uuid()::text),
  terreiro_id TEXT REFERENCES public.terreiros(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT DEFAULT '',
  is_global BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create contatos table
CREATE TABLE IF NOT EXISTS public.contatos (
  id TEXT PRIMARY KEY DEFAULT ('ctt-' || gen_random_uuid()::text),
  terreiro_id TEXT REFERENCES public.terreiros(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  assunto TEXT,
  mensagem TEXT NOT NULL,
  status TEXT DEFAULT 'Pendente',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS (and add permissive policies if that matches project pattern)
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;

-- If project uses public access for these (based on supabase_schema.sql pattern):
CREATE POLICY "Allow public read on broadcasts" ON public.broadcasts FOR SELECT USING (true);
CREATE POLICY "Allow public insert on broadcasts" ON public.broadcasts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on broadcasts" ON public.broadcasts FOR UPDATE USING (true);

CREATE POLICY "Allow public read on contatos" ON public.contatos FOR SELECT USING (true);
CREATE POLICY "Allow public insert on contatos" ON public.contatos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on contatos" ON public.contatos FOR UPDATE USING (true);
