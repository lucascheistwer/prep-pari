package com.preppari.identity.application;

import com.preppari.shared.domain.UserId;
import java.time.Instant;
import java.util.Optional;

public interface SessionTokenIssuer {

  String issue(UserId userId, Instant issuedAt);

  Optional<UserId> verify(String token, Instant now);
}
