-- Migración de MySQL a PostgreSQL para Supabase
-- Sistema de Planillas Cootaxconsota

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    clave VARCHAR(255) NOT NULL,
    rol VARCHAR(50) DEFAULT 'operador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: vehiculos
CREATE TABLE IF NOT EXISTS vehiculos (
    id SERIAL PRIMARY KEY,
    codigo_vehiculo VARCHAR(50) UNIQUE NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    saldo_pendiente DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: planillas
CREATE TABLE IF NOT EXISTS planillas (
    id SERIAL PRIMARY KEY,
    vehiculo_id INTEGER REFERENCES vehiculos(id),
    conductor VARCHAR(255),
    tipo VARCHAR(50) DEFAULT 'contado',
    valor DECIMAL(10,2) NOT NULL,
    numero_planilla VARCHAR(50) UNIQUE,
    fecha DATE NOT NULL,
    operador_id INTEGER REFERENCES usuarios(id),
    pagada SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: liquidaciones
CREATE TABLE IF NOT EXISTS liquidaciones (
    id SERIAL PRIMARY KEY,
    planilla_id INTEGER REFERENCES planillas(id),
    operador_id INTEGER REFERENCES usuarios(id),
    estado VARCHAR(50) DEFAULT 'pendiente',
    supervisor_id INTEGER REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP,
    comentario TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(planilla_id)
);

-- Tabla: auditoria
CREATE TABLE IF NOT EXISTS auditoria (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100),
    accion VARCHAR(255),
    detalles TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: configuracion
CREATE TABLE IF NOT EXISTS configuracion (
    id SERIAL PRIMARY KEY,
    telegram_token VARCHAR(255),
    telegram_chatid VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: modulos (para sistema de permisos)
CREATE TABLE IF NOT EXISTS modulos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    icono VARCHAR(50),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: permisos_por_rol
CREATE TABLE IF NOT EXISTS permisos_por_rol (
    id SERIAL PRIMARY KEY,
    rol VARCHAR(50) NOT NULL,
    modulo_id INTEGER REFERENCES modulos(id),
    permitido BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rol, modulo_id)
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_planillas_vehiculo ON planillas(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_planillas_fecha ON planillas(fecha);
CREATE INDEX IF NOT EXISTS idx_planillas_operador ON planillas(operador_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_planilla ON liquidaciones(planilla_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_estado ON liquidaciones(estado);
CREATE INDEX IF NOT EXISTS idx_auditoria_created ON auditoria(created_at);

-- Insertar usuario admin por defecto (contraseña: admin123)
INSERT INTO usuarios (usuario, clave, rol)
VALUES ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'administrador')
ON CONFLICT (usuario) DO NOTHING;

-- Insertar configuración inicial
INSERT INTO configuracion (telegram_token, telegram_chatid)
VALUES ('', '')
ON CONFLICT DO NOTHING;

-- Insertar módulos del sistema
INSERT INTO modulos (nombre, ruta, icono, orden) VALUES
('Planillas', 'planillas.php', 'bi-receipt', 1),
('Operaciones', 'operaciones.php', 'bi-gear-wide-connected', 2),
('Liquidaciones', 'liquidaciones.php', 'bi-cash-stack', 3),
('Cartera', 'cartera.php', 'bi-wallet2', 4),
('Recargas Débito', 'recargas.php', 'bi-credit-card-2-back', 5),
('Reportes', 'reportes.php', 'bi-bar-chart-line', 6),
('Vehículos', 'default.php', 'bi-truck', 7),
('Usuarios', 'usuarios.php', 'bi-people', 8),
('Auditoría', 'auditoria.php', 'bi-search', 9),
('Configuración', 'configuracion.php', 'bi-gear', 10)
ON CONFLICT DO NOTHING;

-- Asignar permisos para rol administrador (todos los módulos)
INSERT INTO permisos_por_rol (rol, modulo_id, permitido)
SELECT 'administrador', id, true FROM modulos
ON CONFLICT (rol, modulo_id) DO UPDATE SET permitido = true;

-- Asignar permisos para rol supervisor
INSERT INTO permisos_por_rol (rol, modulo_id, permitido)
SELECT 'supervisor', id, true FROM modulos 
WHERE nombre IN ('Planillas', 'Liquidaciones', 'Cartera', 'Reportes', 'Auditoría')
ON CONFLICT (rol, modulo_id) DO UPDATE SET permitido = true;

-- Asignar permisos para rol operador
INSERT INTO permisos_por_rol (rol, modulo_id, permitido)
SELECT 'operador', id, true FROM modulos 
WHERE nombre IN ('Planillas', 'Operaciones')
ON CONFLICT (rol, modulo_id) DO UPDATE SET permitido = true;
