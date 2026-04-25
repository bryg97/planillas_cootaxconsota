-- Permite una sola sesion activa por usuario
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS session_version VARCHAR(36);
