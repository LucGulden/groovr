-- Permettre aux utilisateurs authentifiés de mettre à jour les albums
CREATE POLICY "albums_update_authenticated"
  ON albums FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');