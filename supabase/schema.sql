create table if not exists public.tiktok_accounts (
  open_id text primary key,
  display_name text,
  avatar_url text,
  access_token_enc text not null,
  refresh_token_enc text,
  access_expires_at timestamptz,
  refresh_expires_at timestamptz,
  scopes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tiktok_accounts enable row level security;

revoke all on public.tiktok_accounts from anon, authenticated;
grant all on public.tiktok_accounts to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tiktok_accounts_updated_at on public.tiktok_accounts;
create trigger tiktok_accounts_updated_at
before update on public.tiktok_accounts
for each row execute function public.set_updated_at();
