# Esquema inicial y Flyway

Estado: aceptada.

`V1__background_job.sql` crea solo la cola, con los checks, el unique de `idempotency_key` y los índices parciales del PRD. Las tablas de hogar, comidas, plan y lista llegan en la migración de la fase que las usa. Crearlas ahora fijaría enums y FKs que el dominio todavía no ejerce.

`household_id` es obligatorio y todavía no tiene foreign key, porque `household` no existe. La Fase 1 agrega la tabla y la FK.

Los estados y tipos de job son `VARCHAR` con `CHECK`, no enums de PostgreSQL, para poder ampliarlos con una migración simple.

Flyway no corre en cada instancia. El default es `PREPPARI_RUN_MIGRATIONS=false`. El perfil `local` y el contenedor de la API lo encienden. El worker lo deja apagado. En producción la migración es un paso de release.

El pool de Hikari arranca en 5 conexiones por proceso para no agotar una base administrada cuando haya más de una instancia. Se ajusta con `PREPPARI_DB_POOL_SIZE`.
