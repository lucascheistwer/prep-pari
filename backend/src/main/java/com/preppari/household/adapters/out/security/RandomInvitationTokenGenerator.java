package com.preppari.household.adapters.out.security;

import com.preppari.household.application.InvitationTokenGenerator;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.stereotype.Component;

@Component
public class RandomInvitationTokenGenerator implements InvitationTokenGenerator {

  private final SecureRandom random = new SecureRandom();

  @Override
  public String newToken() {
    byte[] bytes = new byte[32];
    random.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
