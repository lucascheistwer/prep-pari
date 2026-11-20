package com.preppari.bootstrap.configuration;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "preppari.auth")
public class AuthProperties {

  private boolean devLoginEnabled;
  private String sessionSecret = "";
  private Duration sessionTtl = Duration.ofDays(7);
  private boolean cookieSecure;
  private String publicOrigin = "http://localhost:3000";
  private Google google = new Google();

  public boolean isDevLoginEnabled() {
    return devLoginEnabled;
  }

  public void setDevLoginEnabled(boolean devLoginEnabled) {
    this.devLoginEnabled = devLoginEnabled;
  }

  public String getSessionSecret() {
    return sessionSecret;
  }

  public void setSessionSecret(String sessionSecret) {
    this.sessionSecret = sessionSecret;
  }

  public Duration getSessionTtl() {
    return sessionTtl;
  }

  public void setSessionTtl(Duration sessionTtl) {
    this.sessionTtl = sessionTtl;
  }

  public boolean isCookieSecure() {
    return cookieSecure;
  }

  public void setCookieSecure(boolean cookieSecure) {
    this.cookieSecure = cookieSecure;
  }

  public String getPublicOrigin() {
    return publicOrigin;
  }

  public void setPublicOrigin(String publicOrigin) {
    this.publicOrigin = publicOrigin;
  }

  public Google getGoogle() {
    return google;
  }

  public void setGoogle(Google google) {
    this.google = google;
  }

  public static class Google {

    private String clientId = "";
    private String jwkSetUri = "https://www.googleapis.com/oauth2/v3/certs";
    private String verifier = "google";

    public String getClientId() {
      return clientId;
    }

    public void setClientId(String clientId) {
      this.clientId = clientId;
    }

    public String getJwkSetUri() {
      return jwkSetUri;
    }

    public void setJwkSetUri(String jwkSetUri) {
      this.jwkSetUri = jwkSetUri;
    }

    public String getVerifier() {
      return verifier;
    }

    public void setVerifier(String verifier) {
      this.verifier = verifier;
    }
  }
}
