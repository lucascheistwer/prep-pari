package com.preppari.household.adapters.in.web;

import com.preppari.bootstrap.security.CurrentUser;
import com.preppari.household.application.HouseholdService;
import com.preppari.household.application.HouseholdViews.CreatedInvitation;
import com.preppari.household.application.HouseholdViews.Detail;
import com.preppari.household.application.HouseholdViews.Member;
import com.preppari.household.application.HouseholdViews.PendingInvitation;
import com.preppari.household.application.HouseholdViews.Summary;
import com.preppari.household.domain.InvitationId;
import com.preppari.identity.adapters.in.web.MeController.HouseholdSummaryResponse;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/households")
@ConditionalOnWebApplication
public class HouseholdController {

  private final HouseholdService households;

  public HouseholdController(HouseholdService households) {
    this.households = households;
  }

  @GetMapping
  public List<HouseholdSummaryResponse> list() {
    return households.list(CurrentUser.require()).stream()
        .map(HouseholdController::summary)
        .toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public HouseholdResponse create(@Valid @RequestBody CreateHouseholdRequest request) {
    return response(households.create(CurrentUser.require(), request.name(), request.timezone()));
  }

  @GetMapping("/{householdId}")
  public HouseholdResponse get(@PathVariable UUID householdId) {
    return response(households.get(CurrentUser.require(), new HouseholdId(householdId)));
  }

  @PostMapping("/{householdId}/invitations")
  @ResponseStatus(HttpStatus.CREATED)
  public CreatedInvitationResponse invite(@PathVariable UUID householdId) {
    CreatedInvitation invitation =
        households.invite(CurrentUser.require(), new HouseholdId(householdId));
    return new CreatedInvitationResponse(
        invitation.id().value(), invitation.expiresAt(), invitation.url());
  }

  @DeleteMapping("/{householdId}/invitations/{invitationId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void revoke(@PathVariable UUID householdId, @PathVariable UUID invitationId) {
    households.revoke(
        CurrentUser.require(), new HouseholdId(householdId), new InvitationId(invitationId));
  }

  @DeleteMapping("/{householdId}/members/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeMember(@PathVariable UUID householdId, @PathVariable UUID userId) {
    households.removeMember(
        CurrentUser.require(), new HouseholdId(householdId), new UserId(userId));
  }

  private static HouseholdSummaryResponse summary(Summary household) {
    return new HouseholdSummaryResponse(
        household.id().value(), household.name(), household.role().name());
  }

  private static HouseholdResponse response(Detail detail) {
    return new HouseholdResponse(
        detail.id().value(),
        detail.name(),
        detail.timezone(),
        detail.role().name(),
        detail.members().stream().map(HouseholdController::member).toList(),
        detail.invitations().stream().map(HouseholdController::invitation).toList());
  }

  private static MemberResponse member(Member member) {
    return new MemberResponse(
        member.userId().value(),
        member.displayName(),
        member.email(),
        member.role().name(),
        member.joinedAt());
  }

  private static InvitationSummaryResponse invitation(PendingInvitation invitation) {
    return new InvitationSummaryResponse(
        invitation.id().value(), invitation.expiresAt(), invitation.createdAt());
  }

  public record CreateHouseholdRequest(
      @NotBlank(message = "El nombre es obligatorio.")
          @Size(max = 80, message = "El nombre es demasiado largo.")
          String name,
      @Size(max = 64, message = "La zona horaria es demasiado larga.") String timezone) {}

  public record HouseholdResponse(
      UUID id,
      String name,
      String timezone,
      String role,
      List<MemberResponse> members,
      List<InvitationSummaryResponse> invitations) {}

  public record MemberResponse(
      UUID userId, String displayName, String email, String role, Instant joinedAt) {}

  public record InvitationSummaryResponse(UUID id, Instant expiresAt, Instant createdAt) {}

  public record CreatedInvitationResponse(UUID id, Instant expiresAt, String url) {}
}
