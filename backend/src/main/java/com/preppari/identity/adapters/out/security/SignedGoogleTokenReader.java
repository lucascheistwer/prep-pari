package com.preppari.identity.adapters.out.security;

import com.preppari.identity.application.GoogleTokenClaims;

public interface SignedGoogleTokenReader {

  GoogleTokenClaims read(String idToken);
}
