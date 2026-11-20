package com.preppari;

import com.preppari.bootstrap.configuration.AiProperties;
import com.preppari.bootstrap.configuration.AuthProperties;
import com.preppari.bootstrap.configuration.WorkerProperties;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({AiProperties.class, AuthProperties.class, WorkerProperties.class})
public class PrepPariApplication {

  public static void main(String[] args) {
    String mode = resolveMode(args);
    SpringApplicationBuilder builder =
        new SpringApplicationBuilder(PrepPariApplication.class)
            .properties("preppari.runtime.mode=" + mode);
    if ("worker".equals(mode)) {
      builder.web(WebApplicationType.NONE).profiles("worker");
    }
    builder.run(args);
  }

  static String resolveMode(String[] args) {
    String mode = System.getenv().getOrDefault("PREPPARI_RUNTIME_MODE", "api");
    for (String arg : args) {
      String prefix = "--preppari.runtime.mode=";
      if (arg.startsWith(prefix)) {
        mode = arg.substring(prefix.length());
      }
    }
    return mode.trim().toLowerCase();
  }
}
