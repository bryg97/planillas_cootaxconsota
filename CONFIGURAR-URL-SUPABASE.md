# 🔧 Configurar URL de Producción en Supabase

## Paso 1: Obtener tu URL de Vercel

Después de desplegar en Vercel, deberías tener una URL como:
- `https://planillas-cootaxconsota.vercel.app`
- O la que Vercel te asignó

## Paso 2: Configurar en Supabase

1. Ve a tu proyecto en Supabase:
   https://supabase.com/dashboard/project/vxmggzvypaipbegeroxy/auth/url-configuration

2. En la sección **"Site URL"**:
   - Cambia de `http://localhost:3000`
   - A tu URL de Vercel: `https://TU-URL.vercel.app`

3. En la sección **"Redirect URLs"** agrega:
   ```
   https://TU-URL.vercel.app/**
   http://localhost:3000/**
   ```
   
   Esto permite tanto producción como desarrollo local.

4. Haz clic en **"Save"**

## Paso 3: Probar nuevamente

1. Ve a tu aplicación en Vercel
2. Click en "¿Olvidaste tu contraseña?"
3. Ingresa tu email
4. Ahora el enlace que llegue a tu correo debería apuntar a tu URL de Vercel

---

## 📧 Si ya recibiste el correo con localhost

No te preocupes, solo:
1. Cambia manualmente `localhost:3000` por tu URL de Vercel en el enlace del correo
2. O solicita otro correo de recuperación después de hacer la configuración

---

## ✅ URLs que debes configurar

Si tu app está en: `https://planillas-cootaxconsota.vercel.app`

**Site URL:**
```
https://planillas-cootaxconsota.vercel.app
```

**Redirect URLs (agregar ambas):**
```
https://planillas-cootaxconsota.vercel.app/**
http://localhost:3000/**
```

El `/**` al final permite cualquier ruta dentro de tu app.
