package com.preppari.bootstrap.errorhandling;

import com.preppari.shared.adapters.observability.TraceIds;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.springframework.http.MediaType;

public final class ApiErrorWriter {

  private ApiErrorWriter() {}

  public static void write(HttpServletResponse response, int status, String code, String message)
      throws IOException {
    response.setStatus(status);
    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
    response
        .getWriter()
        .write(
            "{\"code\":"
                + json(code)
                + ",\"message\":"
                + json(message)
                + ",\"details\":[],\"traceId\":"
                + json(TraceIds.current())
                + "}");
  }

  static String json(String value) {
    if (value == null) {
      return "null";
    }
    return "\""
        + value
            .replace("\\", "\\\\")
            .replace("\"", "\\\"")
            .replace("\n", "\\n")
            .replace("\r", "\\r")
        + "\"";
  }
}
