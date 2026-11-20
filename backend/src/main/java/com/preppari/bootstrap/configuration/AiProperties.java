package com.preppari.bootstrap.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "preppari.ai")
public class AiProperties {

  /** Solo "fake" está implementado en la Fase 0. El nombre del modelo no se hardcodea. */
  private String provider = "fake";

  private String textModel = "";

  private String imageModel = "";

  private boolean imageGenerationEnabled = false;

  public String getProvider() {
    return provider;
  }

  public void setProvider(String provider) {
    this.provider = provider;
  }

  public String getTextModel() {
    return textModel;
  }

  public void setTextModel(String textModel) {
    this.textModel = textModel;
  }

  public String getImageModel() {
    return imageModel;
  }

  public void setImageModel(String imageModel) {
    this.imageModel = imageModel;
  }

  public boolean isImageGenerationEnabled() {
    return imageGenerationEnabled;
  }

  public void setImageGenerationEnabled(boolean imageGenerationEnabled) {
    this.imageGenerationEnabled = imageGenerationEnabled;
  }
}
