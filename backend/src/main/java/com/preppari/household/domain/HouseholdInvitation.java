package com.preppari.household.domain;

import com.preppari.shared.domain.ConflictException;
import com.preppari.shared.domain.DomainException;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import java.time.Duration;
import java.time.Instant;

public record HouseholdInvitation(
    InvitationId id,
    HouseholdId householdId,
    String email,
    String tokenHash,
    InvitationStatus status,
    Instant expiresAt,
    UserId createdBy,
    Instant createdAt) {

  public static final Duration TTL = Duration.ofDays(7);
  public static final int MAX_USABLE_PENDING = 10;

  public HouseholdInvitation {
    if (id == null
        || householdId == null
        || tokenHash == null
        || status == null
        || expiresAt == null
        || createdBy == null
        || createdAt == null) {
      throw new IllegalArgumentException("La invitación está incompleta.");
    }
    if (!tokenHash.matches("[0-9a-f]{64}")) {
      throw new IllegalArgumentException("El hash del token es inválido.");
    }
  }

  public static HouseholdInvitation issue(
      InvitationId id, HouseholdId householdId, String tokenHash, UserId createdBy, Instant now) {
    return new HouseholdInvitation(
        id, householdId, null, tokenHash, InvitationStatus.PENDING, now.plus(TTL), createdBy, now);
  }

  public boolean isUsableAt(Instant now) {
    return status == InvitationStatus.PENDING && expiresAt.isAfter(now);
  }

  public HouseholdInvitation accept(Instant now) {
    ensurePending(now);
    return copy(InvitationStatus.ACCEPTED);
  }

  public HouseholdInvitation revoke(Instant now) {
    if (status != InvitationStatus.PENDING) {
      throw new DomainException("INVITATION_NOT_PENDING", "La invitación ya no está pendiente.");
    }
    if (!expiresAt.isAfter(now)) {
      return copy(InvitationStatus.EXPIRED);
    }
    return copy(InvitationStatus.REVOKED);
  }

  public HouseholdInvitation expire() {
    if (status != InvitationStatus.PENDING) {
      throw new DomainException("INVITATION_NOT_PENDING", "La invitación ya no está pendiente.");
    }
    return copy(InvitationStatus.EXPIRED);
  }

  private void ensurePending(Instant now) {
    switch (status) {
      case ACCEPTED ->
          throw new ConflictException("INVITATION_ALREADY_USED", "Esta invitación ya se usó.");
      case REVOKED ->
          throw new DomainException("INVITATION_REVOKED", "Esta invitación fue revocada.");
      case EXPIRED -> throw new DomainException("INVITATION_EXPIRED", "Esta invitación venció.");
      case PENDING -> {
        if (!expiresAt.isAfter(now)) {
          throw new DomainException("INVITATION_EXPIRED", "Esta invitación venció.");
        }
      }
    }
  }

  private HouseholdInvitation copy(InvitationStatus next) {
    return new HouseholdInvitation(
        id, householdId, email, tokenHash, next, expiresAt, createdBy, createdAt);
  }
}
