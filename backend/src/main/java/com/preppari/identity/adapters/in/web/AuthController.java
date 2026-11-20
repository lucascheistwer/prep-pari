package com.preppari.identity.adapters.in.web;

import com.preppari.bootstrap.configuration.AuthProperties;
import com.preppari.identity.adapters.out.security.SessionCookie;
import com.preppari.identity.application.IdentityService;
import com.preppari.identity.application.Session;
import com.preppari.identity.domain.User;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@ConditionalOnWebApplication
public class AuthController {

  private final IdentityService identity;
  private final AuthProperties properties;

  public AuthController(IdentityService identity, AuthProperties properties) {
    this.identity = identity;
    this.properties = properties;
  }

  @GetMapping("/config")
  public AuthConfigResponse config() {
    String clientId = properties.getGoogle().getClientId();
    if (clientId != null && clientId.isBlank()) {
      clientId = null;
    }
    return new AuthConfigResponse(clientId, properties.isDevLoginEnabled());
  }

  @PostMapping("/google")
  public SessionResponse google(
      @Valid @RequestBody GoogleLoginRequest request, HttpServletResponse response) {
    return writeSession(identity.signInWithGoogle(request.idToken()), response);
  }

  @PostMapping("/logout")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void logout(HttpServletResponse response) {
    SessionCookie.clear(response, properties.isCookieSecure());
  }

  SessionResponse writeSession(Session session, HttpServletResponse response) {
    SessionCookie.write(
        response, session.accessToken(), properties.getSessionTtl(), properties.isCookieSecure());
    User user = session.user();
    return new SessionResponse(user.id().value(), user.email(), user.displayName());
  }

  public record GoogleLoginRequest(
      @NotBlank(message = "El token es obligatorio.")
          @Size(max = 8192, message = "El token es demasiado largo.")
          String idToken) {}

  public record AuthConfigResponse(String googleClientId, boolean devLoginEnabled) {}

  public record SessionResponse(java.util.UUID id, String email, String displayName) {}
}
