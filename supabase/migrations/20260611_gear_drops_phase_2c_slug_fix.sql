-- ============================================================================
-- GEAR DROPS — Phase 2c slug fix-up
-- ============================================================================
-- The 2c backfill SQL ran regexp_replace BEFORE lower(), so uppercase
-- letters in the title matched the `[^a-z0-9]+` character class and got
-- replaced with hyphens. Example:
--   "Test Gear drop" → regexp → "-est-ear-drop" → lower → "-est-ear-drop"
--                     → trim hyphens → "est-ear-drop"   (BUG)
-- Correct order (lower → regexp) yields "test-gear-drop".
-- This migration recomputes the slug per row and replaces ONLY when the
-- current slug exactly matches the buggy output. Hand-edited slugs and
-- already-correct slugs are left alone.
-- ============================================================================

do $$
declare
  r record;
  buggy text;
  correct text;
  s text;
  n int;
begin
  for r in select id, slug, title from public.gear_drops where title is not null and slug is not null loop
    -- Recreate the buggy slug exactly as the 2c backfill would have:
    --   regexp_replace first, then lower, then trim hyphens.
    buggy := lower(regexp_replace(r.title, '[^a-z0-9]+', '-', 'g'));
    buggy := regexp_replace(buggy, '^-+|-+$', '', 'g');
    -- Now the correct slug: lower first, then regexp, then trim.
    correct := regexp_replace(lower(r.title), '[^a-z0-9]+', '-', 'g');
    correct := regexp_replace(correct, '^-+|-+$', '', 'g');
    if correct = '' or correct is null then correct := 'gear-drop'; end if;
    -- Only touch rows whose slug exactly matches the buggy output. That
    -- skips hand-edited slugs (Kyle may have already fixed the test row
    -- via the URL slug field in the editor) and skips already-correct
    -- titles that have no uppercase letters to trip on.
    if r.slug = buggy and buggy <> correct then
      s := correct;
      n := 2;
      while exists (select 1 from public.gear_drops where slug = s and id <> r.id) loop
        s := correct || '-' || n;
        n := n + 1;
      end loop;
      update public.gear_drops set slug = s where id = r.id;
    end if;
  end loop;
end;
$$;
