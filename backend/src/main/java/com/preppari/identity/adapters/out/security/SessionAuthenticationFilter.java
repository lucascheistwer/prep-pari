package com.preppari.identity.adapters.out.security;

import com.preppari.identity.application.SessionTokenIssuer;
import com.preppari.shared.application.ClockPort;
import com.preppari.shared.domain.UserId;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class SessionAuthenticationFilter extends OncePerRequestFilter {

  private final SessionTokenIssuer sessions;
  private final ClockPort clock;

  public SessionAuthenticationFilter(SessionTokenIssuer sessions, ClockPort clock) {
    this.sessions = sessions;
    this.clock = clock;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String token = bearer(request);
    if (token == null) {
      token = SessionCookie.read(request);
    }
    if (token != null) {
      sessions
          .verify(token, clock.now())
          .ifPresent(
              (UserId userId) -> {
                UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, List.of());
                SecurityContextHolder.getContext().setAuthentication(authentication);
              });
    }
    chain.doFilter(request, response);
  }

  private static String bearer(HttpServletRequest request) {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header == null || !header.startsWith("Bearer ")) {
      return null;
    }
    String token = header.substring("Bearer ".length()).trim();
    return token.isEmpty() ? null : token;
  }
}
