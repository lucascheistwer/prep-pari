package com.preppari.shared.adapters.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.MDC;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@ConditionalOnWebApplication
public class TraceIdFilter extends OncePerRequestFilter {

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String incoming = request.getHeader("X-Request-Id");
    String traceId =
        incoming == null || incoming.isBlank() ? UUID.randomUUID().toString() : incoming.trim();
    if (traceId.length() > 80) {
      traceId = traceId.substring(0, 80);
    }
    MDC.put(TraceIds.MDC_KEY, traceId);
    response.setHeader("X-Trace-Id", traceId);
    try {
      chain.doFilter(request, response);
    } finally {
      MDC.remove(TraceIds.MDC_KEY);
    }
  }
}
