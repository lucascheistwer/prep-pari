package com.preppari.household.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.preppari.shared.domain.ConflictException;
import com.preppari.shared.domain.DomainException;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class HouseholdRulesTest {

  private static final Instant NOW = Instant.parse("2026-11-20T15:00:00Z");
  private static final HouseholdId HOUSEHOLD = new HouseholdId(UUID.randomUUID());
  private static final UserId OWNER = new UserId(UUID.randomUUID());

  @Test
  void householdNameIsTrimmedAndRejectsBlankOrTooLong() {
    Household household = Household.create(HOUSEHOLD, "  Casa   de Ana  ", null, OWNER, NOW);

    assertThat(household.name()).isEqualTo("Casa de Ana");
    assertThat(household.timezone()).isEqualTo(Household.DEFAULT_TIMEZONE);
    assertThatThrownBy(() -> Household.create(HOUSEHOLD, "   ", null, OWNER, NOW))
        .isInstanceOf(DomainException.class)
        .extracting("code")
        .isEqualTo("INVALID_HOUSEHOLD_NAME");
    assertThatThrownBy(() -> Household.create(HOUSEHOLD, "a".repeat(81), "No/Existe", OWNER, NOW))
        .isInstanceOf(DomainException.class);
  }

  @Test
  void invitationIsSingleUseAndExpires() {
    HouseholdInvitation invitation =
        HouseholdInvitation.issue(
            new InvitationId(UUID.randomUUID()),
            HOUSEHOLD,
            InvitationTokenHash.sha256("token-secreto"),
            OWNER,
            NOW);

    assertThat(invitation.tokenHash()).isNotEqualTo("token-secreto");
    assertThat(invitation.tokenHash()).hasSize(64);
    assertThat(invitation.accept(NOW).status()).isEqualTo(InvitationStatus.ACCEPTED);
    assertThatThrownBy(() -> invitation.accept(NOW).accept(NOW.plusSeconds(1)))
        .isInstanceOf(ConflictException.class)
        .extracting("code")
        .isEqualTo("INVITATION_ALREADY_USED");
    assertThatThrownBy(() -> invitation.accept(NOW.plus(HouseholdInvitation.TTL).plusSeconds(1)))
        .isInstanceOf(DomainException.class)
        .extracting("code")
        .isEqualTo("INVITATION_EXPIRED");
    assertThat(invitation.revoke(NOW).status()).isEqualTo(InvitationStatus.REVOKED);
    assertThatThrownBy(() -> invitation.revoke(NOW).accept(NOW))
        .isInstanceOf(DomainException.class)
        .extracting("code")
        .isEqualTo("INVITATION_REVOKED");
  }

  @Test
  void ownerCannotBeRemovedAndARemovedMemberCanRejoin() {
    HouseholdMembership owner = HouseholdMembership.owner(UUID.randomUUID(), HOUSEHOLD, OWNER, NOW);
    HouseholdMembership member =
        HouseholdMembership.member(
            UUID.randomUUID(), HOUSEHOLD, new UserId(UUID.randomUUID()), NOW);

    assertThat(owner.isOwner()).isTrue();
    assertThat(member.remove().isActive()).isFalse();
    assertThat(member.remove().reactivateAsMember(NOW.plusSeconds(5)).role())
        .isEqualTo(MembershipRole.MEMBER);
    assertThatThrownBy(() -> member.remove().remove()).isInstanceOf(DomainException.class);
  }
}
