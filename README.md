# 🚖 Sistema de Planillas - Cootaxconsota

Sistema de gestión de planillas, liquidaciones y cartera para cooperativa de taxis. Migrado de PHP a Next.js 16 con TypeScript y Supabase.

## ✨ Características

- 📋 **Planillas de Recaudo**: Registro de planillas de contado y crédito
- 💵 **Liquidaciones**: Sistema de aprobación con supervisores
- 💼 **Cartera**: Control de saldos, deudas y recargas por vehículo
- 🚖 **Vehículos**: Gestión de códigos y estados
- 📊 **Reportes**: Informes detallados por período y operador
- 🔍 **Auditoría**: Seguimiento completo de operaciones
- 👥 **Roles**: Administrador, Supervisor y Operador

## 🛠️ Tecnologías

- **Next.js 16** con App Router
- **TypeScript**
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**
- **React 19**

## 📦 Instalación

### 1. Clonar el proyecto

```bash
git clone <tu-repositorio>
cd planillas-nextjs
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

#### a) Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Guarda las credenciales (URL y API Key)

#### b) Ejecutar el esquema de base de datos

1. Abre el SQL Editor en Supabase
2. Copia el contenido de `supabase-schema.sql`
3. Pega en el editor y ejecuta el script
4. Esto creará todas las tablas, índices y datos iniciales

### 4. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
RESEND_API_KEY=tu_resend_api_key
RESEND_FROM_EMAIL=notificaciones@tu-dominio.com
RESEND_TO_EMAIL=destino1@correo.com,destino2@correo.com
```

### 5. Ejecutar el proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 👤 Usuario por Defecto

Después de ejecutar el script SQL, puedes iniciar sesión con:

- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **IMPORTANTE**: Cambia la contraseña inmediatamente después del primer login.

## 📂 Estructura del Proyecto

```
planillas-nextjs/
├── src/
│   ├── app/
│   │   ├── login/           # Página de inicio de sesión
│   │   ├── register/        # Página de registro
│   │   ├── dashboard/       # Panel principal
│   │   ├── planillas/       # Módulo de planillas (próximamente)
│   │   ├── liquidaciones/   # Módulo de liquidaciones (próximamente)
│   │   ├── cartera/         # Módulo de cartera (próximamente)
│   │   └── ...
│   ├── lib/
│   │   └── supabase/        # Clientes de Supabase
│   ├── types/
│   │   └── database.types.ts # Tipos de la base de datos
│   └── middleware.ts        # Middleware de autenticación
├── supabase-schema.sql      # Esquema completo de la base de datos
└── README.md
```

## 🚀 Próximos Pasos

- [ ] Módulo de Planillas (crear, editar, eliminar)
- [ ] Módulo de Liquidaciones (aprobar, rechazar)
- [ ] Módulo de Cartera (verificar deudas, recaudar)
- [ ] Módulo de Vehículos (CRUD completo)
- [ ] Módulo de Reportes (Excel, PDF)
- [ ] Módulo de Usuarios (gestión de roles)
- [ ] Módulo de Auditoría (consulta de logs)
- [ ] Integración con Telegram para notificaciones

## 📊 Base de Datos

### Tablas Principales

- **usuarios**: Usuarios del sistema con roles
- **vehiculos**: Vehículos de la cooperativa
- **planillas**: Registros de recaudo
- **liquidaciones**: Control de aprobaciones
- **auditoria**: Log de operaciones
- **modulos**: Módulos del sistema
- **permisos_por_rol**: Permisos por rol
- **configuracion**: Configuración general

## 🔐 Seguridad

- Autenticación con Supabase Auth
- Middleware para proteger rutas
- Tokens CSRF (a implementar)
- Sesiones con límite de tiempo por rol
- Auditoría completa de operaciones

## 📝 Migración desde PHP

Este proyecto es una migración del sistema PHP original ubicado en `C:\plataforma-planillas`. 

Principales cambios:
- MySQL → PostgreSQL (Supabase)
- PHP → Next.js/TypeScript
- Sesiones PHP → Supabase Auth
- PDO → Supabase Client
- Bootstrap → Tailwind CSS

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y pertenece a Cootaxconsota.

---

Desarrollado para **Cootaxconsota** - Cooperativa de Taxis
