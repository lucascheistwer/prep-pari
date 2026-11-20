package com.preppari.identity.adapters.in.web;

import com.preppari.bootstrap.security.CurrentUser;
import com.preppari.household.application.HouseholdService;
import com.preppari.household.application.HouseholdViews.Summary;
import com.preppari.identity.application.UserRepository;
import com.preppari.identity.domain.User;
import com.preppari.shared.domain.UnauthorizedException;
import java.util.List;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@ConditionalOnWebApplication
public class MeController {

  private final UserRepository users;
  private final HouseholdService households;

  public MeController(UserRepository users, HouseholdService households) {
    this.users = users;
    this.households = households;
  }

  @GetMapping("/me")
  public MeResponse me() {
    User user =
        users
            .findById(CurrentUser.require())
            .orElseThrow(
                () -> new UnauthorizedException("USER_NOT_FOUND", "No encontramos tu cuenta."));
    List<HouseholdSummaryResponse> homes =
        households.list(user.id()).stream().map(MeController::summary).toList();
    return new MeResponse(user.id().value(), user.email(), user.displayName(), homes);
  }

  private static HouseholdSummaryResponse summary(Summary household) {
    return new HouseholdSummaryResponse(
        household.id().value(), household.name(), household.role().name());
  }

  public record MeResponse(
      UUID id, String email, String displayName, List<HouseholdSummaryResponse> households) {}

  public record HouseholdSummaryResponse(UUID id, String name, String role) {}
}
