# 🚀 Guía de Despliegue en Vercel

## Paso 1: Acceder a Vercel

1. Ve a [https://vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub

## Paso 2: Importar el Proyecto

1. Haz clic en **"Add New"** → **"Project"**
2. Busca el repositorio: **`bryg97/planillas_cootaxconsota`**
3. Haz clic en **"Import"**

## Paso 3: Configurar el Proyecto

### Framework Preset
- Selecciona: **Next.js**
- Root Directory: `./` (dejar por defecto)
- Build Command: `npm run build` (automático)
- Output Directory: `.next` (automático)

### Variables de Entorno

Haz clic en **"Environment Variables"** y agrega:

```
NEXT_PUBLIC_SUPABASE_URL=https://vxmggzvypaipbegeroxy.supabase.co
```


```
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

```
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

**Importante**: Asegúrate de agregar estas 3 variables para todos los entornos (Production, Preview, Development)

## Paso 4: Desplegar

1. Haz clic en **"Deploy"**
2. Espera de 2-3 minutos mientras Vercel construye y despliega
3. ¡Listo! Vercel te dará una URL como: `https://planillas-cootaxconsota.vercel.app`

## 🌐 Acceder a tu Aplicación

Una vez desplegado:

1. Visita la URL que te proporciona Vercel
2. Haz clic en "Iniciar Sesión"
3. Usa tus credenciales:
   - Email: `b.arroyaveg@gmail.com`
   - Password: `Adm1n2026*`

## 🔄 Actualizaciones Automáticas

Cada vez que hagas `git push` al repositorio:
- Vercel detectará los cambios automáticamente
- Construirá y desplegará la nueva versión
- Tu sitio se actualizará sin intervención manual

## 🔧 Configuraciones Adicionales

### Dominio Personalizado (Opcional)

1. En Vercel, ve a tu proyecto
2. Click en **"Settings"** → **"Domains"**
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar el DNS

### Variables de Entorno Adicionales

Si necesitas agregar más variables:
1. Ve a **"Settings"** → **"Environment Variables"**
2. Agrega las nuevas variables
3. Haz un nuevo deploy para aplicar los cambios

## ⚠️ Solución de Problemas

### Error: "Build failed"
- Verifica que las variables de entorno estén configuradas correctamente
- Revisa los logs de build en Vercel

### Error: "Cannot connect to database"
- Verifica que las credenciales de Supabase sean correctas
- Asegúrate de que ejecutaste el script `supabase-schema.sql` en Supabase

### La aplicación no carga
- Verifica que la URL de Supabase sea correcta
- Revisa los logs en Vercel Dashboard

## 📊 Monitoreo

Vercel proporciona:
- **Analytics**: Estadísticas de uso
- **Logs**: Ver errores y logs en tiempo real
- **Preview Deployments**: Cada PR crea un deploy de prueba

---

## 🎉 ¡Todo Listo!

Tu aplicación ahora está en producción y accesible desde cualquier lugar.

**URL del repositorio**: https://github.com/bryg97/planillas_cootaxconsota
