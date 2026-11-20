# Pantallas de cocina sin sesión

Estado: aceptada.

Las pantallas de inicio, biblioteca, plan semanal y lista de compras viven en `/inicio`, `/comidas`, `/plan` y `/compras`. No piden sesión. El layout `app/(cocina)` se puede envolver después con la membresía del hogar, cuando cierre la Fase 1. No se tocaron login, hogares ni el backend para no pisar ese PR.

Los datos pasan por el módulo `frontend/src/data/kitchen-store.ts`. Hoy persiste en el navegador. Cambiarlo por la API no exige reescribir las pantallas.

El escalado de porciones, la consolidación y la reconciliación de la lista siguen las reglas de las secciones 10.1 a 10.4 del PRD, en el cliente, para poder usar el flujo antes de que exista ese backend. Cuando la API genere la lista, esa cuenta sale del cliente.

«Sugerir ingredientes» usa un catálogo local y marca las cantidades como estimadas. No llama a un proveedor. Los plurales se unifican solo si el singular está en ese catálogo: cebolla de verdeo no se junta con cebolla.
