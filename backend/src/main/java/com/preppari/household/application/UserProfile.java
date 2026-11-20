package com.preppari.household.application;

import com.preppari.shared.domain.UserId;

public record UserProfile(UserId id, String displayName, String email) {}
