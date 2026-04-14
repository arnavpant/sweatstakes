-- Phase 4 post-review fixes (WR-02, WR-06)
--
-- WR-02: Add FK from redemptions.reward_id to rewards.id (ON DELETE RESTRICT).
-- WR-06: Add CHECK constraint on point_transactions.reason.
--
-- Note on user_id FKs: point_transactions.user_id and redemptions.user_id
-- reference auth.users (Supabase-managed). Wiring cross-schema FKs into the
-- public schema requires Supabase-specific grants and is intentionally
-- deferred — the app only inserts user_id values it just authenticated via
-- Supabase Auth, so orphan risk is low.

-- WR-02: redemptions.reward_id -> rewards(id) ON DELETE RESTRICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'redemptions_reward_id_fkey'
  ) THEN
    ALTER TABLE redemptions
      ADD CONSTRAINT redemptions_reward_id_fkey
      FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE RESTRICT;
  END IF;
END$$;

-- WR-06: point_transactions.reason must be one of the known ledger reasons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'point_transactions_reason_check'
  ) THEN
    ALTER TABLE point_transactions
      ADD CONSTRAINT point_transactions_reason_check
      CHECK (reason IN ('earned', 'penalty', 'redemption'));
  END IF;
END$$;
