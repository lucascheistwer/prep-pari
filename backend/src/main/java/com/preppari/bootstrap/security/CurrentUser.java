package com.preppari.bootstrap.security;

import com.preppari.shared.domain.UnauthorizedException;
import com.preppari.shared.domain.UserId;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {

  private CurrentUser() {}

  public static UserId require() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !(authentication.getPrincipal() instanceof UserId userId)) {
      throw new UnauthorizedException("UNAUTHENTICATED", "Tenés que iniciar sesión.");
    }
    return userId;
  }
}
