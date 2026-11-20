# PrepPari

PrepPari organiza las comidas de un hogar: guardar lo que se cocina, planificar almuerzos y cenas, y armar una lista de compras compartida. La interfaz está en español (Argentina).

Este repositorio está en la **Fase 1**. Hay cuentas con Google, hogares, invitaciones y la identidad visual Tomato & Butter. Todavía no hay comidas, planificador ni lista.

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
| Frontend | http://localhost:3000 | Login, alta de hogar e invitaciones |
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

Queda en http://localhost:3000. El navegador habla con Next y Next reenvía `/api` a la API (`API_URL`, por defecto `http://localhost:8080`). La sesión viaja en una cookie `HttpOnly`. El perfil `local` de la API también permite CORS desde ese origen.

## Entrar

Hay dos maneras. Las dos terminan en la misma cuenta interna, identificada por el subject del proveedor.

**Google, en local.** En [Google Cloud](https://console.cloud.google.com/apis/credentials) el cliente web tiene que tener:

- Origen de JavaScript autorizado: `http://localhost:3000`
- El redirect `http://localhost:3000/auth/callback/google` puede quedar cargado, pero este flujo no lo usa: Google Identity Services devuelve el ID token en el navegador.

Copiá `.env.example` a `.env` y dejá `GOOGLE_CLIENT_ID`. `GOOGLE_CLIENT_SECRET` queda vacía: no hace falta y la aplicación no la lee. Levantá la API con el perfil `local` y el frontend, abrí http://localhost:3000/ingresar y usá el botón de Google.

**Sin Google.** En los perfiles `local` y `test` la pantalla de ingreso muestra «Modo desarrollo». El identificador (por ejemplo `ana`) vuelve a entrar siempre como la misma persona. En `production` ese endpoint no existe y, si alguien lo enciende, la API no arranca.

Con una cuenta, creá un hogar, generá un enlace y abrilo con otra cuenta (otra ventana en modo desarrollo, u otra cuenta de Google) para aceptar la invitación.

## Tests y formato

```bash
mvn -B -f backend/pom.xml verify
cd frontend && npm ci && npm test && npm run lint && npm run format:check && npm run build
```

O `make test`.

El backend formatea con Spotless (google-java-format). `mvn -f backend/pom.xml spotless:apply` reescribe el código. El frontend usa Prettier y ESLint: `npm run format` dentro de `frontend/`.

Los tests de la cola usan Testcontainers con PostgreSQL 16.16. Hace falta Docker. Cubren claim concurrente con `FOR UPDATE SKIP LOCKED`, recuperación de un lease vencido y el paso a `DEAD` cuando se agotan los intentos.

## Configuración

`.env.example` no tiene secretos. El proveedor de IA por defecto es `fake`. Cualquier otro valor impide el arranque. Los nombres de modelo salen de `PREPPARI_AI_TEXT_MODEL` y `PREPPARI_AI_IMAGE_MODEL`; si están vacíos, no se inventa uno.

`PREPPARI_AI_API_KEY` está reservada y el proceso no la lee.

`GOOGLE_CLIENT_ID` es el Client ID público. `GOOGLE_CLIENT_SECRET` queda vacía a propósito. `PREPPARI_SESSION_SECRET` firma la cookie de sesión; en local hay un valor de desarrollo y en producción hay que definir uno distinto de al menos 32 bytes. El detalle está en [docs/decisions/0007-identidad-google-e-invitaciones.md](docs/decisions/0007-identidad-google-e-invitaciones.md).

Las migraciones no corren en cada instancia. En local las corre la API (`PREPPARI_RUN_MIGRATIONS=true`). En producción tienen que ser un paso de release, con el worker y las réplicas de la API en `false`.

## Despliegue

`vercel.json` declara el frontend Next.js, la API como container y el worker como daemon. La sintaxis sale de la documentación de Vercel Services, Container Runtime y Daemons consultada el 20 de noviembre de 2026. Los daemons, en beta, solo corren en producción: los previews no levantan el worker. Railway o Render siguen siendo el fallback del backend si esa beta no sirve. El detalle y lo que hay que configurar en el proyecto de Vercel está en [docs/decisions/0003-vercel-y-fallback.md](docs/decisions/0003-vercel-y-fallback.md).

## Qué falta decidir

Estas elecciones no bloquean la Fase 0 y tienen que tomarlas Lucas antes de las fases que las usan:

- Cuentas de Vercel, base de datos, Redis, storage e IA. El proveedor OIDC de esta fase es Google.
- Dónde vive PostgreSQL (por ejemplo Neon o Supabase) y en qué región. El daemon de ejemplo usa `iad1`.
- Redis administrado para Pub/Sub (por ejemplo Upstash).
- Object storage: Vercel Blob o un S3 compatible.
- Proveedor y modelo de texto, y proveedor y modelo de imagen. Van por ambiente, no en el código.
- La invitación de esta fase es un enlace de un solo uso, sin email.
- Límites de imágenes y de uso de IA, y la política de borrado de cuenta.

No hay que sumar microservicios ni otro broker.
