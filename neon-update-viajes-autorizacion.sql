-- Ajustes adicionales para modulo Viajes ya creado previamente

ALTER TABLE viajes
  ADD COLUMN IF NOT EXISTS autorizador_id INTEGER REFERENCES usuarios(id),
  ADD COLUMN IF NOT EXISTS autorizador_usuario VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cedula_autorizador VARCHAR(50),
  ADD COLUMN IF NOT EXISTS respuesta_autorizacion VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_viajes_autorizador ON viajes(autorizador_id);

CREATE TABLE IF NOT EXISTS viajes_autorizadores_validacion (
  id SERIAL PRIMARY KEY,
  autorizador_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id),
  cedula VARCHAR(50) NOT NULL,
  respuesta VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  actualizado_por_id INTEGER REFERENCES usuarios(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
