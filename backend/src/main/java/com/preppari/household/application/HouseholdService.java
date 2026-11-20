package com.preppari.household.application;

import com.preppari.household.application.HouseholdViews.Accepted;
import com.preppari.household.application.HouseholdViews.CreatedInvitation;
import com.preppari.household.application.HouseholdViews.Detail;
import com.preppari.household.application.HouseholdViews.InvitationPreview;
import com.preppari.household.application.HouseholdViews.PendingInvitation;
import com.preppari.household.application.HouseholdViews.Summary;
import com.preppari.household.domain.Household;
import com.preppari.household.domain.HouseholdInvitation;
import com.preppari.household.domain.HouseholdMembership;
import com.preppari.household.domain.InvitationId;
import com.preppari.household.domain.InvitationStatus;
import com.preppari.household.domain.InvitationTokenHash;
import com.preppari.household.domain.MembershipRole;
import com.preppari.shared.application.ClockPort;
import com.preppari.shared.application.IdGeneratorPort;
import com.preppari.shared.application.TransactionPort;
import com.preppari.shared.domain.ConflictException;
import com.preppari.shared.domain.DomainException;
import com.preppari.shared.domain.ForbiddenException;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.NotFoundException;
import com.preppari.shared.domain.UnauthorizedException;
import com.preppari.shared.domain.UserId;
import java.time.Instant;
import java.util.List;

public final class HouseholdService {

  private final HouseholdRepository households;
  private final MembershipRepository memberships;
  private final InvitationRepository invitations;
  private final UserProfileLookup profiles;
  private final InvitationTokenGenerator tokens;
  private final IdGeneratorPort ids;
  private final ClockPort clock;
  private final TransactionPort transactions;
  private final String publicOrigin;

  public HouseholdService(
      HouseholdRepository households,
      MembershipRepository memberships,
      InvitationRepository invitations,
      UserProfileLookup profiles,
      InvitationTokenGenerator tokens,
      IdGeneratorPort ids,
      ClockPort clock,
      TransactionPort transactions,
      String publicOrigin) {
    this.households = households;
    this.memberships = memberships;
    this.invitations = invitations;
    this.profiles = profiles;
    this.tokens = tokens;
    this.ids = ids;
    this.clock = clock;
    this.transactions = transactions;
    this.publicOrigin = origin(publicOrigin);
  }

  public Detail create(UserId actor, String name, String timezone) {
    return transactions.inTransaction(
        () -> {
          requireProfile(actor);
          if (!households.listActiveFor(actor).isEmpty()) {
            throw new ConflictException("ALREADY_HAS_HOUSEHOLD", "Ya formás parte de un hogar.");
          }
          Instant now = clock.now();
          Household household =
              Household.create(new HouseholdId(ids.newId()), name, timezone, actor, now);
          households.insert(household);
          memberships.insert(HouseholdMembership.owner(ids.newId(), household.id(), actor, now));
          return detail(household, MembershipRole.OWNER, List.of(), now);
        });
  }

  public List<Summary> list(UserId actor) {
    return households.listActiveFor(actor);
  }

  public Detail get(UserId actor, HouseholdId householdId) {
    return transactions.inTransaction(
        () -> {
          HouseholdMembership membership = requireMember(householdId, actor);
          Household household = requireHousehold(householdId);
          return detail(household, membership.role(), invitationsOf(membership), clock.now());
        });
  }

  public CreatedInvitation invite(UserId actor, HouseholdId householdId) {
    return transactions.inTransaction(
        () -> {
          requireOwner(householdId, actor);
          Instant now = clock.now();
          if (invitations.countUsablePending(householdId, now)
              >= HouseholdInvitation.MAX_USABLE_PENDING) {
            throw new DomainException(
                "TOO_MANY_INVITATIONS",
                "Ya hay varias invitaciones esperando. Cancelá una para crear otra.");
          }
          String rawToken = tokens.newToken();
          HouseholdInvitation invitation =
              HouseholdInvitation.issue(
                  new InvitationId(ids.newId()),
                  householdId,
                  InvitationTokenHash.sha256(rawToken),
                  actor,
                  now);
          invitations.insert(invitation);
          return new CreatedInvitation(
              invitation.id(), invitation.expiresAt(), invitationUrl(rawToken));
        });
  }

  public InvitationPreview preview(UserId actor, String rawToken) {
    InvitationDetails details = load(rawToken);
    requireUsable(details.invitation());
    return transactions.inTransaction(
        () -> {
          boolean alreadyMember =
              memberships
                  .find(details.invitation().householdId(), actor)
                  .map(HouseholdMembership::isActive)
                  .orElse(false);
          return new InvitationPreview(
              details.invitation().householdId(),
              details.householdName(),
              details.inviterName(),
              details.invitation().expiresAt(),
              alreadyMember);
        });
  }

  public Accepted accept(UserId actor, String rawToken) {
    requireProfile(actor);
    InvitationDetails details = load(rawToken);
    requireUsable(details.invitation());
    return transactions.inTransaction(
        () -> {
          Instant now = clock.now();
          HouseholdInvitation invitation =
              invitations
                  .findByTokenHash(InvitationTokenHash.sha256(rawToken))
                  .orElseThrow(HouseholdService::invitationNotFound)
                  .invitation();
          requireUsable(invitation);
          HouseholdMembership existing =
              memberships.find(invitation.householdId(), actor).orElse(null);
          if (existing != null && existing.isActive()) {
            throw new ConflictException("ALREADY_MEMBER", "Ya formás parte de este hogar.");
          }
          boolean inAnotherHousehold =
              households.listActiveFor(actor).stream()
                  .anyMatch((summary) -> !summary.id().equals(invitation.householdId()));
          if (inAnotherHousehold) {
            throw new ConflictException("ALREADY_HAS_HOUSEHOLD", "Ya formás parte de un hogar.");
          }
          if (existing == null) {
            memberships.insert(
                HouseholdMembership.member(ids.newId(), invitation.householdId(), actor, now));
          } else {
            memberships.update(existing.reactivateAsMember(now));
          }
          invitations.updateFromPending(invitation.accept(now));
          return new Accepted(
              invitation.householdId(), details.householdName(), MembershipRole.MEMBER);
        });
  }

  public void revoke(UserId actor, HouseholdId householdId, InvitationId invitationId) {
    transactions.inTransaction(
        () -> {
          requireOwner(householdId, actor);
          HouseholdInvitation invitation =
              invitations
                  .findById(householdId, invitationId)
                  .orElseThrow(HouseholdService::invitationNotFound);
          invitations.updateFromPending(invitation.revoke(clock.now()));
          return null;
        });
  }

  public void removeMember(UserId actor, HouseholdId householdId, UserId memberId) {
    transactions.inTransaction(
        () -> {
          requireOwner(householdId, actor);
          if (actor.equals(memberId)) {
            throw new DomainException("CANNOT_REMOVE_SELF", "No podés quitarte del hogar.");
          }
          HouseholdMembership membership =
              memberships
                  .find(householdId, memberId)
                  .filter(HouseholdMembership::isActive)
                  .orElseThrow(
                      () ->
                          new NotFoundException(
                              "MEMBER_NOT_FOUND", "Esa persona no está en el hogar."));
          if (membership.isOwner()) {
            throw new DomainException(
                "CANNOT_REMOVE_OWNER", "No se puede quitar a quien administra el hogar.");
          }
          memberships.update(membership.remove());
          return null;
        });
  }

  private Detail detail(
      Household household, MembershipRole role, List<HouseholdInvitation> pending, Instant now) {
    List<PendingInvitation> visible =
        role == MembershipRole.OWNER
            ? pending.stream()
                .filter(invitation -> invitation.isUsableAt(now))
                .map(
                    invitation ->
                        new PendingInvitation(
                            invitation.id(), invitation.expiresAt(), invitation.createdAt()))
                .toList()
            : List.of();
    return new Detail(
        household.id(),
        household.name(),
        household.timezone(),
        role,
        memberships.listActive(household.id()),
        visible);
  }

  private List<HouseholdInvitation> invitationsOf(HouseholdMembership membership) {
    if (!membership.isOwner()) {
      return List.of();
    }
    return invitations.listUsablePending(membership.householdId(), clock.now());
  }

  private InvitationDetails load(String rawToken) {
    return transactions.inTransaction(
        () ->
            invitations
                .findByTokenHash(InvitationTokenHash.sha256(rawToken))
                .orElseThrow(HouseholdService::invitationNotFound));
  }

  private void requireUsable(HouseholdInvitation invitation) {
    Instant now = clock.now();
    if (invitation.status() == InvitationStatus.PENDING && !invitation.expiresAt().isAfter(now)) {
      transactions.inTransaction(
          () -> {
            invitations.updateFromPending(invitation.expire());
            return null;
          });
      throw new DomainException("INVITATION_EXPIRED", "Esta invitación venció.");
    }
    if (!invitation.isUsableAt(now)) {
      invitation.accept(now);
    }
  }

  private Household requireHousehold(HouseholdId id) {
    return households.findById(id).orElseThrow(HouseholdService::householdNotFound);
  }

  private HouseholdMembership requireMember(HouseholdId householdId, UserId actor) {
    return memberships
        .find(householdId, actor)
        .filter(HouseholdMembership::isActive)
        .orElseThrow(HouseholdService::householdNotFound);
  }

  private HouseholdMembership requireOwner(HouseholdId householdId, UserId actor) {
    HouseholdMembership membership = requireMember(householdId, actor);
    if (!membership.isOwner()) {
      throw new ForbiddenException("NOT_OWNER", "Solo quien administra el hogar puede hacer esto.");
    }
    return membership;
  }

  private UserProfile requireProfile(UserId actor) {
    return profiles
        .find(actor)
        .orElseThrow(
            () -> new UnauthorizedException("USER_NOT_FOUND", "No encontramos tu cuenta."));
  }

  private String invitationUrl(String rawToken) {
    return publicOrigin + "/invitacion/" + rawToken;
  }

  private static String origin(String value) {
    String origin = value == null || value.isBlank() ? "http://localhost:3000" : value.trim();
    while (origin.endsWith("/")) {
      origin = origin.substring(0, origin.length() - 1);
    }
    return origin;
  }

  private static NotFoundException householdNotFound() {
    return new NotFoundException("HOUSEHOLD_NOT_FOUND", "No encontramos ese hogar.");
  }

  private static NotFoundException invitationNotFound() {
    return new NotFoundException("INVITATION_NOT_FOUND", "No encontramos esa invitación.");
  }
}
