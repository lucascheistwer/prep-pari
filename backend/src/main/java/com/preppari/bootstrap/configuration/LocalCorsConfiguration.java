package com.preppari.bootstrap.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Solo para el frontend en localhost. En Vercel el tráfico es same-origin y no hace falta CORS. */
@Configuration
@Profile("local")
public class LocalCorsConfiguration implements WebMvcConfigurer {

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins("http://localhost:3000")
        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE")
        .allowedHeaders("Content-Type", "Authorization", "X-Request-Id")
        .allowCredentials(true);
  }
}
