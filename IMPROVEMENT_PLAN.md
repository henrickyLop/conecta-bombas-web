# Conecta Bombas - Melhorias v2.0
## Plano de Implementação

### 1. Banco de Dados (SQL)
- Adicionar `cidades_atendidas` (array de textos) na tabela `bombas`
- Mudar status de solicitacoes: `pendente` → `agendado`, `aceita` → `agendado`, `recusada` → `cancelada`
- Mudar status de ordens: `confirmada` → `agendado`, `pendente` → `agendado`
- Criar política de RLS para cidades_atendidas

### 2. Tipos (types.ts)
- Atualizar Bomba: adicionar `cidades_atendidas: string[]`
- Atualizar Solicitacao/Ordem: status `'agendado' | 'finalizado' | 'cancelado'`

### 3. Cadastro de Dono (cadastro/page.tsx)
- Adicionar campo de cidades atendidas com tags (múltiplas)
- Inserir cidades no array `cidades_atendidas`

### 4. Gestão de Bombas do Dono (dono/bombas)
- Se não existe, criar página pro dono gerenciar suas bombas + cidades atendidas

### 5. Busca Inteligente (cliente/buscar/page.tsx)
- Dropdown de cidades: query DISTINCT de cidades_atendidas de bombas aprovadas
- Mapa com Leaflet + OpenStreetMap mostrando pinos de bombas
- Botão WhatsApp no card da bomba → link `wa.me/telefone`

### 6. Dashboard com Gráficos (todos os dashboards)
- Instalar recharts
- Admin: gráfico de solicitações por dia/semana
- Cliente: histórico visual
- Dono: ordens realizadas, volume total

### 7. Status Simplificado
- Solicitações: `agendado` | `finalizado` | `cancelado`
- Dono aceita → `agendado`, Dono recusa → `cancelado`
- Botão "Finalizar" no histórico do dono

### 8. Detalhes da Solicitação → WhatsApp
- No card da solicitação, botão "Conversar no WhatsApp" → abre wa.me/telefone_dono

### Arquivos a modificar:
- src/lib/types.ts
- migrations/add_cidades_atendidas.sql
- src/app/(auth)/cadastro/page.tsx
- src/app/(dashboard)/cliente/buscar/page.tsx
- src/app/(dashboard)/cliente/solicitacoes/page.tsx
- src/app/(dashboard)/dono/page.tsx
- src/app/(dashboard)/dono/historico/page.tsx
- src/app/(dashboard)/admin/page.tsx
- src/app/(dashboard)/admin/ordens/page.tsx
- src/app/(dashboard)/cliente/page.tsx
- src/components/Sidebar.tsx (adicionar link pra gestão de bombas do dono)
- package.json (adicionar leaflet, recharts)
