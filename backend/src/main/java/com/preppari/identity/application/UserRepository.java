package com.preppari.identity.application;

import com.preppari.identity.domain.ExternalSubject;
import com.preppari.identity.domain.User;
import com.preppari.shared.domain.UserId;
import java.util.Optional;

public interface UserRepository {

  Optional<User> findByExternalSubject(ExternalSubject subject);

  Optional<User> findById(UserId id);

  void insert(User user);

  void updateProfile(User user);
}
