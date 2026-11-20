package com.preppari.identity.application;

import com.preppari.identity.domain.User;

public record Session(String accessToken, User user) {}
