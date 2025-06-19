-- Elimina la restricción antigua (si existe)
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_user-id_type-check;

-- Crea la nueva restricción para aceptar solo los valores actuales del frontend
ALTER TABLE loans
ADD CONSTRAINT loans_user-id_type-check
CHECK (user_id_type IN ('CC', 'TI', 'CE'));
