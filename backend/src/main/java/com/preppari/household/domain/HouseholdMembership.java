package com.preppari.household.domain;

import com.preppari.shared.domain.DomainException;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import java.time.Instant;
import java.util.UUID;

public record HouseholdMembership(
    UUID id,
    HouseholdId householdId,
    UserId userId,
    MembershipRole role,
    MembershipStatus status,
    Instant joinedAt) {

  public HouseholdMembership {
    if (id == null
        || householdId == null
        || userId == null
        || role == null
        || status == null
        || joinedAt == null) {
      throw new IllegalArgumentException("La membresía está incompleta.");
    }
  }

  public static HouseholdMembership owner(
      UUID id, HouseholdId householdId, UserId userId, Instant now) {
    return new HouseholdMembership(
        id, householdId, userId, MembershipRole.OWNER, MembershipStatus.ACTIVE, now);
  }

  public static HouseholdMembership member(
      UUID id, HouseholdId householdId, UserId userId, Instant now) {
    return new HouseholdMembership(
        id, householdId, userId, MembershipRole.MEMBER, MembershipStatus.ACTIVE, now);
  }

  public boolean isActive() {
    return status == MembershipStatus.ACTIVE;
  }

  public boolean isOwner() {
    return isActive() && role == MembershipRole.OWNER;
  }

  public HouseholdMembership remove() {
    if (!isActive()) {
      throw new DomainException("MEMBER_NOT_ACTIVE", "Esa persona ya no está en el hogar.");
    }
    return new HouseholdMembership(
        id, householdId, userId, role, MembershipStatus.REMOVED, joinedAt);
  }

  public HouseholdMembership reactivateAsMember(Instant now) {
    if (isActive()) {
      throw new DomainException("ALREADY_MEMBER", "Ya formás parte de este hogar.");
    }
    return new HouseholdMembership(
        id, householdId, userId, MembershipRole.MEMBER, MembershipStatus.ACTIVE, now);
  }
}
