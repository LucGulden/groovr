CREATE POLICY "vinyls_update_authenticated"
  ON vinyls FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');