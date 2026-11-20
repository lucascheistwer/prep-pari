package com.preppari.identity.adapters.out.security;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.preppari.identity.application.SessionTokenIssuer;
import com.preppari.shared.domain.UserId;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

public final class HmacSessionTokens implements SessionTokenIssuer {

  static final String ISSUER = "preppari";

  private final byte[] secret;
  private final Duration ttl;

  public HmacSessionTokens(String secret, Duration ttl) {
    if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
      throw new IllegalStateException("PREPPARI_SESSION_SECRET tiene que tener al menos 32 bytes.");
    }
    if (ttl == null || ttl.isZero() || ttl.isNegative()) {
      throw new IllegalStateException("La duración de la sesión es inválida.");
    }
    this.secret = secret.getBytes(StandardCharsets.UTF_8);
    this.ttl = ttl;
  }

  @Override
  public String issue(UserId userId, Instant issuedAt) {
    JWTClaimsSet claims =
        new JWTClaimsSet.Builder()
            .issuer(ISSUER)
            .subject(userId.value().toString())
            .issueTime(Date.from(issuedAt))
            .expirationTime(Date.from(issuedAt.plus(ttl)))
            .build();
    try {
      SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
      jwt.sign(new MACSigner(secret));
      return jwt.serialize();
    } catch (JOSEException ex) {
      throw new IllegalStateException("No se pudo firmar la sesión.", ex);
    }
  }

  @Override
  public Optional<UserId> verify(String token, Instant now) {
    if (token == null || token.isBlank()) {
      return Optional.empty();
    }
    try {
      SignedJWT jwt = SignedJWT.parse(token);
      if (!jwt.verify(new MACVerifier(secret))) {
        return Optional.empty();
      }
      JWTClaimsSet claims = jwt.getJWTClaimsSet();
      if (!ISSUER.equals(claims.getIssuer()) || claims.getExpirationTime() == null) {
        return Optional.empty();
      }
      if (!claims.getExpirationTime().toInstant().isAfter(now)) {
        return Optional.empty();
      }
      return Optional.of(new UserId(UUID.fromString(claims.getSubject())));
    } catch (ParseException | JOSEException | IllegalArgumentException ex) {
      return Optional.empty();
    }
  }
}
