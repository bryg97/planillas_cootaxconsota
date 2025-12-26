-- Actualizar rol de usuario a administrador
UPDATE usuarios 
SET rol = 'administrador' 
WHERE usuario = 'b.arroyaveg@gmail.com';

-- Verificar el cambio
SELECT id, usuario, rol, created_at 
FROM usuarios 
WHERE usuario = 'b.arroyaveg@gmail.com';
