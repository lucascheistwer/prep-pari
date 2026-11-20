package com.preppari.bootstrap.configuration;

import com.preppari.household.application.HouseholdRepository;
import com.preppari.household.application.HouseholdService;
import com.preppari.household.application.InvitationRepository;
import com.preppari.household.application.InvitationTokenGenerator;
import com.preppari.household.application.MembershipRepository;
import com.preppari.household.application.UserProfileLookup;
import com.preppari.identity.adapters.out.security.GoogleIdTokenVerifier;
import com.preppari.identity.adapters.out.security.NimbusGoogleTokenReader;
import com.preppari.identity.adapters.out.security.TestExternalIdentityVerifier;
import com.preppari.identity.application.ExternalIdentityVerifier;
import com.preppari.identity.application.IdentityService;
import com.preppari.identity.application.SessionTokenIssuer;
import com.preppari.identity.application.UserRepository;
import com.preppari.shared.application.ClockPort;
import com.preppari.shared.application.IdGeneratorPort;
import com.preppari.shared.application.TransactionPort;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnWebApplication
public class UseCaseConfiguration {

  @Bean
  @ConditionalOnProperty(
      prefix = "preppari.auth.google",
      name = "verifier",
      havingValue = "google",
      matchIfMissing = true)
  ExternalIdentityVerifier googleIdentityVerifier(AuthProperties properties, ClockPort clock) {
    return new GoogleIdTokenVerifier(
        new NimbusGoogleTokenReader(properties.getGoogle().getJwkSetUri()),
        properties.getGoogle().getClientId(),
        clock);
  }

  @Bean
  @ConditionalOnProperty(prefix = "preppari.auth.google", name = "verifier", havingValue = "test")
  ExternalIdentityVerifier testIdentityVerifier() {
    return new TestExternalIdentityVerifier();
  }

  @Bean
  IdentityService identityService(
      UserRepository users,
      ExternalIdentityVerifier identities,
      SessionTokenIssuer sessions,
      IdGeneratorPort ids,
      ClockPort clock,
      TransactionPort transactions,
      AuthProperties properties) {
    return new IdentityService(
        users, identities, sessions, ids, clock, transactions, properties.isDevLoginEnabled());
  }

  @Bean
  HouseholdService householdService(
      HouseholdRepository households,
      MembershipRepository memberships,
      InvitationRepository invitations,
      UserProfileLookup profiles,
      InvitationTokenGenerator tokens,
      IdGeneratorPort ids,
      ClockPort clock,
      TransactionPort transactions,
      AuthProperties properties) {
    return new HouseholdService(
        households,
        memberships,
        invitations,
        profiles,
        tokens,
        ids,
        clock,
        transactions,
        properties.getPublicOrigin());
  }
}
