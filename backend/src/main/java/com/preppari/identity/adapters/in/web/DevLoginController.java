package com.preppari.identity.adapters.in.web;

import com.preppari.identity.application.IdentityService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@ConditionalOnWebApplication
@ConditionalOnProperty(prefix = "preppari.auth", name = "dev-login-enabled", havingValue = "true")
public class DevLoginController {

  private final IdentityService identity;
  private final AuthController auth;

  public DevLoginController(IdentityService identity, AuthController auth) {
    this.identity = identity;
    this.auth = auth;
  }

  @PostMapping("/dev")
  public AuthController.SessionResponse dev(
      @Valid @RequestBody DevLoginRequest request, HttpServletResponse response) {
    String email = request.email() == null || request.email().isBlank() ? null : request.email();
    return auth.writeSession(
        identity.signInWithDev(request.subject(), email, request.displayName()), response);
  }

  public record DevLoginRequest(
      @NotBlank(message = "El identificador es obligatorio.")
          @Pattern(
              regexp = "[A-Za-z0-9._\\-]{1,64}",
              message =
                  "El identificador solo puede tener letras, números, punto, guion y guion bajo.")
          String subject,
      @Email(message = "El email no es válido.")
          @Size(max = 320, message = "El email es demasiado largo.")
          String email,
      @NotBlank(message = "El nombre es obligatorio.")
          @Size(max = 120, message = "El nombre es demasiado largo.")
          String displayName) {}
}
