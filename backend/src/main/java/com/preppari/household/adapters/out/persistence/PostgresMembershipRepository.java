package com.preppari.household.adapters.out.persistence;

import com.preppari.household.application.HouseholdViews.Member;
import com.preppari.household.application.MembershipRepository;
import com.preppari.household.domain.HouseholdMembership;
import com.preppari.household.domain.MembershipRole;
import com.preppari.household.domain.MembershipStatus;
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
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Transactional
public class PostgresMembershipRepository implements MembershipRepository {

  private final JdbcTemplate jdbc;

  public PostgresMembershipRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public void insert(HouseholdMembership membership) {
    try {
      jdbc.update(
          """
          INSERT INTO household_membership
              (id, household_id, user_id, role, status, joined_at)
          VALUES (?, ?, ?, ?, ?, ?)
          """,
          membership.id(),
          membership.householdId().value(),
          membership.userId().value(),
          membership.role().name(),
          membership.status().name(),
          timestamp(membership.joinedAt()));
    } catch (DuplicateKeyException ex) {
      throw new ConflictException("ALREADY_MEMBER", "Ya formás parte de este hogar.");
    }
  }

  @Override
  public void update(HouseholdMembership membership) {
    jdbc.update(
        """
        UPDATE household_membership
        SET role = ?, status = ?, joined_at = ?
        WHERE id = ?
        """,
        membership.role().name(),
        membership.status().name(),
        timestamp(membership.joinedAt()),
        membership.id());
  }

  @Override
  public Optional<HouseholdMembership> find(HouseholdId householdId, UserId userId) {
    List<HouseholdMembership> rows =
        jdbc.query(
            """
            SELECT * FROM household_membership
            WHERE household_id = ? AND user_id = ?
            """,
            (rs, row) -> map(rs),
            householdId.value(),
            userId.value());
    return rows.stream().findFirst();
  }

  @Override
  public List<Member> listActive(HouseholdId householdId) {
    return jdbc.query(
        """
        SELECT u.id, u.display_name, u.email, m.role, m.joined_at
        FROM household_membership m
        JOIN app_user u ON u.id = m.user_id
        WHERE m.household_id = ? AND m.status = 'ACTIVE'
        ORDER BY m.joined_at ASC, u.display_name ASC
        """,
        (rs, row) ->
            new Member(
                new UserId(rs.getObject("id", UUID.class)),
                rs.getString("display_name"),
                rs.getString("email"),
                MembershipRole.valueOf(rs.getString("role")),
                instant(rs, "joined_at")),
        householdId.value());
  }

  private static HouseholdMembership map(ResultSet rs) throws SQLException {
    return new HouseholdMembership(
        rs.getObject("id", UUID.class),
        new HouseholdId(rs.getObject("household_id", UUID.class)),
        new UserId(rs.getObject("user_id", UUID.class)),
        MembershipRole.valueOf(rs.getString("role")),
        MembershipStatus.valueOf(rs.getString("status")),
        instant(rs, "joined_at"));
  }

  private static Timestamp timestamp(Instant instant) {
    return Timestamp.from(instant);
  }

  private static Instant instant(ResultSet rs, String column) throws SQLException {
    return rs.getTimestamp(column).toInstant();
  }
}
