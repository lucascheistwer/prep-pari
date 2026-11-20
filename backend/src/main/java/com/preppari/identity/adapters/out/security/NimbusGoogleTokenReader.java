package com.preppari.identity.adapters.out.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.JWKSourceBuilder;
import com.nimbusds.jose.proc.BadJOSEException;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import com.preppari.identity.application.GoogleTokenClaims;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URI;
import java.text.ParseException;
import java.util.Date;
import java.util.List;

public final class NimbusGoogleTokenReader implements SignedGoogleTokenReader {

  private final DefaultJWTProcessor<SecurityContext> processor;

  public NimbusGoogleTokenReader(String jwkSetUri) {
    try {
      JWKSource<SecurityContext> keys =
          JWKSourceBuilder.create(URI.create(jwkSetUri).toURL()).cache(true).retrying(true).build();
      JWSKeySelector<SecurityContext> selector =
          new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keys);
      DefaultJWTProcessor<SecurityContext> jwtProcessor = new DefaultJWTProcessor<>();
      jwtProcessor.setJWSKeySelector(selector);
      jwtProcessor.setJWTClaimsSetVerifier((claims, context) -> {});
      this.processor = jwtProcessor;
    } catch (MalformedURLException | IllegalArgumentException ex) {
      throw new IllegalStateException("GOOGLE_JWK_SET_URI es inválida.", ex);
    }
  }

  @Override
  public GoogleTokenClaims read(String idToken) {
    try {
      JWTClaimsSet claims = processor.process(idToken, null);
      Date expiresAt = claims.getExpirationTime();
      List<String> audience = claims.getAudience();
      return new GoogleTokenClaims(
          claims.getIssuer(),
          audience == null ? List.of() : audience,
          claims.getSubject(),
          claims.getStringClaim("email"),
          claims.getBooleanClaim("email_verified"),
          claims.getStringClaim("name"),
          expiresAt == null ? null : expiresAt.toInstant());
    } catch (ParseException | BadJOSEException | JOSEException ex) {
      if (causedByIo(ex)) {
        throw new GoogleTokenUnavailable(ex);
      }
      throw new GoogleTokenRejected(ex);
    }
  }

  private static boolean causedByIo(Throwable error) {
    Throwable current = error;
    while (current != null) {
      if (current instanceof IOException) {
        return true;
      }
      current = current.getCause();
    }
    return false;
  }
}
