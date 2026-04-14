-- Quick Fix 260414-5bc: check-in-photos Storage bucket
-- Adds check-in-photos bucket + folder-scoped RLS policies on storage.objects.
-- Mirrors the avatars pattern from 0003_phase05_foundation.sql Sections C+D.
-- All sections are idempotent — safe to re-run.

-- =====================================================================
-- Section A — check-in-photos Storage bucket
-- =====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('check-in-photos', 'check-in-photos', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- Section B — check-in-photos RLS policies
-- DROP+CREATE pattern for idempotency (Postgres lacks IF NOT EXISTS on policies).
-- Folder-scoped writes: auth.uid()::text must equal first folder segment.
-- =====================================================================
DROP POLICY IF EXISTS "Check-in photos are publicly readable" ON storage.objects;
CREATE POLICY "Check-in photos are publicly readable"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'check-in-photos');

DROP POLICY IF EXISTS "Users can upload their own check-in photos" ON storage.objects;
CREATE POLICY "Users can upload their own check-in photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own check-in photos" ON storage.objects;
CREATE POLICY "Users can update their own check-in photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own check-in photos" ON storage.objects;
CREATE POLICY "Users can delete their own check-in photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'check-in-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
