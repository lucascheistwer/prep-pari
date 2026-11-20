package com.preppari.identity.application;

public interface ExternalIdentityVerifier {

  VerifiedIdentity verify(String idToken);
}
