-- Script para crear usuario administrador
-- Email: b.arroyaveg@gmail.com
-- Password: Adm1n2026*

-- PASO 1: Primero registra el usuario manualmente en Supabase Auth:
-- 1. Ve a: https://supabase.com/dashboard/project/vxmggzvypaipbegeroxy/auth/users
-- 2. Click en "Add user" -> "Create new user"
-- 3. Email: b.arroyaveg@gmail.com
-- 4. Password: Adm1n2026*
-- 5. Confirmar email automáticamente (marca la casilla)

-- PASO 2: Luego ejecuta este SQL para asignar el rol en la tabla usuarios:
-- (Primero ejecuta el supabase-schema.sql si aún no lo has hecho)

-- Insertar en tabla usuarios con el rol de administrador
INSERT INTO usuarios (usuario, clave, rol)
VALUES (
    'b.arroyaveg@gmail.com',
    -- Hash de la contraseña Adm1n2026* usando bcrypt
    '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm',
    'administrador'
)
ON CONFLICT (usuario) DO UPDATE 
SET rol = 'administrador', 
    clave = '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm';

-- Verificar que se creó correctamente
SELECT id, usuario, rol, created_at FROM usuarios WHERE usuario = 'b.arroyaveg@gmail.com';
