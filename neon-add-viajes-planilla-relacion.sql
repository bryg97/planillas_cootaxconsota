-- Relacionar viajes con planillas para trazabilidad completa

ALTER TABLE viajes
ADD COLUMN IF NOT EXISTS planilla_id INTEGER REFERENCES planillas(id);

CREATE INDEX IF NOT EXISTS idx_viajes_planilla_id ON viajes(planilla_id);
