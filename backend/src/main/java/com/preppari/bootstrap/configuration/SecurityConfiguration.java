package com.preppari.bootstrap.configuration;

import com.preppari.bootstrap.errorhandling.ApiErrorWriter;
import com.preppari.identity.adapters.out.security.HmacSessionTokens;
import com.preppari.identity.adapters.out.security.SessionAuthenticationFilter;
import com.preppari.identity.application.SessionTokenIssuer;
import com.preppari.shared.application.ClockPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@ConditionalOnWebApplication
public class SecurityConfiguration {

  @Bean
  SessionTokenIssuer sessionTokenIssuer(AuthProperties properties) {
    return new HmacSessionTokens(properties.getSessionSecret(), properties.getSessionTtl());
  }

  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http, SessionTokenIssuer sessions, ClockPort clock) throws Exception {
    http.csrf(AbstractHttpConfigurer::disable)
        .sessionManagement(
            session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers(
                        "/api/health", "/actuator/health", "/actuator/health/**", "/error")
                    .permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/v1/auth/config")
                    .permitAll()
                    .requestMatchers(
                        HttpMethod.POST,
                        "/api/v1/auth/google",
                        "/api/v1/auth/dev",
                        "/api/v1/auth/logout")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .exceptionHandling(
            errors ->
                errors
                    .authenticationEntryPoint(
                        (request, response, exception) ->
                            ApiErrorWriter.write(
                                response, 401, "UNAUTHENTICATED", "Tenés que iniciar sesión."))
                    .accessDeniedHandler(
                        (request, response, exception) ->
                            ApiErrorWriter.write(
                                response, 403, "FORBIDDEN", "No podés hacer eso.")))
        .addFilterBefore(
            new SessionAuthenticationFilter(sessions, clock),
            UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  UserDetailsService userDetailsService() {
    return username -> {
      throw new UsernameNotFoundException("PrepPari no usa contraseñas propias.");
    };
  }
}
