# 📝 Guía: Ejecutar Script SQL en Supabase

## Paso 1: Acceder a Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto: `vxmggzvypaipbegeroxy`

## Paso 2: Abrir el SQL Editor

1. En el menú lateral izquierdo, busca el ícono **SQL** o **SQL Editor**
2. Haz clic en **"New Query"** o **"Nueva Consulta"**

## Paso 3: Copiar el Script

1. Abre el archivo `supabase-schema.sql` de este proyecto
2. Copia TODO el contenido (Ctrl+A, Ctrl+C)

## Paso 4: Ejecutar el Script

1. Pega el contenido en el editor SQL de Supabase (Ctrl+V)
2. Haz clic en el botón **"Run"** (▶️) o presiona **Ctrl+Enter**
3. Espera a que se ejecute (debería tomar 1-2 segundos)

## Paso 5: Verificar

Después de ejecutar, deberías ver:

✅ Mensaje de éxito: "Success. No rows returned"

### Verificar tablas creadas:

1. En el menú lateral, ve a **"Table Editor"**
2. Deberías ver todas las tablas:
   - usuarios
   - vehiculos
   - planillas
   - liquidaciones
   - auditoria
   - modulos
   - permisos_por_rol
   - configuracion

## Paso 6: Verificar Usuario Admin

Para verificar que el usuario admin fue creado:

1. En el SQL Editor, ejecuta:

```sql
SELECT usuario, rol FROM usuarios;
```

2. Deberías ver:
   - usuario: `admin`
   - rol: `administrador`

## ⚠️ Notas Importantes

- El script usa `IF NOT EXISTS` y `ON CONFLICT`, por lo que es **seguro ejecutarlo múltiples veces**
- No borrará datos existentes
- La contraseña del admin es: `admin123` (cámbiala después del primer login)

## 🔧 Solución de Problemas

### Error: "permission denied"
- Asegúrate de estar logueado en Supabase
- Verifica que tienes permisos de administrador en el proyecto

### Error: "syntax error"
- Asegúrate de copiar TODO el contenido del archivo
- No modifiques el script

### Error: "relation already exists"
- Es normal si ya ejecutaste el script antes
- El script está diseñado para ser idempotente

## 🎉 ¡Listo!

Una vez ejecutado el script, puedes:

1. Ejecutar el proyecto Next.js: `npm run dev`
2. Ir a [http://localhost:3000](http://localhost:3000)
3. Hacer clic en "Iniciar Sesión"
4. Usar las credenciales:
   - Usuario: `admin`
   - Contraseña: `admin123`

---

Si tienes problemas, revisa los logs en Supabase o contacta al equipo de desarrollo.
