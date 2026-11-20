package com.preppari.household.adapters.out.identity;

import com.preppari.household.application.UserProfile;
import com.preppari.household.application.UserProfileLookup;
import com.preppari.identity.application.UserRepository;
import com.preppari.shared.domain.UserId;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class RepositoryUserProfileLookup implements UserProfileLookup {

  private final UserRepository users;

  public RepositoryUserProfileLookup(UserRepository users) {
    this.users = users;
  }

  @Override
  public Optional<UserProfile> find(UserId id) {
    return users
        .findById(id)
        .map(user -> new UserProfile(user.id(), user.displayName(), user.email()));
  }
}
