package com.preppari.household.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.preppari.household.application.HouseholdViews.Detail;
import com.preppari.household.domain.Household;
import com.preppari.household.domain.HouseholdInvitation;
import com.preppari.household.domain.HouseholdMembership;
import com.preppari.household.domain.InvitationId;
import com.preppari.household.domain.InvitationStatus;
import com.preppari.household.domain.InvitationTokenHash;
import com.preppari.household.domain.MembershipRole;
import com.preppari.identity.domain.ExternalSubject;
import com.preppari.identity.domain.User;
import com.preppari.shared.application.ClockPort;
import com.preppari.shared.application.IdGeneratorPort;
import com.preppari.shared.application.TransactionPort;
import com.preppari.shared.domain.ConflictException;
import com.preppari.shared.domain.DomainException;
import com.preppari.shared.domain.ForbiddenException;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.NotFoundException;
import com.preppari.shared.domain.UserId;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class HouseholdServiceTest {

  private final MutableClock clock = new MutableClock();
  private final MemoryUsers users = new MemoryUsers();
  private MemoryHouseholds households;
  private final MemoryMemberships memberships = new MemoryMemberships();
  private final MemoryInvitations invitations = new MemoryInvitations();
  private final QueueTokens tokens = new QueueTokens();
  private HouseholdService service;
  private UserId ana;
  private UserId bruno;

  @BeforeEach
  void setUp() {
    households = new MemoryHouseholds();
    service =
        new HouseholdService(
            households,
            memberships,
            invitations,
            id ->
                users
                    .findById(id)
                    .map(user -> new UserProfile(user.id(), user.displayName(), user.email())),
            tokens,
            new SequenceIds(),
            clock,
            new DirectTransactions(),
            "http://localhost:3000/");
    ana = users.add("ana", "Ana");
    bruno = users.add("bruno", "Bruno");
  }

  @Test
  void creatorBecomesTheOnlyOwnerAndAnotherHouseholdCannotSeeIt() {
    Detail home = service.create(ana, "  Casa   de Ana ", null);
    UserId outsider = users.add("otra", "Otra");
    Detail other = service.create(outsider, "Otro hogar", null);

    assertThat(home.role()).isEqualTo(MembershipRole.OWNER);
    assertThat(home.name()).isEqualTo("Casa de Ana");
    assertThat(home.timezone()).isEqualTo(Household.DEFAULT_TIMEZONE);
    assertThat(home.members()).extracting(member -> member.userId()).containsExactly(ana);
    assertThat(service.list(ana)).extracting(summary -> summary.id()).containsExactly(home.id());
    assertThatThrownBy(() -> service.get(bruno, home.id())).isInstanceOf(NotFoundException.class);
    assertThatThrownBy(() -> service.invite(bruno, home.id()))
        .isInstanceOf(NotFoundException.class);
    assertThatThrownBy(() -> service.removeMember(bruno, home.id(), ana))
        .isInstanceOf(NotFoundException.class);
    assertThatThrownBy(() -> service.get(ana, other.id())).isInstanceOf(NotFoundException.class);
    assertThatThrownBy(() -> service.create(ana, "Otro de Ana", null))
        .isInstanceOf(ConflictException.class)
        .extracting(DomainException.class::cast)
        .extracting(DomainException::code)
        .isEqualTo("ALREADY_HAS_HOUSEHOLD");
  }

  @Test
  void someoneWhoAlreadyHasAHouseholdCannotJoinAnother() {
    Detail home = service.create(ana, "Casa", null);
    service.create(bruno, "Lo de Bruno", null);
    tokens.add("cruce");
    service.invite(ana, home.id());

    assertThatThrownBy(() -> service.accept(bruno, "cruce"))
        .isInstanceOf(ConflictException.class)
        .extracting(DomainException.class::cast)
        .extracting(DomainException::code)
        .isEqualTo("ALREADY_HAS_HOUSEHOLD");
    assertThat(invitations.only().status()).isEqualTo(InvitationStatus.PENDING);
  }

  @Test
  void twoUsersShareAHouseholdAndAThirdStaysOut() {
    Detail home = service.create(ana, "Casa", null);
    tokens.add("primer-token");
    var created = service.invite(ana, home.id());

    assertThat(created.url()).isEqualTo("http://localhost:3000/invitacion/primer-token");
    assertThat(invitations.only().tokenHash())
        .isEqualTo(InvitationTokenHash.sha256("primer-token"));
    assertThat(invitations.only().tokenHash()).isNotEqualTo("primer-token");

    var preview = service.preview(bruno, "primer-token");
    assertThat(preview.householdName()).isEqualTo("Casa");
    assertThat(preview.inviterName()).isEqualTo("Ana");
    assertThat(preview.alreadyMember()).isFalse();
    assertThat(service.accept(bruno, "primer-token").role()).isEqualTo(MembershipRole.MEMBER);

    Detail shared = service.get(bruno, home.id());
    assertThat(shared.members())
        .extracting(member -> member.displayName())
        .containsExactly("Ana", "Bruno");
    assertThat(shared.invitations()).isEmpty();
    assertThat(service.get(ana, home.id()).members()).hasSize(2);

    UserId cara = users.add("cara", "Cara");
    assertThatThrownBy(() -> service.get(cara, home.id())).isInstanceOf(NotFoundException.class);
    assertThatThrownBy(() -> service.accept(cara, "primer-token"))
        .isInstanceOf(ConflictException.class)
        .extracting(DomainException.class::cast)
        .extracting(DomainException::code)
        .isEqualTo("INVITATION_ALREADY_USED");
  }

  @Test
  void memberCannotInviteOrRemoveAndOwnerCannotRemoveThemself() {
    Detail home = service.create(ana, "Casa", null);
    tokens.add("uno");
    service.invite(ana, home.id());
    service.accept(bruno, "uno");

    assertThatThrownBy(() -> service.invite(bruno, home.id()))
        .isInstanceOf(ForbiddenException.class);
    assertThatThrownBy(() -> service.removeMember(bruno, home.id(), ana))
        .isInstanceOf(ForbiddenException.class);
    assertThatThrownBy(() -> service.removeMember(ana, home.id(), ana))
        .isInstanceOf(DomainException.class)
        .extracting(DomainException.class::cast)
        .extracting(DomainException::code)
        .isEqualTo("CANNOT_REMOVE_SELF");

    service.removeMember(ana, home.id(), bruno);
    assertThatThrownBy(() -> service.get(bruno, home.id())).isInstanceOf(NotFoundException.class);

    tokens.add("dos");
    service.invite(ana, home.id());
    assertThat(service.accept(bruno, "dos").householdId()).isEqualTo(home.id());
    assertThat(service.get(bruno, home.id()).role()).isEqualTo(MembershipRole.MEMBER);
  }

  @Test
  void expiredAndRevokedInvitationsCannotBeAcceptedAndPendingOnesAreCapped() {
    Detail home = service.create(ana, "Casa", null);
    tokens.add("vence");
    service.invite(ana, home.id());
    clock.now = clock.now.plus(HouseholdInvitation.TTL).plusSeconds(1);

    assertThatThrownBy(() -> service.accept(bruno, "vence"))
        .isInstanceOf(DomainException.class)
        .extracting(DomainException.class::cast)
        .extracting(DomainException::code)
        .isEqualTo("INVITATION_EXPIRED");
    assertThat(invitations.only().status()).isEqualTo(InvitationStatus.EXPIRED);

    clock.now = Instant.parse("2026-11-20T15:00:00Z");
    tokens.add("revocar");
    var created = service.invite(ana, home.id());
    service.revoke(ana, home.id(), created.id());
    assertThatThrownBy(() -> service.accept(bruno, "revocar"))
        .isInstanceOf(DomainException.class)
        .extracting(DomainException.class::cast)
        .extracting(DomainException::code)
        .isEqualTo("INVITATION_REVOKED");

    for (int i = 0; i < HouseholdInvitation.MAX_USABLE_PENDING; i++) {
      tokens.add("extra-" + i);
      service.invite(ana, home.id());
    }
    tokens.add("de-mas");
    assertThatThrownBy(() -> service.invite(ana, home.id()))
        .isInstanceOf(DomainException.class)
        .extracting(DomainException.class::cast)
        .extracting(DomainException::code)
        .isEqualTo("TOO_MANY_INVITATIONS");
  }

  @Test
  void anAlreadyMemberDoesNotConsumeTheToken() {
    Detail home = service.create(ana, "Casa", null);
    tokens.add("propio");
    service.invite(ana, home.id());

    assertThat(service.preview(ana, "propio").alreadyMember()).isTrue();
    assertThatThrownBy(() -> service.accept(ana, "propio"))
        .isInstanceOf(ConflictException.class)
        .extracting(DomainException.class::cast)
        .extracting(DomainException::code)
        .isEqualTo("ALREADY_MEMBER");
    assertThat(invitations.only().status()).isEqualTo(InvitationStatus.PENDING);
    service.accept(bruno, "propio");
    assertThat(service.get(bruno, home.id()).members()).hasSize(2);
  }

  private static final class MutableClock implements ClockPort {
    private Instant now = Instant.parse("2026-11-20T15:00:00Z");

    @Override
    public Instant now() {
      return now;
    }
  }

  private static final class SequenceIds implements IdGeneratorPort {
    private final AtomicLong sequence = new AtomicLong(1);

    @Override
    public UUID newId() {
      return new UUID(0, sequence.getAndIncrement());
    }
  }

  private static final class DirectTransactions implements TransactionPort {
    @Override
    public <T> T inTransaction(Supplier<T> work) {
      return work.get();
    }
  }

  private static final class QueueTokens implements InvitationTokenGenerator {
    private final List<String> pending = new ArrayList<>();

    void add(String token) {
      pending.add(token);
    }

    @Override
    public String newToken() {
      return pending.remove(0);
    }
  }

  private static final class MemoryUsers
      implements com.preppari.identity.application.UserRepository {
    private final List<User> users = new ArrayList<>();
    private final SequenceIds ids = new SequenceIds();

    UserId add(String subject, String name) {
      User user =
          User.register(
              new UserId(ids.newId()),
              ExternalSubject.dev(subject),
              subject + "@example.com",
              name,
              Instant.parse("2026-11-20T15:00:00Z"));
      users.add(user);
      return user.id();
    }

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
      users.add(user);
    }

    @Override
    public void updateProfile(User user) {
      users.removeIf(existing -> existing.id().equals(user.id()));
      users.add(user);
    }
  }

  private final class MemoryHouseholds implements HouseholdRepository {
    private final List<Household> rows = new ArrayList<>();

    @Override
    public void insert(Household household) {
      rows.add(household);
    }

    @Override
    public Optional<Household> findById(HouseholdId id) {
      return rows.stream().filter(row -> row.id().equals(id)).findFirst();
    }

    @Override
    public List<HouseholdViews.Summary> listActiveFor(UserId userId) {
      return rows.stream()
          .filter(
              household ->
                  memberships
                      .find(household.id(), userId)
                      .map(HouseholdMembership::isActive)
                      .orElse(false))
          .map(
              household ->
                  new HouseholdViews.Summary(
                      household.id(),
                      household.name(),
                      memberships.find(household.id(), userId).orElseThrow().role()))
          .toList();
    }
  }

  private final class MemoryMemberships implements MembershipRepository {
    private final List<HouseholdMembership> rows = new ArrayList<>();

    @Override
    public void insert(HouseholdMembership membership) {
      if (find(membership.householdId(), membership.userId()).isPresent()) {
        throw new com.preppari.shared.domain.ConflictException(
            "ALREADY_MEMBER", "Ya formás parte de este hogar.");
      }
      rows.add(membership);
    }

    @Override
    public void update(HouseholdMembership membership) {
      rows.removeIf(row -> row.id().equals(membership.id()));
      rows.add(membership);
    }

    @Override
    public Optional<HouseholdMembership> find(HouseholdId householdId, UserId userId) {
      return rows.stream()
          .filter(row -> row.householdId().equals(householdId) && row.userId().equals(userId))
          .findFirst();
    }

    @Override
    public List<HouseholdViews.Member> listActive(HouseholdId householdId) {
      return rows.stream()
          .filter(row -> row.householdId().equals(householdId) && row.isActive())
          .map(
              row -> {
                User user = users.findById(row.userId()).orElseThrow();
                return new HouseholdViews.Member(
                    user.id(), user.displayName(), user.email(), row.role(), row.joinedAt());
              })
          .toList();
    }
  }

  private static final class MemoryInvitations implements InvitationRepository {
    private final List<HouseholdInvitation> rows = new ArrayList<>();

    HouseholdInvitation only() {
      return rows.get(0);
    }

    @Override
    public void insert(HouseholdInvitation invitation) {
      rows.add(invitation);
    }

    @Override
    public void updateFromPending(HouseholdInvitation invitation) {
      HouseholdInvitation current =
          rows.stream().filter(row -> row.id().equals(invitation.id())).findFirst().orElseThrow();
      if (current.status() != InvitationStatus.PENDING) {
        throw new com.preppari.shared.domain.ConflictException(
            "INVITATION_ALREADY_USED", "Esta invitación ya se usó.");
      }
      rows.remove(current);
      rows.add(invitation);
    }

    @Override
    public Optional<InvitationDetails> findByTokenHash(String tokenHash) {
      return rows.stream()
          .filter(row -> row.tokenHash().equals(tokenHash))
          .findFirst()
          .map(row -> new InvitationDetails(row, "Casa", "Ana"));
    }

    @Override
    public Optional<HouseholdInvitation> findById(HouseholdId householdId, InvitationId id) {
      return rows.stream()
          .filter(row -> row.id().equals(id) && row.householdId().equals(householdId))
          .findFirst();
    }

    @Override
    public int countUsablePending(HouseholdId householdId, Instant now) {
      return (int)
          rows.stream()
              .filter(row -> row.householdId().equals(householdId) && row.isUsableAt(now))
              .count();
    }

    @Override
    public List<HouseholdInvitation> listUsablePending(HouseholdId householdId, Instant now) {
      return rows.stream()
          .filter(row -> row.householdId().equals(householdId) && row.isUsableAt(now))
          .toList();
    }
  }
}
