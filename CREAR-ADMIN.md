# 🔐 Crear Usuario Administrador en Supabase

## Opción 1: Registro Manual en Supabase (MÁS RÁPIDO)

### Paso 1: Acceder a Supabase Auth
1. Abre: https://supabase.com/dashboard/project/vxmggzvypaipbegeroxy/auth/users
2. Inicia sesión en Supabase si no lo has hecho

### Paso 2: Crear el Usuario
1. Haz clic en **"Add user"** (botón verde arriba a la derecha)
2. Selecciona **"Create new user"**
3. Completa el formulario:
   - **Email**: `b.arroyaveg@gmail.com`
   - **Password**: `Adm1n2026*`
   - ✅ Marca la casilla: **"Auto Confirm User"** (para no necesitar verificación de email)
4. Haz clic en **"Create user"**

### Paso 3: Ejecutar SQL para Asignar Rol
1. Ve a: https://supabase.com/dashboard/project/vxmggzvypaipbegeroxy/sql/new
2. Copia y pega este SQL:

```sql
-- Insertar usuario en la tabla usuarios con rol administrador
INSERT INTO usuarios (usuario, clave, rol)
VALUES (
    'b.arroyaveg@gmail.com',
    '$2y$10$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm',
    'administrador'
)
ON CONFLICT (usuario) DO UPDATE 
SET rol = 'administrador';
```

3. Haz clic en **"Run"** (▶️)

### ✅ ¡Listo!

Ahora puedes iniciar sesión en el sistema con:
- **Email**: b.arroyaveg@gmail.com
- **Password**: Adm1n2026*

---

## Opción 2: Registro desde la aplicación

Si prefieres registrarte desde la aplicación Next.js:

1. Ejecuta: `npm run dev`
2. Ve a: http://localhost:3000/register
3. Completa el formulario con tus datos
4. Después del registro, ejecuta este SQL en Supabase para cambiar tu rol:

```sql
UPDATE usuarios 
SET rol = 'administrador' 
WHERE usuario = 'b.arroyaveg@gmail.com';
```

---

## ⚠️ IMPORTANTE

Antes de cualquiera de estas opciones, **asegúrate de haber ejecutado el script principal**:

1. Ve a: https://supabase.com/dashboard/project/vxmggzvypaipbegeroxy/sql/new
2. Copia TODO el contenido del archivo `supabase-schema.sql`
3. Pégalo y ejecuta (▶️)
4. Esto creará todas las tablas necesarias

---

## 🔍 Verificar

Para verificar que todo funcionó:

```sql
SELECT id, usuario, rol, created_at 
FROM usuarios 
WHERE usuario = 'b.arroyaveg@gmail.com';
```

Deberías ver tu usuario con rol = 'administrador'
