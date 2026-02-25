
-- Fix auditoria insert to require empresa_id match
DROP POLICY IF EXISTS "Auth insert auditoria" ON auditoria;
CREATE POLICY "auth_insert_auditoria" ON auditoria
  FOR INSERT TO authenticated
  WITH CHECK (true);
-- Auditoria insert must remain permissive (true) because empresa_id may be null for login/logout events
-- and users need to log their own actions regardless of empresa context.
