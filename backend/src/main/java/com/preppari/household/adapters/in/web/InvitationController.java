package com.preppari.household.adapters.in.web;

import com.preppari.bootstrap.security.CurrentUser;
import com.preppari.household.application.HouseholdService;
import com.preppari.household.application.HouseholdViews.Accepted;
import com.preppari.household.application.HouseholdViews.InvitationPreview;
import java.time.Instant;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/invitations")
@ConditionalOnWebApplication
public class InvitationController {

  private final HouseholdService households;

  public InvitationController(HouseholdService households) {
    this.households = households;
  }

  @GetMapping("/{token}")
  public InvitationPreviewResponse preview(@PathVariable String token) {
    InvitationPreview preview = households.preview(CurrentUser.require(), token);
    return new InvitationPreviewResponse(
        preview.householdId().value(),
        preview.householdName(),
        preview.inviterName(),
        preview.expiresAt(),
        preview.alreadyMember());
  }

  @PostMapping("/{token}/accept")
  public AcceptedInvitationResponse accept(@PathVariable String token) {
    Accepted accepted = households.accept(CurrentUser.require(), token);
    return new AcceptedInvitationResponse(
        accepted.householdId().value(), accepted.householdName(), accepted.role().name());
  }

  public record InvitationPreviewResponse(
      UUID householdId,
      String householdName,
      String inviterName,
      Instant expiresAt,
      boolean alreadyMember) {}

  public record AcceptedInvitationResponse(UUID householdId, String householdName, String role) {}
}
