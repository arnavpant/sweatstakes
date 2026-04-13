-- Phase 4: Points & Stakes schema additions

-- Add columns to challenges
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/New_York';
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS settlement_hour smallint NOT NULL DEFAULT 5;

-- Settled weeks (idempotency guard)
CREATE TABLE IF NOT EXISTS settled_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  settled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (challenge_id, week_start)
);

-- Point transactions (immutable ledger)
CREATE TABLE IF NOT EXISTS point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  delta smallint NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pt_challenge_user_idx ON point_transactions (challenge_id, user_id);

-- Rewards
CREATE TABLE IF NOT EXISTS rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name text NOT NULL,
  point_cost smallint NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Redemptions
CREATE TABLE IF NOT EXISTS redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reward_id uuid NOT NULL,
  point_cost smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
