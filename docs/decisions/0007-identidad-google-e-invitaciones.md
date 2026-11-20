# Identidad con Google e invitaciones por enlace

Estado: aceptada.

## Login

El proveedor OIDC del MVP es Google. El frontend usa Google Identity Services: el botón devuelve un ID token en el navegador y lo manda a `POST /api/v1/auth/google`. El backend valida firma (JWKS de Google), issuer (`https://accounts.google.com` o `accounts.google.com`), audience (el Client ID), vencimiento con 60 segundos de tolerancia y `email_verified`.

Ese flujo no usa client secret. `GOOGLE_CLIENT_SECRET` está en `.env.example` vacía y la aplicación no la lee. `GOOGLE_CLIENT_ID` sale de la variable de entorno.

El subject de Google se guarda como `google:<sub>` en `app_user.external_subject`. No hay contraseñas propias. Si la persona vuelve a entrar, se actualizan el nombre y el email y se conserva el id interno.

Después de validar, la API firma una sesión HMAC de 7 días (`PREPPARI_SESSION_SECRET`, mínimo 32 bytes) y la deja en la cookie `preppari_session` (`HttpOnly`, `SameSite=Lax`). El token no se devuelve en el JSON ni se loguea. En producción la cookie es `Secure` y el secreto de desarrollo está prohibido.

El redirect URI registrado en Google no participa: el ID token vuelve por el callback de JavaScript. Tiene que estar autorizado el origen `http://localhost:3000`.

## Login de desarrollo

`POST /api/v1/auth/dev` solo existe si `preppari.auth.dev-login-enabled=true`. Eso está encendido en los perfiles `local` y `test`, y apagado en el resto. Si el perfil `production` lo enciende, o si usa el verificador `test` o el secreto de desarrollo, la API no arranca. El subject queda como `dev:<identificador>`.

En tests el verificador de Google es falso y acepta `test|subject|email|nombre`. No llama a Google.

## Invitaciones

La invitación es un enlace de un solo uso, sin email. El token son 32 bytes aleatorios en base64url. En la base se guarda el SHA-256, nunca el token. Vence a los 7 días. Hay como máximo 10 invitaciones pendientes y vigentes por hogar. Quien administra puede revocarlas. Aceptar crea una membresía `MEMBER`, o reactiva una membresía `REMOVED`. Si la persona ya está en el hogar, el enlace no se consume.

El enlace que se copia es `{PREPPARI_PUBLIC_ORIGIN}/invitacion/{token}` y el token viaja una sola vez, en la respuesta de creación.

## Autorización

Cada caso de uso del hogar exige membresía `ACTIVE`. Quien no pertenece recibe 404, para no confirmar que el hogar existe. Invitar, revocar y quitar integrantes es solo del `OWNER`. No se puede quitar a quien administra ni quitarse a sí mismo. Los jobs de `background_job` ahora tienen FK a `household`.
