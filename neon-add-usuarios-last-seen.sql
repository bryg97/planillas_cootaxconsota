-- Registra ultima actividad para mostrar usuarios en linea
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_usuarios_last_seen_at
ON usuarios(last_seen_at);
