-- Phase 5 Plan 01: Foundation migration
-- Adds push_subscriptions table, challenge_members.reminder_hour + notifications_enabled,
-- avatars Storage bucket, and avatars RLS policies.
-- All sections are idempotent — safe to re-run.

-- =====================================================================
-- Section A — push_subscriptions table (SETT-02)
-- =====================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subs_user_idx ON push_subscriptions (user_id);

-- =====================================================================
-- Section B — challenge_members new columns (SETT-02)
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenge_members' AND column_name = 'reminder_hour'
  ) THEN
    ALTER TABLE challenge_members ADD COLUMN reminder_hour smallint;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'challenge_members' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE challenge_members
      ADD COLUMN notifications_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- =====================================================================
-- Section C — avatars Storage bucket (SETT-03)
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- Section D — avatars RLS policies (SETT-03)
-- DROP+CREATE pattern for idempotency (Postgres has no CREATE POLICY IF NOT EXISTS).
-- Folder-scoped writes: auth.uid()::text must equal first folder segment.
-- Mitigates T-05-01-06 (one user can't overwrite another's avatar).
-- =====================================================================
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
