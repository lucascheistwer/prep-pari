# PrepPari

PrepPari organiza las comidas de un hogar: guardar lo que se cocina, planificar almuerzos y cenas, y armar una lista de compras compartida. La interfaz está en español (Argentina).

Este repositorio está en la **Fase 0**. Hay estructura, convenciones, base de datos, cola de trabajos y la identidad visual Tomato & Butter. Todavía no hay cuentas, hogares, comidas, planificador ni lista.

La fuente de verdad del producto es [docs/PRD.md](docs/PRD.md). Las decisiones de esta fase están en [docs/decisions](docs/decisions).

## Estructura

```text
frontend/     Next.js, React, TypeScript y Tailwind. Mobile-first.
backend/      Java 21 y Spring Boot. Un artefacto, dos procesos: API y worker.
docs/         PRD y decisiones.
docker-compose.yml
vercel.json   Services + Daemon, contrastado con la documentación vigente.
```

El backend es un monolito modular hexagonal. Los paquetes de producto (`identity`, `household`, `dish`, `planner`, `shopping`) marcan el límite de cada módulo. El dominio no depende de Spring ni de JPA. La cola durable vive en PostgreSQL (`background_job`); Redis queda reservado para Pub/Sub y la aplicación todavía no se conecta.

## Requisitos

- Docker y Docker Compose, para levantar todo junto.
- Para desarrollar en el host: JDK 21, Maven 3.9+ y Node.js 22.

Las versiones de librerías e imágenes están fijadas. El detalle está en [docs/decisions/0006-versiones.md](docs/decisions/0006-versiones.md).

## Levantar todo

```bash
docker compose up --build
```

| Servicio | URL o puerto | Qué hace |
|---|---|---|
| Frontend | http://localhost:3000 | Página base con los tokens Tomato & Butter |
| API | http://localhost:8080/api/health | Salud pública. Actuator en `/actuator/health` |
| Worker | sin puerto | Reclama jobs de PostgreSQL. No abre HTTP |
| PostgreSQL | localhost:5432 | Base `preppari`, usuario y clave locales `preppari` |
| Redis | localhost:6379 | Solo Pub/Sub futuro. Sin clave en local |

La API corre Flyway al arrancar. El worker espera a que la API esté sana y no migra. La clave de Postgres del Compose es solo para la máquina local.

Para bajarlo: `docker compose down`.

## Desarrollar en el host

```bash
docker compose up postgres redis
cp .env.example .env
```

API, en una terminal:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

Worker, en otra. Hay que esperar a que la API haya migrado:

```bash
cd backend
PREPPARI_RUNTIME_MODE=worker mvn spring-boot:run
```

El `main` ve `PREPPARI_RUNTIME_MODE=worker`, no levanta HTTP y activa el perfil `worker`.

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

Queda en http://localhost:3000. El perfil `local` de la API permite CORS desde ese origen.

## Tests y formato

```bash
mvn -B -f backend/pom.xml verify
cd frontend && npm ci && npm test && npm run lint && npm run format:check && npm run build
```

O `make test`.

El backend formatea con Spotless (google-java-format). `mvn -f backend/pom.xml spotless:apply` reescribe el código. El frontend usa Prettier y ESLint: `npm run format` dentro de `frontend/`.

Los tests de la cola usan Testcontainers con PostgreSQL 16.16. Hace falta Docker. Cubren claim concurrente con `FOR UPDATE SKIP LOCKED`, recuperación de un lease vencido y el paso a `DEAD` cuando se agotan los intentos.

## Configuración

`.env.example` no tiene secretos. El proveedor de IA por defecto es `fake`. En esta fase cualquier otro valor impide el arranque. Los nombres de modelo salen de `PREPPARI_AI_TEXT_MODEL` y `PREPPARI_AI_IMAGE_MODEL`; si están vacíos, no se inventa uno.

`PREPPARI_AI_API_KEY` está reservada y el proceso no la lee.

Las migraciones no corren en cada instancia. En local las corre la API (`PREPPARI_RUN_MIGRATIONS=true`). En producción tienen que ser un paso de release, con el worker y las réplicas de la API en `false`.

## Despliegue

`vercel.json` declara el frontend Next.js, la API como container y el worker como daemon. La sintaxis sale de la documentación de Vercel Services, Container Runtime y Daemons consultada el 20 de noviembre de 2026. Los daemons, en beta, solo corren en producción: los previews no levantan el worker. Railway o Render siguen siendo el fallback del backend si esa beta no sirve. El detalle y lo que hay que configurar en el proyecto de Vercel está en [docs/decisions/0003-vercel-y-fallback.md](docs/decisions/0003-vercel-y-fallback.md).

## Qué falta decidir

Estas elecciones no bloquean la Fase 0 y tienen que tomarlas Lucas antes de las fases que las usan:

- Proveedor OIDC y cuentas (Vercel, base de datos, Redis, storage, IA).
- Dónde vive PostgreSQL (por ejemplo Neon o Supabase) y en qué región. El daemon de ejemplo usa `iad1`.
- Redis administrado para Pub/Sub (por ejemplo Upstash).
- Object storage: Vercel Blob o un S3 compatible.
- Proveedor y modelo de texto, y proveedor y modelo de imagen. Van por ambiente, no en el código.
- Invitaciones por link, por email, o por los dos.
- Límites de imágenes y de uso de IA, y la política de borrado de cuenta.

No hay que sumar microservicios ni otro broker.
