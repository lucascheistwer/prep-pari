# Configuración por ambiente e IA fake

Estado: aceptada.

No hay modelos escritos en el código. `PREPPARI_AI_TEXT_MODEL` y `PREPPARI_AI_IMAGE_MODEL` pueden estar vacíos. El guard de arranque solo acepta `preppari.ai.provider=fake`. Otro valor falla con un mensaje explícito, para no simular que Gemini ya está conectado.

Los ports `DishEnrichmentPort` y `DishImagePort` existen, y sus adapters fake lanzan `UnsupportedOperationException`. No devuelven ingredientes de mentira: la Fase 2 tiene que implementar el fake determinístico y el adapter real. La aplicación no lee `PREPPARI_AI_API_KEY`.

Los perfiles son `local`, `worker`, `test` y `production`. El de producción no guarda secretos y deja las migraciones apagadas. Los logs de producción son una línea con `traceId`; el JSON estructurado de la sección 17 queda para el hardening.

CORS solo está habilitado en el perfil `local`, desde `http://localhost:3000`. En Vercel el tráfico es same-origin.
