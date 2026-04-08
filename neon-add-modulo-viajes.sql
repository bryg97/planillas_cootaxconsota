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
  autorizador_id INTEGER REFERENCES usuarios(id),
  autorizador_usuario VARCHAR(255),
  cedula_autorizador VARCHAR(50),
  respuesta_autorizacion VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK ((omite_consecutivo = false AND motivo_omision IS NULL) OR (omite_consecutivo = true AND motivo_omision IS NOT NULL))
);

-- 2.1) Validacion por usuario para autorizacion (cedula + respuesta)
CREATE TABLE IF NOT EXISTS viajes_autorizadores_validacion (
  id SERIAL PRIMARY KEY,
  autorizador_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id),
  cedula VARCHAR(50) NOT NULL,
  respuesta VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  actualizado_por_id INTEGER REFERENCES usuarios(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_viajes_created_at ON viajes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_viajes_vehiculo ON viajes(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_viajes_convenio ON viajes(convenio_id);
CREATE INDEX IF NOT EXISTS idx_viajes_autorizador ON viajes(autorizador_id);

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
