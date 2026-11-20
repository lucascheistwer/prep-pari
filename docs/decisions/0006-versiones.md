# Versiones fijadas

Estado: aceptada el 20 de noviembre de 2026.

| Pieza | Versión |
|---|---|
| Java | 21 (runtime de imagen `eclipse-temurin:21.0.9_10-jre-jammy`) |
| Spring Boot | 4.1.3 |
| Maven de la imagen | 3.9.11 (`maven:3.9.11-eclipse-temurin-21`) |
| Next.js | 16.4.6 |
| React | 19.3.0 |
| Tailwind CSS | 4.3.3 |
| Node | 22 (`node:22.23.4-alpine` en la imagen) |
| TypeScript | 5.9.3 |
| ESLint | 9.39.5 |
| Prettier | 3.10.1 |
| Spotless | 3.11.0, con google-java-format 1.28.0 |
| ArchUnit | 1.5.1 |
| Testcontainers | 2.0.5 |
| PostgreSQL | 16.16 (`postgres:16.16-alpine`) |
| Redis | 7.4.12 (`redis:7.4.12-alpine`) |

Spring Boot 4.2.0 salió el 19 de noviembre de 2026. Se queda en 4.1.3, el patch de la línea anterior publicado el mismo día, para no adoptar un minor de un día en el bootstrap. Subir a 4.2 es un cambio chico y separado.

Las dependencias de npm y Maven no usan rangos. Las imágenes de Docker usan tags con versión, no `latest`.
