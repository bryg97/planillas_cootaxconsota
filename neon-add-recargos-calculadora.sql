-- Crea catálogo de recargos para la calculadora
CREATE TABLE IF NOT EXISTS calculadora_recargos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  descripcion TEXT,
  valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calculadora_recargos_nombre
  ON calculadora_recargos(nombre);
