-- ========================================
-- Conecta Bombas v2.0 - Database Migration
-- ========================================

-- 1. Adicionar cidades atendidas na tabela bombas
ALTER TABLE bombas ADD COLUMN IF NOT EXISTS cidades_atendidas TEXT[] DEFAULT '{}';

-- 2. Adicionar lat/lng para mapa (nullable)
ALTER TABLE bombas ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE bombas ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

-- 3. Adicionar telefone_dono na tabela bombas (para WhatsApp)
ALTER TABLE bombas ADD COLUMN IF NOT EXISTS telefone_dono TEXT DEFAULT '';
