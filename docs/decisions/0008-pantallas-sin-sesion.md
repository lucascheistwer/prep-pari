# Pantallas de cocina sin sesión

Estado: aceptada.

Las pantallas de inicio, biblioteca, plan semanal, lista de compras y la casa viven en `/inicio`, `/comidas`, `/plan`, `/compras` y `/casa`. No piden sesión. El layout `app/(cocina)` convive con el hogar de la Fase 1.

Cada comida tiene su rendimiento, sugerido al crearla (por ejemplo, 1 tarta son 6 porciones). «¿Para cuántos cocinás?» es de la casa, arranca en 4 y solo cambia las entradas nuevas del plan. La lista escala ingredientes por porciones del plan sobre el rendimiento de la comida.

Los datos pasan por el módulo `frontend/src/data/kitchen-store.ts`. Hoy persiste en el navegador. Cambiarlo por la API no exige reescribir las pantallas.

El escalado de porciones, la consolidación y la reconciliación de la lista siguen las reglas de las secciones 10.1 a 10.4 del PRD, en el cliente, para poder usar el flujo antes de que exista ese backend. Cuando la API genere la lista, esa cuenta sale del cliente.

«Sugerir ingredientes» usa un catálogo local y marca las cantidades como estimadas. No llama a un proveedor. Los plurales se unifican solo si el singular está en ese catálogo: cebolla de verdeo no se junta con cebolla.
