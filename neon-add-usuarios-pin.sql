-- Agrega PIN de acceso por usuario (almacenado como hash)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS pin_acceso_hash VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_usuarios_pin_acceso_hash
ON usuarios(pin_acceso_hash);
