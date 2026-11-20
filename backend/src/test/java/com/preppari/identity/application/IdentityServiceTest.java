package com.preppari.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.preppari.identity.domain.ExternalSubject;
import com.preppari.identity.domain.User;
import com.preppari.shared.application.IdGeneratorPort;
import com.preppari.shared.application.TransactionPort;
import com.preppari.shared.domain.ConflictException;
import com.preppari.shared.domain.ForbiddenException;
import com.preppari.shared.domain.UserId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Supplier;
import org.junit.jupiter.api.Test;

class IdentityServiceTest {

  @Test
  void googleSubjectMapsToOneInternalUserAndRefreshesTheProfile() {
    MemoryUsers users = new MemoryUsers();
    IdentityService service =
        service(users, true, token -> verified("111", "Ana", "ana@example.com"));

    Session first = service.signInWithGoogle("token");
    Session second =
        service(users, true, token -> verified("111", "Ana Actualizada", "ana@example.com"))
            .signInWithGoogle("token");

    assertThat(first.user().externalSubject()).isEqualTo(ExternalSubject.google("111"));
    assertThat(second.user().id()).isEqualTo(first.user().id());
    assertThat(second.user().displayName()).isEqualTo("Ana Actualizada");
    assertThat(users.users).hasSize(1);
  }

  @Test
  void devLoginIsRejectedWhenDisabledAndMapsAStableSubjectWhenEnabled() {
    MemoryUsers users = new MemoryUsers();
    assertThatThrownBy(() -> service(users, false, token -> null).signInWithDev("ana", null, "Ana"))
        .isInstanceOf(ForbiddenException.class);

    Session session =
        service(users, true, token -> null).signInWithDev("ana", "ANA@Example.com", "Ana");

    assertThat(session.user().externalSubject()).isEqualTo(ExternalSubject.dev("ana"));
    assertThat(session.user().email()).isEqualTo("ana@example.com");
    assertThat(session.accessToken()).isEqualTo("sesion-" + session.user().id().value());
  }

  private static IdentityService service(
      MemoryUsers users, boolean devLogin, ExternalIdentityVerifier verifier) {
    return new IdentityService(
        users,
        verifier,
        new SessionTokenIssuer() {
          @Override
          public String issue(UserId userId, Instant issuedAt) {
            return "sesion-" + userId.value();
          }

          @Override
          public Optional<UserId> verify(String token, Instant now) {
            return Optional.empty();
          }
        },
        new SequenceIds(),
        () -> Instant.parse("2026-11-20T15:00:00Z"),
        new DirectTransactions(),
        devLogin);
  }

  private static VerifiedIdentity verified(String subject, String name, String email) {
    return new VerifiedIdentity(ExternalSubject.google(subject), email, name);
  }

  private static final class SequenceIds implements IdGeneratorPort {
    private long sequence = 1;

    @Override
    public UUID newId() {
      return new UUID(0, sequence++);
    }
  }

  private static final class DirectTransactions implements TransactionPort {
    @Override
    public <T> T inTransaction(Supplier<T> work) {
      return work.get();
    }
  }

  private static final class MemoryUsers implements UserRepository {
    private final List<User> users = new ArrayList<>();

    @Override
    public Optional<User> findByExternalSubject(ExternalSubject subject) {
      return users.stream().filter(user -> user.externalSubject().equals(subject)).findFirst();
    }

    @Override
    public Optional<User> findById(UserId id) {
      return users.stream().filter(user -> user.id().equals(id)).findFirst();
    }

    @Override
    public void insert(User user) {
      if (findByExternalSubject(user.externalSubject()).isPresent()) {
        throw new ConflictException("USER_ALREADY_REGISTERED", "Esa cuenta ya existe.");
      }
      users.add(user);
    }

    @Override
    public void updateProfile(User user) {
      users.removeIf(existing -> existing.id().equals(user.id()));
      users.add(user);
    }
  }
}
