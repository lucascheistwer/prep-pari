package com.preppari.household.adapters.out.persistence;

import com.preppari.household.application.InvitationDetails;
import com.preppari.household.application.InvitationRepository;
import com.preppari.household.domain.HouseholdInvitation;
import com.preppari.household.domain.InvitationId;
import com.preppari.household.domain.InvitationStatus;
import com.preppari.shared.domain.ConflictException;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional
public class PostgresInvitationRepository implements InvitationRepository {

  private final JdbcTemplate jdbc;

  public PostgresInvitationRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public void insert(HouseholdInvitation invitation) {
    jdbc.update(
        """
        INSERT INTO household_invitation
            (id, household_id, email, token_hash, status, expires_at, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        invitation.id().value(),
        invitation.householdId().value(),
        invitation.email(),
        invitation.tokenHash(),
        invitation.status().name(),
        timestamp(invitation.expiresAt()),
        invitation.createdBy().value(),
        timestamp(invitation.createdAt()));
  }

  @Override
  public void updateFromPending(HouseholdInvitation invitation) {
    int updated =
        jdbc.update(
            """
            UPDATE household_invitation
            SET status = ?
            WHERE id = ? AND status = 'PENDING'
            """,
            invitation.status().name(),
            invitation.id().value());
    if (updated == 0) {
      throw new ConflictException("INVITATION_ALREADY_USED", "Esta invitación ya se usó.");
    }
  }

  @Override
  public Optional<InvitationDetails> findByTokenHash(String tokenHash) {
    List<InvitationDetails> rows =
        jdbc.query(
            """
            SELECT i.id, i.household_id, i.email, i.token_hash, i.status, i.expires_at,
                   i.created_by, i.created_at, h.name AS household_name, u.display_name AS inviter_name
            FROM household_invitation i
            JOIN household h ON h.id = i.household_id
            JOIN app_user u ON u.id = i.created_by
            WHERE i.token_hash = ?
            """,
            (rs, row) ->
                new InvitationDetails(
                    map(rs), rs.getString("household_name"), rs.getString("inviter_name")),
            tokenHash);
    return rows.stream().findFirst();
  }

  @Override
  public Optional<HouseholdInvitation> findById(HouseholdId householdId, InvitationId id) {
    List<HouseholdInvitation> rows =
        jdbc.query(
            """
            SELECT * FROM household_invitation
            WHERE id = ? AND household_id = ?
            """,
            (rs, row) -> map(rs),
            id.value(),
            householdId.value());
    return rows.stream().findFirst();
  }

  @Override
  public int countUsablePending(HouseholdId householdId, Instant now) {
    Integer count =
        jdbc.queryForObject(
            """
            SELECT count(*) FROM household_invitation
            WHERE household_id = ? AND status = 'PENDING' AND expires_at > ?
            """,
            Integer.class,
            householdId.value(),
            timestamp(now));
    return count == null ? 0 : count;
  }

  @Override
  public List<HouseholdInvitation> listUsablePending(HouseholdId householdId, Instant now) {
    return jdbc.query(
        """
        SELECT * FROM household_invitation
        WHERE household_id = ? AND status = 'PENDING' AND expires_at > ?
        ORDER BY created_at ASC
        """,
        (rs, row) -> map(rs),
        householdId.value(),
        timestamp(now));
  }

  private static HouseholdInvitation map(ResultSet rs) throws SQLException {
    return new HouseholdInvitation(
        new InvitationId(rs.getObject("id", UUID.class)),
        new HouseholdId(rs.getObject("household_id", UUID.class)),
        rs.getString("email"),
        rs.getString("token_hash"),
        InvitationStatus.valueOf(rs.getString("status")),
        instant(rs, "expires_at"),
        new UserId(rs.getObject("created_by", UUID.class)),
        instant(rs, "created_at"));
  }

  private static Timestamp timestamp(Instant instant) {
    return Timestamp.from(instant);
  }

  private static Instant instant(ResultSet rs, String column) throws SQLException {
    return rs.getTimestamp(column).toInstant();
  }
}
