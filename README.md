# ContactShip Mini - Lead Management System

Sistema de gestión de leads con integración de IA, sincronización automática y procesamiento asíncrono.

## Tabla de Contenidos

- [Características](#características)
- [Tecnologías](#tecnologías)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Estructura del Proyecto](#estructura-del-proyecto)

---

## Características

- **CRUD de Leads** con validación de datos
- **Autenticación con API Key** - Todas las peticiones requieren autenticación
- **Integración con IA (Google Gemini)** - Genera resúmenes y acciones sugeridas en español
- **Sincronización Automática** - CRON job que importa leads desde Random User API cada 6 horas
- **Deduplicación** - Previene leads duplicados por email
- **Procesamiento Asíncrono** - BullMQ para tareas en background
- **Cache con Redis** - TTL configurable para optimizar consultas
- **Docker** - Levanta toda la aplicación con un solo comando

---

## Tecnologías

| Categoría | Tecnología |
|-----------|-----------|
| **Framework** | NestJS + TypeScript |
| **Base de Datos** | PostgreSQL (Supabase compatible) |
| **ORM** | TypeORM |
| **Cache** | Redis |
| **Colas** | BullMQ |
| **IA** | Google Gemini API |
| **Validación** | class-validator |
| **Contenedores** | Docker + Docker Compose |

---

## Instalación

### Con Docker (Recomendado)

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd prueba-tecnica-contactship

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver sección Configuración)

# 3. Levantar todo con un comando
docker-compose up -d
```

La aplicación estará disponible en `http://localhost:4321`

### Sin Docker (Manual)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar .env
cp .env.example .env
# Editar .env con tus valores

# 3. Levantar servicios (PostgreSQL y Redis)
docker-compose up db cache -d

# 4. Iniciar la aplicación
pnpm run start:dev
```

---

## Configuración

### Variables de Entorno Requeridas

El archivo `.env` debe contener las siguientes variables. **Todas son obligatorias**:

```bash
# Database
POSTGRES_USER=admin
POSTGRES_DB=db_prueba_tecnica
POSTGRES_PASSWORD=your-secure-password
POSTGRES_HOST=db          # Usar 'db' si usas Docker, 'localhost' si manual
POSTGRES_PORT=5432
DB_HOST_PORT=5434

# Redis
REDIS_HOST=cache          # Usar 'cache' si usas Docker, 'localhost' si manual
REDIS_PORT=6379
REDIS_TTL=600
REDIS_PASSWORD=your-redis-password

# Application
PORT=4321
API_KEY=your-secret-api-key-here    # IMPORTANTE: Define tu propia API Key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key  # Ver sección siguiente
```

### Configurar API Key para Autenticación

**IMPORTANTE**: La API Key es obligatoria para acceder a todos los endpoints.

1. **Define tu API Key**: En el archivo `.env`, establece el valor de `API_KEY`:
   ```bash
   API_KEY=mi-clave-secreta-123
   ```
   Puede ser cualquier string que desees. Recomendación: usa un valor aleatorio y seguro.

2. **Usa la API Key en tus peticiones**: Todas las peticiones HTTP deben incluir el header `x-api-key`:
   ```bash
   curl -H "x-api-key: mi-clave-secreta-123" http://localhost:4321/api/leads
   ```

3. **Sin API Key válida**: Recibirás un error `401 Unauthorized`

### Obtener API Key de Gemini

Para la funcionalidad de IA:

1. Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key (gratis)
3. Copia la key al archivo `.env` en `GEMINI_API_KEY`

---

## Uso

### Autenticación

**Todas las peticiones requieren el header `x-api-key`** con el valor definido en tu `.env`:

```bash
curl -H "x-api-key: tu-api-key-aqui" http://localhost:4321/api/leads
```

### Crear un Lead

```bash
curl -X POST http://localhost:4321/api/leads \
  -H "Content-Type: application/json" \
  -H "x-api-key: tu-api-key-aqui" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+34612345678",
    "company": "TechCorp"
  }'
```

El sistema automáticamente:
1. Guarda el lead en PostgreSQL
2. Añade un job a la cola BullMQ
3. El worker procesa el job y genera summary con IA
4. Actualiza el lead con `ai_summary` y `ai_next_action`

### Sincronizar Leads Externos

```bash
# Sincronización manual
curl -X POST http://localhost:4321/api/sync/leads \
  -H "x-api-key: tu-api-key-aqui"
```

**CRON automático**: Se ejecuta cada 6 horas importando 10 leads nuevos.

---

## API Endpoints

Todos los endpoints requieren autenticación con `x-api-key` en el header.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/leads` | Crear lead manualmente |
| `GET` | `/api/leads` | Listar todos los leads |
| `GET` | `/api/leads/:id` | Obtener lead por ID (cached) |
| `POST` | `/api/leads/:id/summarize` | Re-procesar lead con IA |
| `POST` | `/api/sync/leads` | Sincronizar desde Random User API |

### Ejemplo de Respuesta

```json
{
  "id": "uuid",
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+34612345678",
  "company": "TechCorp",
  "ai_summary": "Juan Pérez es un contacto comercial de TechCorp...",
  "ai_next_action": "Realizar una llamada de prospección...",
  "createdAt": "2026-01-15T06:02:49.843Z",
  "updatedAt": "2026-01-15T06:02:51.870Z"
}
```

---

## Estructura del Proyecto

```
src/
├── ai/                          # Módulo de IA
│   ├── ai.service.ts           # Integración con Gemini API
│   └── ai.module.ts
├── common/                      # Utilidades compartidas
│   └── guards/
│       └── api-key.guard.ts    # Guard de autenticación
├── lead/                        # Módulo principal de Leads
│   ├── dto/
│   │   ├── create-lead.dto.ts  # Validación de entrada
│   │   └── update-lead.dto.ts
│   ├── entities/
│   │   └── lead.entity.ts      # Entidad TypeORM
│   ├── lead.controller.ts      # Endpoints REST
│   ├── lead.service.ts         # Lógica de negocio
│   ├── lead.processor.ts       # Worker BullMQ
│   └── lead.module.ts
├── sync/                        # Módulo de sincronización
│   ├── sync.service.ts         # Integración Random User API
│   ├── sync.controller.ts      # Endpoint manual de sync
│   └── sync.module.ts          # CRON scheduler
├── app.module.ts               # Módulo raíz
└── main.ts                     # Entry point
```

---

## Testing

### Verificar Servicios en Docker

```bash
# Ver logs de la aplicación
docker-compose logs -f app

# Verificar estado de contenedores
docker-compose ps

# PostgreSQL
docker-compose exec db psql -U admin -d db_prueba_tecnica

# Redis
docker-compose exec cache redis-cli -a your-redis-password
```

### Adminer (UI Base de Datos)

Accede a `http://localhost:8080`
- **Server**: `db`
- **Username**: `admin`
- **Password**: (tu POSTGRES_PASSWORD del .env)
- **Database**: `db_prueba_tecnica`

---

## Comandos Docker

```bash
# Levantar todo
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f app

# Reiniciar aplicación
docker-compose restart app

# Detener todo
docker-compose down

# Eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v

# Reconstruir imagen
docker-compose up --build
```

---

## Notas Importantes

- **Cache Redis**: Primer GET de lead → DB. Siguientes → Cache (TTL: 600s)
- **Deduplicación**: Email único en la base de datos
- **IA en Español**: El prompt está configurado para respuestas en español
- **CRON**: Corre cada 6 horas (00:00, 06:00, 12:00, 18:00)
- **API Key**: Sin ella, todos los endpoints devuelven `401 Unauthorized`

---

## Desarrollo

```bash
# Modo desarrollo con hot-reload
pnpm run start:dev

# Build de producción
pnpm run build

# Ejecutar producción
pnpm run start:prod
```

---

## Licencia

MIT

---

**Desarrollado por Angel Penalver** para prueba técnica de ContactShip