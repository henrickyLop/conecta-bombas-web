# 🏗️ Conecta Bombas v3.0 — Roadmap de Features

## Status: Todas as 14 features serão implementadas (exc. Agendamento Futuro - já existe)

---

### Fase 1 — Infra (BANCO + CONFIG)
**Arquivo**: `migrations/features-v3.sql`
1. Tabela `avaliacoes` (cliente avalia dono, dono avalia cliente)
2. Coluna `verificado` (boolean) na tabela `usuarios`
3. Tabela `favoritos` (cliente saves donos)
4. Tabela `pedidos_recurrentes` (template de repetição)
5. Colunas adicionais em `bombas`: fotos (jsonb array), descricao (text)
6. Colunas em `solicitacoes`: timeline_status (jsonb), chat_messages (jsonb)
7. Colunas em `usuarios`: foto_url (text), bio (text), tempo_plataforma (text)

### Fase 2 — Feature: Meu Perfil
**Arquivo**: `src/app/(dashboard)/perfil/page.tsx` (novo, acessível por todos)
- Foto, nome, email, telefone, cidade/estado
- Dono: lista de bombas, selo verificação, tempo na plataforma
- Cliente: favoritos, histórico resumido
- Botão editar bio/foto
- Link no Sidebar para todos

### Fase 3 — Feature: Selo de Verificação
- Admin: botão "Verificar" na pendentes/usuarios page
- Badge "✓ Verificado" no perfil cards
- Selo gold no dashboard do dono verificado

### Fase 4 — Feature: Avaliação Pós-Serviço
**Arquivo**: `src/app/(dashboard)/avaliar/[id]/page.tsx` (novo)
- Dialog aparece quando dono finaliza (cliente avalia)
- Quando cliente finaliza (dono avalia)
- Tabela `avaliacoes`: id, uid_avaliador, uid_avaliado, nota (1-5), comentario, criado_em
- Rating médio no profile do dono
- Badges automáticos: "⭐ 5 estrelas x serviços"

### Phase 5 — Feature: Multi-Bomba
- Dono pode cadastrar bombas ilimitadas
- Formulario expandido: nome, tipo, capacidade, descricao, status (disponivel/manutencao)
- Gerenciamento: /dono/bombas (novo)
- Busca do cliente mostra BOMBA específica, não apenas dono

### Phase 6 — Feature: Favoritos
- Botão ❤️ em cada bomba no card de busca
- Lista de favoritos em /cliente/favoritos (novo)
- Link no sidebar do cliente
- Salvos no localStorage (não requer tabela)

### Phase 7 — Feature: Pedidos Recorrentes
- Botão "Repetir Pedido" no historico
- Clona dados da solicitacao anterior
- Abre dialog para confirmar/editar antes de enviar
- Link "Salvar como modelo"

### Phase 8 — Feature: Timeline Visual
- Timeline bar em cada solicitação: Pedido → Aguardando → Aceito → Finalizado
- Barra visual com cores/icons
- Status sync com backend
- Dialog de detalhes mostra timeline grande

### Phase 9 — Feature: Painel do Dono (Meus Números)
- Expandir dashboard atual:
  - Número grande: serviços este mês
  - Taxa de aceitação %
  - Valor total estimado (volume × preco_medio)
  - Gráfico: serviços por semana (últimos 4 semanas)
  - Ranking local (se houver avaliações)

### Phase 10 — Feature: Histórico do Cliente
- Expandir /cliente/solicitacoes com:
  - Filtro por data (este mês, 3 meses, custom)
  - Contador: total de serviços, volume total
  - Export simples (lista limpa)
  - Busca por nome do dono

### Phase 11 — Feature: Painel do Admin
- Expandir /admin com dashboard visual:
  - Cards: Pendentes, Ativos hoje, Concluidos semana, Novos cadastros
  - Gráfico de barras: cadastros por semana
  - Gráfico de pizza: status de serviços
  - Top donos por volume
  - Alertas: usuários pendentes > 7 dias

### Phase 12 — Feature: Onboarding Guiado
- Tela modal de 3 steps quando usuario novo entra
- Icon + texto grande + botão "Próximo"
- Salva `onboarding_complete` no localStorage
- Skip para admin (admin já sabe)

### Phase 13 — Feature: Modo Offline (PWA)
- manifest.json
- Service worker para cache estático
- Service worker para ações pendentes (queue)
- Badge "Offline" quando sem conexão
- Sync automático quando volta

### Phase 14 — Feature: Chat Interno + WhatsApp Fallback
- Tabela `chat_messages` ou usar coluna jsonb em solicitacoes
- Componente de chat simples por solicitação
- Se 15 min sem resposta → "Mandar WhatsApp?"
- Link direto para sidebar do serviço

---

## Prioridade de Execução
1. Banco (migration) ← FAZER PRIMEIRO
2. Perfil + Selo ← quick win visual
3. Avaliações ← confiança
4. Favoritos ← quick win funcional
5. Pedidos Recorrentes ← quick win
6. Multi-Bomba ← funcionalidade core
7. Timeline Visual ← usabilidade
8. Painel Dono / Histórico / Admin ← relatórios
9. Onboarding ← usabilidade
10. Chat ← complexo, deixar pro final
11. Modo Offline ← técnico, PWA

## Notas Técnicas
- Supabase já tem tudo que precisamos (auth, storage, realtime)
- Não precisa de backend extra
- localStorage para favoritos e onboarding
- JSON columns no Supabase para dados complexos
- Todas features são implementáveis com stack atual
