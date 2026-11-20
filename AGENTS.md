# Instrucciones para agentes

Leé [docs/PRD.md](docs/PRD.md) antes de implementar y respetá el alcance del MVP. Si un detalle no está definido, elegí la solución más simple que preserve estas reglas, documentala en `docs/decisions` y no sobreingenierices.

1. No agregues funcionalidades fuera del MVP sin consultar.
2. Priorizá un flujo usable de punta a punta antes que muchas pantallas aisladas.
3. El backend es un monolito modular hexagonal. No crees microservicios.
4. El dominio no depende de Spring, JPA, HTTP, proveedores de IA ni servicios externos.
5. No llames al proveedor de IA desde el frontend ni expongas claves al cliente.
6. La IA propone datos. El usuario los revisa. No presentes una cantidad inferida como confirmada.
7. La lista de compras es del hogar. Al regenerarla, conservá los productos agregados a mano.
8. Toda operación valida que el usuario pertenece al hogar. No alcanza con el `householdId` que manda el cliente.
9. La identidad visual es Tomato & Butter, con tokens centralizados. No reutilices la paleta de Mi Cucha.
10. El nombre visible es PrepPari. En slugs, paquetes y URLs usá `preppari`.
11. Los trabajos durables van a `background_job` en PostgreSQL, con un worker separado. Redis es solo Pub/Sub. No sumes otro broker.
12. Escribí tests de las reglas de negocio: porciones, consolidación, listas, aislamiento entre hogares y concurrencia de jobs.
13. En la UI no expliques detalles internos ni técnicos: modo desarrollo, cookies, tokens, ambientes, proveedores o cómo está implementado algo. El usuario ve textos de producto, breves. Si hace falta un ingreso de desarrollo, es un control discreto y sin cartel.

La Fase 0 ya está hecha. Lo que sigue es la Fase 1 del PRD, no un rediseño del bootstrap.

En `frontend/`, las reglas de Next.js de esa carpeta conviven con este archivo. Si se contradicen, manda el PRD.
