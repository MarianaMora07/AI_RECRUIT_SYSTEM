-- Allow CV images in storage bucket (OCR via Gemini)
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
]
WHERE id = 'cvs';
