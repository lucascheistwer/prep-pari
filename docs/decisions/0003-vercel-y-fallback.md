# Despliegue Vercel y fallback

Estado: aceptada para el bootstrap. Hay que validarla en el primer deploy real.

Se contrastó la documentación pública el 20 de noviembre de 2026:

- Services: https://vercel.com/docs/services
- Referencia de servicios: https://vercel.com/docs/services/config-reference
- Container Runtime: https://vercel.com/docs/functions/runtimes/container
- Daemons: https://vercel.com/docs/daemons
- Referencia de daemons: https://vercel.com/docs/daemons/config-reference

`experimentalServices` quedó atrás. El modelo vigente es `services` más `rewrites` con `destination.service`, y `daemons` al lado. Un daemon exige `root`, `entrypoint` e `instances`. El entrypoint puede llamarse `Dockerfile.worker`. El nombre `enrichment-worker` cumple las reglas de nombres (minúsculas y guiones).

Durante la beta los daemons solo corren en producción, con cantidad de instancias manual, sin disco persistente y sin preview. `vercel dev` no los levanta. Por eso el worker se prueba con Docker Compose.

Container Runtime escucha por defecto el puerto 80, salvo que el proyecto defina `PORT`. La API usa `${PORT:8080}` y la imagen deja `PORT=8080`. Antes del primer deploy hay que confirmar que el proyecto de Vercel inyecta `PORT` o setear `PORT=8080` en el servicio `api`. No hay un campo de puerto en la referencia de `services` que se pueda declarar en `vercel.json`.

Los rewrites de `/api/(.*)` y `/ws/(.*)` apuntan al servicio `api` sin reescribir el path. Se asume que Spring recibe el path original (`/api/health`, más adelante `/api/v1/...`). Hay que comprobarlo en el primer deploy. Si Vercel recorta el prefijo, se ajusta el rewrite o el context path, sin cambiar el contrato.

La región `iad1` es la de los ejemplos oficiales. No es una decisión de producto: hay que alinearla con la región de PostgreSQL antes de producción. Una instancia alcanza para el MVP.

No se declara `livenessProbe` en el daemon. Ver `0002`.

Si Services, Container Runtime o Daemons no resultan usables en el plan de Lucas, el frontend puede seguir en Vercel y el mismo Dockerfile de API y worker se despliega en Railway o Render. Eso cambia red y CORS, no el dominio ni la cola. No se reescribe el backend en Node.
