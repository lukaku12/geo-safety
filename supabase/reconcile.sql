-- ============================================================================
-- Reconciliation logic — Postgres functions (RPCs)
-- Run this THIRD in the Supabase SQL Editor, after:
--   1. seed_schema.sql        (tables, indexes, companies, contracts)
--   2. seed_transactions.sql  (89 unmatched bank transactions)
--
-- Why the core logic lives in the database (not the client/server):
--   * The auto-match is a single set-based UPDATE that touches every unmatched
--     row in one round-trip and one transaction — no fetch-all/loop/write-back.
--   * It is atomic and concurrency-safe: two operators clicking "Run" at once
--     can't double-match or partially apply.
--   * It scales to millions of rows because the matching key (sender_inn) and
--     the status filter are both indexed; Postgres does a hash/merge join
--     instead of N client round-trips.
-- The TypeScript service layer calls these via supabase.rpc(...).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Auto-match by exact INN
--
-- Matches every `unmatched` transaction whose sender_inn equals a company's
-- tax_id. Deliberately scoped to status = 'unmatched' so it NEVER overwrites a
-- manual match or an ignored row (idempotent + re-runnable).
--
-- Edge cases handled by the predicate itself:
--   * NULL / empty sender_inn        → never equals a tax_id → stays unmatched
--   * personal IDs (e.g. 11 digits)  → no tax_id collision   → stays unmatched
--   * unknown company INN            → no join partner        → stays unmatched
-- INN is treated as an opaque string; we trim incidental whitespace only.
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.reconcile_by_inn()
returns table (
  matched_count   integer,
  unmatched_count integer,
  total_processed integer
)
language plpgsql
volatile
as $$
declare
  v_matched integer;
begin
  with updated as (
    update public.bank_transactions t
       set matched_company_id = c.id,
           match_method       = 'inn_exact',
           match_confidence   = 1.00,
           status             = 'matched'
      from public.companies c
     where t.status = 'unmatched'
       and t.sender_inn is not null
       and btrim(t.sender_inn) = c.tax_id
    returning 1
  )
  select count(*) into v_matched from updated;

  return query
    select
      v_matched,
      (select count(*)::integer
         from public.bank_transactions
        where status = 'unmatched'),
      (select count(*)::integer
         from public.bank_transactions);
end;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Portfolio stats (optionally scoped to a date window)
--
-- Returns the headline numbers for the dashboard in a single aggregate scan.
-- `ignored` rows are reported but excluded from the match-rate denominator
-- (a deliberately ignored transfer is neither a success nor a failure).
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.reconciliation_stats(
  p_period_start date default null,
  p_period_end   date default null
)
returns table (
  total_count       bigint,
  matched_count     bigint,
  unmatched_count   bigint,
  ignored_count     bigint,
  total_amount      numeric,
  matched_amount    numeric,
  unmatched_amount  numeric
)
language sql
stable
as $$
  select
    count(*)                                                   as total_count,
    count(*) filter (where status = 'matched')                as matched_count,
    count(*) filter (where status = 'unmatched')              as unmatched_count,
    count(*) filter (where status = 'ignored')                as ignored_count,
    coalesce(sum(amount), 0)                                   as total_amount,
    coalesce(sum(amount) filter (where status = 'matched'), 0) as matched_amount,
    coalesce(sum(amount) filter (where status = 'unmatched'), 0) as unmatched_amount
  from public.bank_transactions
  where (p_period_start is null or entry_date >= p_period_start)
    and (p_period_end   is null or entry_date <= p_period_end);
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Expected vs. actual, per company, for a billing period
--
--   expected = Σ monthly_amount of contracts that are ACTIVE *and* in force
--              during the period (status = 'active' AND the period overlaps
--              [start_date, end_date]). Paused/ended contracts are excluded,
--              matching the brief: only active, non-archived contracts bill.
--   actual   = Σ amount of that company's MATCHED transactions in the period.
--
-- Lateral subqueries keep this to one index-driven pass per company instead of
-- a cross-product, so it stays cheap as companies/contracts/transactions grow.
-- The status label (ok / underpaid / overpaid) is derived in the app layer so
-- the rule lives in exactly one place (lib/reconciliation/status.ts).
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.company_reconciliation(
  p_period_start date,
  p_period_end   date
)
returns table (
  company_id            uuid,
  name                  text,
  tax_id                text,
  expected              numeric,
  actual                numeric,
  matched_count         bigint,
  active_contract_count bigint
)
language sql
stable
as $$
  select
    c.id,
    c.name,
    c.tax_id,
    coalesce(exp.expected, 0)              as expected,
    coalesce(act.actual, 0)                as actual,
    coalesce(act.matched_count, 0)         as matched_count,
    coalesce(exp.active_contract_count, 0) as active_contract_count
  from public.companies c
  left join lateral (
    select
      sum(ct.monthly_amount) as expected,
      count(*)               as active_contract_count
    from public.contracts ct
    where ct.company_id = c.id
      and ct.status = 'active'
      and ct.start_date <= p_period_end
      and (ct.end_date is null or ct.end_date >= p_period_start)
  ) exp on true
  left join lateral (
    select
      sum(t.amount) as actual,
      count(*)      as matched_count
    from public.bank_transactions t
    where t.matched_company_id = c.id
      and t.status = 'matched'
      and t.entry_date between p_period_start and p_period_end
  ) act on true
  order by c.name;
$$;
