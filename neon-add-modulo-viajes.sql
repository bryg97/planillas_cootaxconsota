-- Modulo Viajes: tablas y permisos base para Neon (PostgreSQL)

-- 1) Catalogo de convenios empresariales
CREATE TABLE IF NOT EXISTS convenios_empresariales (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT true,
  creado_por_id INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2) Registro de viajes con trazabilidad de asignacion
CREATE TABLE IF NOT EXISTS viajes (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id),
  conductor VARCHAR(255) NOT NULL,
  convenio_id INTEGER NOT NULL REFERENCES convenios_empresariales(id),
  origen VARCHAR(255) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  medio_contacto VARCHAR(50) NOT NULL CHECK (medio_contacto IN ('llamada_telefonica', 'whatsapp', 'mensajeria_app')),
  omite_consecutivo BOOLEAN DEFAULT false,
  motivo_omision TEXT,
  creado_por_id INTEGER REFERENCES usuarios(id),
  creado_por_usuario VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK ((omite_consecutivo = false AND motivo_omision IS NULL) OR (omite_consecutivo = true AND motivo_omision IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_viajes_created_at ON viajes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viajes_vehiculo ON viajes(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_viajes_convenio ON viajes(convenio_id);

-- 3) Alta del modulo para visibilidad/permiso historico (si usan tablas de modulos)
INSERT INTO modulos (nombre, ruta, icono, orden, activo)
VALUES ('Viajes', '/viajes', 'bi-sign-turn-right', 11, true)
ON CONFLICT DO NOTHING;

-- 4) Permisos recomendados por rol
INSERT INTO permisos_por_rol (rol, modulo_id, permitido)
SELECT 'administrador', id, true FROM modulos WHERE nombre = 'Viajes'
ON CONFLICT (rol, modulo_id) DO UPDATE SET permitido = true;

INSERT INTO permisos_por_rol (rol, modulo_id, permitido)
SELECT 'supervisor', id, true FROM modulos WHERE nombre = 'Viajes'
ON CONFLICT (rol, modulo_id) DO UPDATE SET permitido = true;

INSERT INTO permisos_por_rol (rol, modulo_id, permitido)
SELECT 'operador', id, true FROM modulos WHERE nombre = 'Viajes'
ON CONFLICT (rol, modulo_id) DO UPDATE SET permitido = true;
