-- Plataforma Global: API pública, plugins, observabilidade e white-label

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  name text not null,
  token_hash text not null,
  scopes text[] not null default '{}',
  active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (empresa_id, name)
);

create index if not exists idx_api_tokens_empresa on public.api_tokens(empresa_id);
create index if not exists idx_api_tokens_active on public.api_tokens(active);

create table if not exists public.api_usage_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid references auth.users(id),
  endpoint text not null,
  method text not null,
  status_code int not null,
  response_time_ms int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_usage_logs_empresa_created on public.api_usage_logs(empresa_id, created_at desc);
create index if not exists idx_api_usage_logs_endpoint on public.api_usage_logs(endpoint);

create table if not exists public.plugin_registry (
  id text primary key,
  name text not null,
  version text not null,
  description text,
  module_url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.empresa_plugins (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  plugin_id text not null references public.plugin_registry(id) on delete cascade,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (empresa_id, plugin_id)
);

create index if not exists idx_empresa_plugins_empresa on public.empresa_plugins(empresa_id);

create table if not exists public.qr_scan_events (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  equipamento_id uuid references public.equipamentos(id) on delete set null,
  tag text,
  device_type text,
  platform text,
  browser text,
  latitude numeric,
  longitude numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_qr_scan_empresa_created on public.qr_scan_events(empresa_id, created_at desc);

create table if not exists public.empresa_settings (
  empresa_id uuid primary key references public.empresas(id) on delete cascade,
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  currency text not null default 'BRL',
  custom_domain text,
  logo_url text,
  brand_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.api_tokens enable row level security;
alter table public.api_usage_logs enable row level security;
alter table public.empresa_plugins enable row level security;
alter table public.qr_scan_events enable row level security;
alter table public.empresa_settings enable row level security;

create policy if not exists "empresa api_tokens select" on public.api_tokens
for select using (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy if not exists "empresa api_tokens cudi" on public.api_tokens
for all using (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid() and p.perfil in ('MASTER','ADMIN','GESTOR')
  )
)
with check (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid() and p.perfil in ('MASTER','ADMIN','GESTOR')
  )
);

create policy if not exists "empresa api_usage_logs select" on public.api_usage_logs
for select using (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy if not exists "empresa api_usage_logs insert" on public.api_usage_logs
for insert with check (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy if not exists "empresa plugins select" on public.empresa_plugins
for select using (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy if not exists "empresa plugins cudi" on public.empresa_plugins
for all using (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid() and p.perfil in ('MASTER','ADMIN','GESTOR')
  )
)
with check (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid() and p.perfil in ('MASTER','ADMIN','GESTOR')
  )
);

create policy if not exists "empresa qr scans select" on public.qr_scan_events
for select using (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy if not exists "empresa qr scans insert" on public.qr_scan_events
for insert with check (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy if not exists "empresa settings select" on public.empresa_settings
for select using (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy if not exists "empresa settings cudi" on public.empresa_settings
for all using (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid() and p.perfil in ('MASTER','ADMIN','GESTOR')
  )
)
with check (
  empresa_id in (
    select p.empresa_id
    from public.profiles p
    where p.id = auth.uid() and p.perfil in ('MASTER','ADMIN','GESTOR')
  )
);

create or replace function public.check_rate_limit(
  p_endpoint text,
  p_max_requests int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
as $$
declare
  v_empresa_id uuid;
  v_count int;
begin
  select p.empresa_id into v_empresa_id
  from public.profiles p
  where p.id = auth.uid();

  if v_empresa_id is null then
    return false;
  end if;

  select count(*) into v_count
  from public.api_usage_logs a
  where a.empresa_id = v_empresa_id
    and a.endpoint = p_endpoint
    and a.created_at >= now() - make_interval(secs => p_window_seconds);

  return v_count < p_max_requests;
end;
$$;

grant execute on function public.check_rate_limit(text, int, int) to anon, authenticated, service_role;
