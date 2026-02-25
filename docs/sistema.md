# PCM ESTRATÉGICO — Documentação Técnica do Sistema

## Visão Geral
Sistema de Gestão de Manutenção Industrial (PCM) projetado como SaaS multi-empresa para indústrias.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Lovable Cloud (Supabase)

---

## Arquitetura

### Frontend
```
src/
├── assets/              # Logo e recursos estáticos
├── components/
│   ├── layout/          # AppLayout, AppSidebar
│   └── ui/              # Componentes shadcn/ui
├── contexts/
│   ├── AuthContext.tsx   # Autenticação e sessão
│   └── EmpresaContext.tsx # Contexto multi-empresa
├── hooks/               # Hooks customizados
├── integrations/
│   └── supabase/        # Cliente e tipos auto-gerados
├── lib/                 # Utilitários (cn, etc)
└── pages/               # Páginas do sistema
```

### Backend (Lovable Cloud)
- **Autenticação:** Supabase Auth (email/password)
- **Banco:** PostgreSQL com RLS
- **Storage:** Disponível para logos e documentos
- **Edge Functions:** Disponíveis para lógica customizada

---

## Módulos do Sistema

| Módulo | Rota | Tabela Principal | Status |
|--------|------|------------------|--------|
| Dashboard | `/dashboard` | ordens_servico, equipamentos | ✅ Funcional |
| Solicitações | `/solicitacoes` | solicitacoes | ✅ Funcional |
| Emitir O.S | `/os/nova` | ordens_servico | ✅ Funcional |
| Fechar O.S | `/os/fechar` | ordens_servico | ✅ Funcional |
| Histórico O.S | `/os/historico` | ordens_servico | ✅ Funcional |
| Backlog | `/backlog` | ordens_servico | ✅ Funcional |
| Programação | `/programacao` | planos_preventivos, lubrificacao | ✅ Funcional |
| Preventiva | `/preventiva` | planos_preventivos | ✅ Funcional |
| Preditiva | `/preditiva` | equipamentos, ordens_servico | ✅ Funcional |
| Inspeções | `/inspecoes` | inspecoes | ✅ Funcional |
| FMEA/RCM | `/fmea` | fmea | ✅ Funcional |
| Causa Raiz | `/rca` | analise_causa_raiz | ✅ Funcional |
| Melhorias | `/melhorias` | melhorias | ✅ Funcional |
| Lubrificação | `/lubrificacao` | lubrificacao | ✅ Funcional |
| Hierarquia | `/hierarquia` | equipamentos | ✅ Funcional |
| Equipamentos | `/equipamentos` | equipamentos | ✅ Funcional |
| Mecânicos | `/mecanicos` | mecanicos | ✅ Funcional |
| Materiais | `/materiais` | materiais | ✅ Funcional |
| Fornecedores | `/fornecedores` | fornecedores | ✅ Funcional |
| Contratos | `/contratos` | contratos | ✅ Funcional |
| Documentos | `/documentos` | documentos_tecnicos | ✅ Funcional |
| Custos | `/custos` | ordens_servico, execucoes_os | ✅ Funcional |
| Relatórios | `/relatorios` | ordens_servico | ✅ Funcional |
| SSMA | `/ssma` | ssma_registros | ✅ Funcional |
| Usuários | `/usuarios` | profiles, user_roles | ✅ Funcional |
| Auditoria | `/auditoria` | auditoria | ✅ Funcional |
| Master TI | `/master-ti` | - | ✅ Funcional |

---

## Banco de Dados

### Tabelas Estruturais (SaaS)
- **empresas** — Cadastro de empresas (multi-tenant)
- **planos_saas** — Planos de assinatura com módulos
- **assinaturas** — Vínculo empresa ↔ plano

### Tabelas de Autenticação
- **profiles** — Dados do usuário (nome, empresa_id)
- **user_roles** — Roles (ADMIN, USUARIO, MASTER_TI)

### Tabelas Operacionais
Todas possuem `empresa_id` para isolamento multi-empresa:
- equipamentos, ordens_servico, planos_preventivos
- lubrificacao, mecanicos, materiais, fornecedores
- contratos, documentos_tecnicos, solicitacoes
- fmea, analise_causa_raiz, melhorias
- ssma_registros, inspecoes, execucoes_os
- materiais_utilizados, movimentacoes_materiais
- auditoria

---

## Permissões (Roles)

| Role | Dashboard | Cadastros | OS | Admin | Master TI |
|------|-----------|-----------|-----|-------|-----------|
| USUARIO | ✅ Leitura | ✅ CRUD | ✅ CRUD | ❌ | ❌ |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ❌ |
| MASTER_TI | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Segurança (RLS)

- Todas as tabelas possuem RLS ativado
- `has_role()` — Função SECURITY DEFINER para verificar roles
- `get_user_empresa_id()` — Função SECURITY DEFINER para isolamento multi-empresa
- Políticas restritivas por tabela (INSERT, SELECT, UPDATE, DELETE)

---

## Fluxos Principais

### Abertura de OS
1. Usuário acessa `/os/nova`
2. Seleciona equipamento (TAG), preenche dados
3. OS criada com número sequencial automático
4. Auditoria registrada automaticamente

### Fechamento de OS
1. Usuário acessa `/os/fechar`
2. Seleciona OS em aberto
3. Preenche modo de falha, causa raiz, ação corretiva
4. Status atualizado para FECHADA

### Plano Preventivo
1. Cadastro de plano com periodicidade
2. Sistema calcula próxima execução
3. Programação consolida preventivas + lubrificação

---

## Planos SaaS

| Plano | Preço | Módulos | Máx Usuários |
|-------|-------|---------|-------------|
| Básico | R$ 299 | Dashboard, Equipamentos, OS | 5 |
| Profissional | R$ 599 | + Preventivas, Lubrificação, Materiais, Relatórios | 15 |
| Enterprise | R$ 999 | Todos os módulos | 50 |

---

## Versão
- **v3.0** — PCM ESTRATÉGICO
- **Desenvolvido por:** GPPIS Industrial Systems
