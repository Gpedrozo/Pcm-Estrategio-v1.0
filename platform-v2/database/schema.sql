-- Platform V2 - Schema completo multiempresa

create extension if not exists pgcrypto;

create type app_role_v2 as enum ('ADMIN','GESTOR','MECANICO','SOLICITANTE','USUARIO','MASTER_TI');
create type os_status_v2 as enum ('SOLICITACAO','ANALISE','APROVACAO','EMISSAO','EXECUCAO','ENCERRAMENTO','HISTORICO');
create type os_prioridade_v2 as enum ('URGENTE','ALTA','MEDIA','BAIXA');

create table if not exists empresas_v2 (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  plano text not null default 'starter',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists usuarios_v2 (
  id uuid primary key,
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  nome text not null,
  email text not null,
  role app_role_v2 not null default 'USUARIO',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, email)
);

create table if not exists perfis_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  usuario_id uuid not null references usuarios_v2(id) on delete cascade,
  configuracao jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, usuario_id)
);

create table if not exists equipamentos_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  tag text not null,
  nome text not null,
  descricao text,
  criticidade text not null default 'B',
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, tag)
);

create table if not exists componentes_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  equipamento_id uuid not null references equipamentos_v2(id) on delete cascade,
  parent_id uuid references componentes_v2(id) on delete cascade,
  nome text not null,
  descricao text,
  nivel int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists arvore_estrutural_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  equipamento_id uuid not null references equipamentos_v2(id) on delete cascade,
  componente_id uuid not null references componentes_v2(id) on delete cascade,
  caminho text not null,
  nivel int not null,
  created_at timestamptz not null default now(),
  unique (empresa_id, componente_id)
);

create table if not exists ordens_servico_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  equipamento_id uuid not null references equipamentos_v2(id) on delete restrict,
  componente_id uuid references componentes_v2(id) on delete set null,
  tag text not null,
  solicitante_id uuid not null references usuarios_v2(id) on delete restrict,
  responsavel_id uuid references usuarios_v2(id) on delete set null,
  prioridade os_prioridade_v2 not null default 'MEDIA',
  descricao text not null,
  status os_status_v2 not null default 'SOLICITACAO',
  data_abertura timestamptz not null default now(),
  data_fechamento timestamptz,
  tempo_execucao_min int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists execucoes_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  ordem_servico_id uuid not null references ordens_servico_v2(id) on delete cascade,
  mecanico_id uuid references usuarios_v2(id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz,
  custo_total numeric(14,2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists historico_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  entidade text not null,
  entidade_id uuid not null,
  acao text not null,
  usuario_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists anexos_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  ordem_servico_id uuid references ordens_servico_v2(id) on delete cascade,
  url text not null,
  nome text not null,
  content_type text,
  tamanho_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists indicadores_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  referencia date not null,
  total_os int not null default 0,
  os_abertas int not null default 0,
  corretivas int not null default 0,
  preventivas int not null default 0,
  custo_total numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (empresa_id, referencia)
);

create table if not exists logs_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas_v2(id) on delete cascade,
  usuario_id uuid,
  level text not null,
  event text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists qr_codes_v2 (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas_v2(id) on delete cascade,
  equipamento_id uuid not null references equipamentos_v2(id) on delete cascade,
  tag text not null,
  qr_url text not null,
  tamanho_etiqueta text not null default '10x10',
  created_at timestamptz not null default now(),
  unique (empresa_id, tag)
);

create index if not exists idx_usuarios_v2_empresa on usuarios_v2(empresa_id);
create index if not exists idx_equipamentos_v2_empresa_tag on equipamentos_v2(empresa_id, tag);
create index if not exists idx_componentes_v2_empresa_parent on componentes_v2(empresa_id, parent_id);
create index if not exists idx_os_v2_empresa_status on ordens_servico_v2(empresa_id, status);
create index if not exists idx_execucoes_v2_empresa on execucoes_v2(empresa_id, ordem_servico_id);
create index if not exists idx_historico_v2_empresa_data on historico_v2(empresa_id, created_at desc);
create index if not exists idx_logs_v2_empresa_data on logs_v2(empresa_id, created_at desc);
create index if not exists idx_qr_v2_empresa_tag on qr_codes_v2(empresa_id, tag);

alter table empresas_v2 enable row level security;
alter table usuarios_v2 enable row level security;
alter table perfis_v2 enable row level security;
alter table equipamentos_v2 enable row level security;
alter table componentes_v2 enable row level security;
alter table arvore_estrutural_v2 enable row level security;
alter table ordens_servico_v2 enable row level security;
alter table execucoes_v2 enable row level security;
alter table historico_v2 enable row level security;
alter table anexos_v2 enable row level security;
alter table indicadores_v2 enable row level security;
alter table logs_v2 enable row level security;
alter table qr_codes_v2 enable row level security;

create or replace function current_empresa_v2() returns uuid language sql stable as $$
  select u.empresa_id from usuarios_v2 u where u.id = auth.uid() limit 1
$$;

create policy tenant_isolation_usuarios_v2 on usuarios_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_equipamentos_v2 on equipamentos_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_componentes_v2 on componentes_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_arvore_v2 on arvore_estrutural_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_os_v2 on ordens_servico_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_execucoes_v2 on execucoes_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_historico_v2 on historico_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_anexos_v2 on anexos_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_indicadores_v2 on indicadores_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_logs_v2 on logs_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());

create policy tenant_isolation_qr_v2 on qr_codes_v2 for all
using (empresa_id = current_empresa_v2())
with check (empresa_id = current_empresa_v2());
