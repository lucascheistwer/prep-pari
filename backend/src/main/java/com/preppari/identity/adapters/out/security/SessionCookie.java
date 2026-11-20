package com.preppari.identity.adapters.out.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;

public final class SessionCookie {

  public static final String NAME = "preppari_session";

  private SessionCookie() {}

  public static void write(
      HttpServletResponse response, String token, Duration ttl, boolean secure) {
    response.addHeader(HttpHeaders.SET_COOKIE, cookie(token, ttl, secure).toString());
  }

  public static void clear(HttpServletResponse response, boolean secure) {
    response.addHeader(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO, secure).toString());
  }

  public static String read(HttpServletRequest request) {
    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }
    for (Cookie cookie : cookies) {
      if (NAME.equals(cookie.getName())
          && cookie.getValue() != null
          && !cookie.getValue().isBlank()) {
        return cookie.getValue();
      }
    }
    return null;
  }

  private static ResponseCookie cookie(String token, Duration ttl, boolean secure) {
    return ResponseCookie.from(NAME, token)
        .httpOnly(true)
        .secure(secure)
        .sameSite("Lax")
        .path("/")
        .maxAge(ttl)
        .build();
  }
}
