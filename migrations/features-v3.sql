-- 1. Tabela avaliacoes (ratings)
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid_avaliador UUID NOT NULL REFERENCES usuarios(id),
  uid_avaliado UUID NOT NULL REFERENCES usuarios(id),
  nota INT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  tipo_avaliacao TEXT NOT NULL CHECK (tipo_avaliacao IN ('dono', 'cliente')),
  solicitacao_id UUID,
  criado_em TIMESTAMP DEFAULT now()
);

-- 2. Colunas na tabela usuarios para perfil
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_url TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS verificado BOOLEAN DEFAULT false;

-- 3. Colunas em bombas para multi-bomba
ALTER TABLE bombas ADD COLUMN IF NOT EXISTS descricao TEXT DEFAULT '';
ALTER TABLE bombas ADD COLUMN IF NOT EXISTS manutencao BOOLEAN DEFAULT false;
ALTER TABLE bombas ADD COLUMN IF NOT EXISTS cidades_atendidas TEXT[] DEFAULT '{}';

-- 4. Tabela favoritos (clientes salvam donos)
CREATE TABLE IF NOT EXISTS favoritos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid_cliente UUID NOT NULL REFERENCES usuarios(id),
  uid_dono UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMP DEFAULT now(),
  UNIQUE(uid_cliente, uid_dono)
);

-- 5. Pedidos recorrentes (templates)
CREATE TABLE IF NOT EXISTS pedidos_recorrentes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid_cliente UUID NOT NULL REFERENCES usuarios(id),
  uid_dono_bomba UUID NOT NULL REFERENCES usuarios(id),
  uid_bomba UUID,
  volume DOUBLE PRECISION,
  observacoes TEXT,
  nome_recorrente TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT now()
);

-- 6. Colunas em solicitacoes para timeline
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS timeline_status JSONB DEFAULT '[]'::jsonb;

-- 7. Chat messages por solicitacao
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitacao_id UUID REFERENCES solicitacoes(id) ON DELETE CASCADE,
  uid_usuario UUID NOT NULL REFERENCES usuarios(id),
  nome_usuario TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT now()
);

-- 8. RLS policies
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view avaliacoes" ON avaliacoes FOR SELECT USING (true);
CREATE POLICY "Users can create avaliacoes" ON avaliacoes FOR INSERT WITH CHECK (uid_avaliador = auth.uid());

ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own favoritos" ON favoritos FOR SELECT USING (uid_cliente = auth.uid());
CREATE POLICY "Users can manage own favoritos" ON favoritos FOR ALL USING (uid_cliente = auth.uid());

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chat messages" ON chat_messages FOR SELECT USING (solicitacao_id IN (SELECT id FROM solicitacoes WHERE uid_cliente = auth.uid() OR uid_dono_bomba = auth.uid()));
CREATE POLICY "Users can send chat messages" ON chat_messages FOR INSERT WITH CHECK (uid_usuario = auth.uid());

ALTER TABLE pedidos_recorrentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recorrentes" ON pedidos_recorrentes FOR SELECT USING (uid_cliente = auth.uid());
CREATE POLICY "Users can manage own recorrentes" ON pedidos_recorrentes FOR ALL USING (uid_cliente = auth.uid());

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliado ON avaliacoes(uid_avaliado);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_avaliador ON avaliacoes(uid_avaliador);
CREATE INDEX IF NOT EXISTS idx_favoritos_cliente ON favoritos(uid_cliente);
CREATE INDEX IF NOT EXISTS idx_chat_solicitacao ON chat_messages(solicitacao_id);
CREATE INDEX IF NOT EXISTS idx_recorrentes_cliente ON pedidos_recorrentes(uid_cliente, ativo);
