-- Prepared for dedicated NOVA Supabase project only.
-- Server-managed Kraken Connect OAuth metadata. Never store raw tokens.
-- Apply AFTER security review, before enabling KRAKEN_OAUTH_ENABLED.
begin;

create table if not exists public.nova_kraken_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_bundle text not null,
  scope text not null check (scope = 'account.fast-api-key:funds-query'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nova_kraken_bundle_min_len check (char_length(encrypted_bundle) between 80 and 12000)
);
alter table public.nova_kraken_connections enable row level security;

-- No browser-side access whatsoever. Only Vercel serverless with
-- dedicated service_role key may read/write encrypted credentials.
revoke all on public.nova_kraken_connections from public, anon, authenticated;
-- No SELECT/UPDATE policies: authenticated clients cannot read this table.
-- service_role bypasses RLS under its existing privileged role.

create index if not exists nova_kraken_expiry_idx
  on public.nova_kraken_connections(expires_at);

commit;