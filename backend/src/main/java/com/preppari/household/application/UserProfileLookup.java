package com.preppari.household.application;

import com.preppari.shared.domain.UserId;
import java.util.Optional;

public interface UserProfileLookup {

  Optional<UserProfile> find(UserId id);
}
