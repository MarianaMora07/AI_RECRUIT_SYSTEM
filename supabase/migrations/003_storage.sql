-- Storage bucket for CV files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('cvs', 'cvs', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY cvs_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cvs');

CREATE POLICY cvs_select ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'cvs');

CREATE POLICY cvs_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'cvs' AND get_user_role() = 'admin');
