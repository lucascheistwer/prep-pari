# Monolito modular hexagonal

Estado: aceptada.

PrepPari se implementa como un solo backend Java. Los módulos son `identity`, `household`, `dish`, `planner` y `shopping`, más `shared`, `jobs` y `bootstrap`. Dentro de cada módulo la dependencia va hacia el dominio: `domain` no conoce Spring ni JPA, `application` declara ports, y los adapters hablan con HTTP, PostgreSQL o un proveedor.

No se separan procesos de negocio. La API y el worker son dos formas de arrancar el mismo artefacto (`PREPPARI_RUNTIME_MODE=api|worker`). El worker usa `WebApplicationType.NONE`.

JPA no entra en la Fase 0. La cola usa JDBC porque el claim es una sentencia SQL con `FOR UPDATE SKIP LOCKED`. Los adapters de dominio pueden usar JPA cuando aparezcan sus tablas.

Spring Security queda para la Fase 1, junto con el proveedor OIDC. Hasta entonces la API no autentica.
