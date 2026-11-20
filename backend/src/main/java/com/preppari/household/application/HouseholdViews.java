package com.preppari.household.application;

import com.preppari.household.domain.InvitationId;
import com.preppari.household.domain.MembershipRole;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import java.time.Instant;
import java.util.List;

public final class HouseholdViews {

  private HouseholdViews() {}

  public record Summary(HouseholdId id, String name, MembershipRole role) {}

  public record Member(
      UserId userId, String displayName, String email, MembershipRole role, Instant joinedAt) {}

  public record PendingInvitation(InvitationId id, Instant expiresAt, Instant createdAt) {}

  public record Detail(
      HouseholdId id,
      String name,
      String timezone,
      MembershipRole role,
      List<Member> members,
      List<PendingInvitation> invitations) {}

  public record CreatedInvitation(InvitationId id, Instant expiresAt, String url) {}

  public record InvitationPreview(
      HouseholdId householdId,
      String householdName,
      String inviterName,
      Instant expiresAt,
      boolean alreadyMember) {}

  public record Accepted(HouseholdId householdId, String householdName, MembershipRole role) {}
}
