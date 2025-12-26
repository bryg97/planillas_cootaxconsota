# Plataforma de Planillas - Deploy en Vercel

Proyecto PHP migrado para funcionar en Vercel con funciones serverless.

## 📋 Requisitos Previos

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com)
- Base de datos MySQL accesible desde internet (ej: Railway, PlanetScale, o tu hosting actual)

## 🚀 Pasos para Deploy en Vercel

### 1. Configurar Base de Datos en Supabase

El proyecto ahora usa **PostgreSQL** con Supabase:

1. **Accede a tu proyecto en Supabase**: https://supabase.com/dashboard/project/vxmggzvypaipbegeroxy

2. **Ejecutar Script de Migración:**
   - Ve a **SQL Editor** (ícono de base de datos en el menú lateral)
   - Abre el archivo [migrate-to-postgresql.sql](migrate-to-postgresql.sql)
   - Copia todo el contenido
   - Pégalo en el SQL Editor de Supabase
   - Click en **Run** o presiona Ctrl+Enter
   - Esto creará todas las tablas necesarias

3. **Migrar tus datos existentes:**
   - Exporta tus datos de MySQL actual usando phpMyAdmin o mysqldump
   - Convierte los datos al formato de PostgreSQL
   - Impórtalos usando el SQL Editor de Supabase

### 2. Subir el proyecto a GitHub

Si aún no lo has hecho:

```bash
# Configurar tu identidad de Git
git config --global user.name "bryg97"
git config --global user.email "b.arroyaveg@gmail.com"

# Inicializar el repositorio
cd c:\plataforma-planillas
git init

# Agregar todos los archivos
git add .

# Crear el primer commit
git commit -m "Proyecto configurado para Vercel con PostgreSQL"

# Conectar con tu repositorio de GitHub
git remote add origin https://github.com/bryg97/planillas_cootaxconsota.git

# Subir el código
git branch -M main
git push -u origin main
```

### 3. Configurar Vercel

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
   DB_HOST = db.vxmggzvypaipbegeroxy.supabase.co
   DB_PORT = 5432
   DB_USER = postgres.vxmggzvypaipbegeroxy
   DB_PASS = 7906aVxM1Jg7VXbP
   DB_NAME = postgres
   TZ = America/Bogota
   ```

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
