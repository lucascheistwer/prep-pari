package com.preppari.identity.application;

import com.preppari.identity.domain.ExternalSubject;

public record VerifiedIdentity(ExternalSubject subject, String email, String displayName) {}
