package com.preppari.identity.application;

import com.preppari.identity.domain.ExternalSubject;
import com.preppari.identity.domain.User;
import com.preppari.shared.application.ClockPort;
import com.preppari.shared.application.IdGeneratorPort;
import com.preppari.shared.application.TransactionPort;
import com.preppari.shared.domain.ConflictException;
import com.preppari.shared.domain.ForbiddenException;
import com.preppari.shared.domain.UserId;
import java.time.Instant;
import java.util.Optional;

public final class IdentityService {

  private final UserRepository users;
  private final ExternalIdentityVerifier identities;
  private final SessionTokenIssuer sessions;
  private final IdGeneratorPort ids;
  private final ClockPort clock;
  private final TransactionPort transactions;
  private final boolean devLoginEnabled;

  public IdentityService(
      UserRepository users,
      ExternalIdentityVerifier identities,
      SessionTokenIssuer sessions,
      IdGeneratorPort ids,
      ClockPort clock,
      TransactionPort transactions,
      boolean devLoginEnabled) {
    this.users = users;
    this.identities = identities;
    this.sessions = sessions;
    this.ids = ids;
    this.clock = clock;
    this.transactions = transactions;
    this.devLoginEnabled = devLoginEnabled;
  }

  public Session signInWithGoogle(String idToken) {
    VerifiedIdentity identity = identities.verify(idToken);
    return openSession(identity.subject(), identity.email(), identity.displayName());
  }

  public Session signInWithDev(String subject, String email, String displayName) {
    if (!devLoginEnabled) {
      throw new ForbiddenException("DEV_LOGIN_DISABLED", "No pudimos entrar. Probá con Google.");
    }
    return openSession(ExternalSubject.dev(subject), email, displayName);
  }

  private Session openSession(ExternalSubject subject, String email, String displayName) {
    return transactions.inTransaction(
        () -> {
          Instant now = clock.now();
          User user = registerOrUpdate(subject, email, displayName, now);
          return new Session(sessions.issue(user.id(), now), user);
        });
  }

  private User registerOrUpdate(
      ExternalSubject subject, String email, String displayName, Instant now) {
    Optional<User> existing = users.findByExternalSubject(subject);
    if (existing.isPresent()) {
      User updated = existing.get().withProfile(email, displayName, now);
      users.updateProfile(updated);
      return updated;
    }
    User created = User.register(new UserId(ids.newId()), subject, email, displayName, now);
    try {
      users.insert(created);
      return created;
    } catch (ConflictException ex) {
      User raced =
          users
              .findByExternalSubject(subject)
              .orElseThrow(
                  () -> new IllegalStateException("La cuenta se creó y no se pudo volver a leer."));
      User updated = raced.withProfile(email, displayName, now);
      users.updateProfile(updated);
      return updated;
    }
  }
}
