-- 0005: Add nullable selfie_url column to check_ins.
-- Dashboard gallery prefers this standalone selfie; feed keeps using photo_url (composite).
-- Old rows have NULL selfie_url and fall back to photo_url in the gallery render.

ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS selfie_url text;
