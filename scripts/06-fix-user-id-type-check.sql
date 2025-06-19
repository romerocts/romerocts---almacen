-- Elimina ambas restricciones viejas (con y sin guiones)
ALTER TABLE loans DROP CONSTRAINT IF EXISTS "loans_user-id_type-check";
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_user_id_type_check;
ALTER TABLE loans DROP CONSTRAINT IF EXISTS "loans_user - id_type - check";

-- Crea la restricción correcta para los valores actuales del frontend
ALTER TABLE loans
ADD CONSTRAINT "loans_user-id_type-check"
CHECK (user_id_type IN ('CC', 'TI', 'CE'));
