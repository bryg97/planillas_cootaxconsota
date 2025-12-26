# Plataforma de Planillas - Deploy en Vercel

Proyecto PHP migrado para funcionar en Vercel con funciones serverless.

## 📋 Requisitos Previos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com)
- Base de datos MySQL accesible desde internet (ej: Railway, PlanetScale, o tu hosting actual)

## 🚀 Pasos para Deploy en Vercel

### 1. Subir el proyecto a GitHub

```bash
# Inicializar repositorio Git (si no existe)
cd c:\plataforma-planillas
git init

# Agregar todos los archivos
git add .

# Crear primer commit
git commit -m "Proyecto configurado para Vercel"

# Crear repositorio en GitHub (desde web o CLI)
# Luego conectar el repositorio local

git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

### 2. Configurar Base de Datos

Tu base de datos actual necesita ser accesible desde internet. Opciones:

**Opción A: Usar tu hosting actual**
- Asegúrate de permitir conexiones remotas desde cualquier IP (o específicamente desde Vercel)
- Obtén la IP/hostname público de tu base de datos

**Opción B: Migrar a un servicio de BD en la nube**
- [Railway](https://railway.app) - Gratis para empezar
- [PlanetScale](https://planetscale.com) - MySQL serverless
- [Supabase](https://supabase.com) - PostgreSQL (requiere adaptar código)

**Opción C: Mantener tu BD actual de Hostinger**
- Verifica que tu plan permita conexiones remotas
- Anota el host (usualmente algo como: sql123.hostinger.com)

### 3. Conectar con Vercel

1. **Accede a [Vercel](https://vercel.com)** e inicia sesión

2. **Importar proyecto desde GitHub:**
   - Click en "Add New" → "Project"
   - Selecciona tu repositorio de GitHub
   - Click en "Import"

3. **Configurar el proyecto:**
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: (dejar vacío)
   - Output Directory: (dejar vacío)

4. **Configurar Variables de Entorno:**
   
   En la sección "Environment Variables", agrega:
   
   ```
   DB_HOST=tu_host_de_base_de_datos
   DB_USER=u406926550_planillas
   DB_PASS=!AwbD$3k
   DB_NAME=u406926550_planillas
   TZ=America/Bogota
   ```
   
   ⚠️ **IMPORTANTE**: Cambia estos valores por los reales de tu base de datos en producción

5. **Deploy:**
   - Click en "Deploy"
   - Espera 1-2 minutos mientras Vercel construye y despliega

6. **Accede a tu aplicación:**
   - Vercel te dará una URL como: `https://tu-proyecto.vercel.app`

### 4. Configurar Dominio Personalizado (Opcional)

1. En el dashboard de Vercel, ve a tu proyecto
2. Settings → Domains
3. Agrega tu dominio personalizado
4. Sigue las instrucciones para configurar DNS

## 🔄 Actualizaciones Automáticas

Cada vez que hagas `git push` a tu repositorio de GitHub, Vercel automáticamente:
- Detectará los cambios
- Construirá y desplegará la nueva versión
- Actualizará tu sitio en producción

## 📝 Estructura del Proyecto

```
/
├── api/
│   └── index.php          # Router principal para Vercel
├── config_planillas/
│   └── config.php         # Configuración DB (usa variables de entorno)
├── includes/
├── login/
├── *.php                  # Todos tus archivos PHP existentes
├── .gitignore            # Archivos a excluir de Git
├── .env.example          # Template de variables de entorno
├── vercel.json           # Configuración de Vercel
└── README.md             # Este archivo
```

## ⚙️ Archivos Creados para Vercel

- **vercel.json**: Configuración de rutas y funciones serverless
- **api/index.php**: Router que maneja todas las peticiones PHP
- **.gitignore**: Excluye archivos sensibles del repositorio
- **.env.example**: Plantilla para variables de entorno
- **config.php** (modificado): Ahora usa variables de entorno

## 🔒 Seguridad

- ✅ Las credenciales ahora se manejan con variables de entorno
- ✅ Los archivos sensibles están excluidos de Git (.gitignore)
- ✅ El archivo .sql no se sube al repositorio
- ⚠️ Asegúrate de cambiar las credenciales en las variables de entorno de Vercel

## 🐛 Solución de Problemas

### Error de conexión a base de datos
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de que tu BD permita conexiones remotas
- Revisa los logs en Vercel Dashboard

### Sesiones no persisten
- Vercel funciona con funciones serverless (stateless)
- Las sesiones de PHP funcionan, pero considera usar una BD para sesiones en producción

### Archivos estáticos no cargan
- Verifica que las rutas sean relativas o absolutas desde raíz
- Revisa la configuración de routes en vercel.json

## 📞 Soporte

Para problemas con Vercel, consulta:
- [Documentación de Vercel](https://vercel.com/docs)
- [Vercel PHP Runtime](https://github.com/vercel-community/php)

## 🔄 Comandos Git Útiles

```bash
# Ver estado de cambios
git status

# Agregar cambios
git add .

# Hacer commit
git commit -m "Descripción de cambios"

# Subir a GitHub (trigger deploy automático)
git push origin main

# Ver historial
git log --oneline
```

---

**Nota**: Este proyecto usa PHP en modo serverless. Cada petición inicia una nueva instancia, lo que puede afectar el rendimiento en comparación con un servidor PHP tradicional.
