-- Correções Rápidas - Funcionalidades Essenciais
-- Executar no Supabase SQL Editor

-- ============================================
-- 1. Endereço da obra na tabela solicitacoes
-- ============================================
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS endereco_obra TEXT DEFAULT '';
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS cidade_obra TEXT DEFAULT '';
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS estado_obra TEXT DEFAULT '';
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS cep_obra TEXT DEFAULT '';
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS obs_obra TEXT DEFAULT '';

-- ============================================
-- 3. Novo status: aguardando_confirmacao
-- ============================================
-- Adicionar comentário documentando valores válidos
-- Status válidos: pendente, recusado, agendado, aguardando_confirmacao, finalizado, cancelado

-- ============================================
-- 4. Campos financeiros na tabela ordens
-- ============================================
ALTER TABLE ordens ADD COLUMN IF NOT EXISTS valor_unit NUMERIC(10,2) DEFAULT 0;
ALTER TABLE ordens ADD COLUMN IF NOT EXISTS valor_total NUMERIC(10,2) DEFAULT 0;

-- ============================================
-- 7. Tabela favoritos (já existe, confirmar)
-- ============================================
-- A tabela 'favoritos' já foi criada em features-v3.sql
-- Verificar se existe e garantir RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'favoritos'
  ) THEN
    CREATE TABLE favoritos (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      uid_cliente UUID NOT NULL REFERENCES usuarios(id),
      uid_dono UUID NOT NULL REFERENCES usuarios(id),
      criado_em TIMESTAMP DEFAULT now(),
      UNIQUE(uid_cliente, uid_dono)
    );
    ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- RLS policies para favoritos
DROP POLICY IF EXISTS "Users can view own favoritos" ON favoritos;
CREATE POLICY "Users can view own favoritos" ON favoritos FOR SELECT USING (uid_cliente = auth.uid());
DROP POLICY IF EXISTS "Users can manage own favoritos" ON favoritos;
CREATE POLICY "Users can manage own favoritos" ON favoritos FOR ALL USING (uid_cliente = auth.uid());

-- Index
CREATE INDEX IF NOT EXISTS idx_favoritos_cliente ON favoritos(uid_cliente);
CREATE INDEX IF NOT EXISTS idx_favoritos_dono ON favoritos(uid_dono);

-- ============================================
-- 9. Garantir que solicitacoes tem índice para paginação
-- ============================================
CREATE INDEX IF NOT EXISTS idx_solicitacoes_cliente ON solicitacoes(uid_cliente, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_solicitacoes_dono ON solicitacoes(uid_dono_bomba, criado_em DESC);
