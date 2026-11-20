package com.preppari.household.adapters.in.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import com.preppari.household.domain.InvitationTokenHash;
import jakarta.servlet.http.Cookie;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.postgresql.PostgreSQLContainer;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HouseholdIsolationTest {

  static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:16.16-alpine");

  static {
    POSTGRES.start();
  }

  @DynamicPropertySource
  static void datasource(DynamicPropertyRegistry registry) {
    registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
    registry.add("spring.datasource.username", POSTGRES::getUsername);
    registry.add("spring.datasource.password", POSTGRES::getPassword);
  }

  @Autowired private MockMvc mockMvc;
  @Autowired private JdbcTemplate jdbc;

  @Test
  void twoMembersShareAHouseholdAndAStrangerCannotReadOrChangeIt() throws Exception {
    Cookie ana = login("ana", "Ana", "ana@example.com");
    Cookie bruno = login("bruno", "Bruno", "bruno@example.com");
    Cookie cara = login("cara", "Cara", "cara@example.com");

    mockMvc.perform(get("/api/health")).andExpect(status().isOk());
    mockMvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
    String anaId =
        JsonPath.read(body(mockMvc.perform(get("/api/v1/me").cookie(ana)).andReturn()), "$.id");

    MvcResult created =
        mockMvc
            .perform(
                post("/api/v1/households")
                    .cookie(ana)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"name\":\"  Casa   de Ana \"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Casa de Ana"))
            .andExpect(jsonPath("$.role").value("OWNER"))
            .andExpect(jsonPath("$.members[0].displayName").value("Ana"))
            .andReturn();
    String householdId = JsonPath.read(created.getResponse().getContentAsString(), "$.id");

    mockMvc
        .perform(
            post("/api/v1/households")
                .cookie(cara)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Lo de Cara\"}"))
        .andExpect(status().isCreated());

    mockMvc
        .perform(get("/api/v1/households/" + householdId).cookie(bruno))
        .andExpect(status().isNotFound());
    mockMvc
        .perform(post("/api/v1/households/" + householdId + "/invitations").cookie(bruno))
        .andExpect(status().isNotFound());
    mockMvc
        .perform(delete("/api/v1/households/" + householdId + "/members/" + anaId).cookie(cara))
        .andExpect(status().isNotFound());

    MvcResult invitation =
        mockMvc
            .perform(post("/api/v1/households/" + householdId + "/invitations").cookie(ana))
            .andExpect(status().isCreated())
            .andReturn();
    String invitationBody = invitation.getResponse().getContentAsString();
    String url = JsonPath.read(invitationBody, "$.url");
    String token = url.substring(url.lastIndexOf('/') + 1);
    String invitationId = JsonPath.read(invitationBody, "$.id");
    String storedHash =
        jdbc.queryForObject(
            "SELECT token_hash FROM household_invitation WHERE id = ?",
            String.class,
            UUID.fromString(invitationId));
    assertThat(storedHash).isEqualTo(InvitationTokenHash.sha256(token));
    assertThat(storedHash).isNotEqualTo(token);
    Integer leaked =
        jdbc.queryForObject(
            "SELECT count(*) FROM household_invitation WHERE token_hash = ?", Integer.class, token);
    assertThat(leaked).isZero();

    mockMvc
        .perform(get("/api/v1/households/" + householdId).cookie(ana))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.invitations[0].id").value(invitationId))
        .andExpect(jsonPath("$.invitations[0].url").doesNotExist());

    mockMvc
        .perform(get("/api/v1/invitations/" + token).cookie(bruno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.householdName").value("Casa de Ana"))
        .andExpect(jsonPath("$.inviterName").value("Ana"))
        .andExpect(jsonPath("$.alreadyMember").value(false));
    mockMvc
        .perform(post("/api/v1/invitations/" + token + "/accept").cookie(bruno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.role").value("MEMBER"));

    mockMvc
        .perform(get("/api/v1/households/" + householdId).cookie(bruno))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.members.length()").value(2))
        .andExpect(jsonPath("$.invitations.length()").value(0));
    mockMvc
        .perform(get("/api/v1/households/" + householdId).cookie(cara))
        .andExpect(status().isNotFound());
    mockMvc
        .perform(post("/api/v1/households/" + householdId + "/invitations").cookie(bruno))
        .andExpect(status().isForbidden());
    mockMvc
        .perform(post("/api/v1/invitations/" + token + "/accept").cookie(cara))
        .andExpect(status().isConflict());

    String brunoId =
        JsonPath.read(body(mockMvc.perform(get("/api/v1/me").cookie(bruno)).andReturn()), "$.id");
    mockMvc
        .perform(delete("/api/v1/households/" + householdId + "/members/" + anaId).cookie(bruno))
        .andExpect(status().isForbidden());
    mockMvc
        .perform(delete("/api/v1/households/" + householdId + "/members/" + brunoId).cookie(ana))
        .andExpect(status().isNoContent());
    mockMvc
        .perform(get("/api/v1/households/" + householdId).cookie(bruno))
        .andExpect(status().isNotFound());

    MvcResult second =
        mockMvc
            .perform(post("/api/v1/households/" + householdId + "/invitations").cookie(ana))
            .andExpect(status().isCreated())
            .andReturn();
    String secondUrl = JsonPath.read(second.getResponse().getContentAsString(), "$.url");
    String secondToken = secondUrl.substring(secondUrl.lastIndexOf('/') + 1);
    String secondId = JsonPath.read(second.getResponse().getContentAsString(), "$.id");
    jdbc.update(
        "UPDATE household_invitation SET expires_at = now() - interval '1 minute' WHERE id = ?",
        UUID.fromString(secondId));
    mockMvc
        .perform(post("/api/v1/invitations/" + secondToken + "/accept").cookie(bruno))
        .andExpect(status().isUnprocessableContent())
        .andExpect(jsonPath("$.code").value("INVITATION_EXPIRED"));

    mockMvc
        .perform(
            post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"test|111|ANA@Example.com|Ana Google\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("ana@example.com"))
        .andExpect(jsonPath("$.displayName").value("Ana Google"));
    Integer googleUsers =
        jdbc.queryForObject(
            "SELECT count(*) FROM app_user WHERE external_subject = 'google:111'", Integer.class);
    assertThat(googleUsers).isEqualTo(1);

    assertThatThrownBy(
            () ->
                jdbc.update(
                    """
                    INSERT INTO background_job (
                        id, household_id, job_type, aggregate_type, aggregate_id,
                        status, available_at, idempotency_key
                    ) VALUES (?, ?, 'GENERATE_DISH_INGREDIENTS', 'DISH', ?, 'PENDING', now(), ?)
                    """,
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    UUID.randomUUID(),
                    "fk-" + UUID.randomUUID()))
        .isInstanceOf(DataIntegrityViolationException.class);
  }

  @Test
  void devLoginIsIdempotentAndDoesNotReturnTheSessionToken() throws Exception {
    MvcResult first = loginResult("ana", "Ana", "ana@example.com");
    Cookie cookie = cookie(first);
    assertThat(first.getResponse().getContentAsString()).doesNotContain(cookie.getValue());
    assertThat(cookie.isHttpOnly()).isTrue();

    MvcResult second = loginResult("ana", "Ana Nueva", "ana@example.com");
    String firstId = JsonPath.read(first.getResponse().getContentAsString(), "$.id");
    String secondId = JsonPath.read(second.getResponse().getContentAsString(), "$.id");
    assertThat(secondId).isEqualTo(firstId);

    MvcResult logout =
        mockMvc
            .perform(post("/api/v1/auth/logout").cookie(cookie))
            .andExpect(status().isNoContent())
            .andReturn();
    assertThat(logout.getResponse().getHeader("Set-Cookie")).contains("Max-Age=0");
    mockMvc.perform(get("/api/v1/me")).andExpect(status().isUnauthorized());
    mockMvc
        .perform(get("/api/v1/auth/config"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.devLoginEnabled").value(true))
        .andExpect(jsonPath("$.googleClientId").value("test-client-id"));
    mockMvc
        .perform(
            post("/api/v1/auth/google")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"idToken\":\"esto-no-es-un-token\"}"))
        .andExpect(status().isUnauthorized());
  }

  private Cookie login(String subject, String name, String email) throws Exception {
    return cookie(loginResult(subject, name, email));
  }

  private MvcResult loginResult(String subject, String name, String email) throws Exception {
    return mockMvc
        .perform(
            post("/api/v1/auth/dev")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"subject":"%s","displayName":"%s","email":"%s"}
                    """
                        .formatted(subject, name, email)))
        .andExpect(status().isOk())
        .andReturn();
  }

  private static Cookie cookie(MvcResult result) {
    Cookie cookie = result.getResponse().getCookie("preppari_session");
    assertThat(cookie).isNotNull();
    return cookie;
  }

  private static String body(MvcResult result) throws Exception {
    return result.getResponse().getContentAsString();
  }
}
