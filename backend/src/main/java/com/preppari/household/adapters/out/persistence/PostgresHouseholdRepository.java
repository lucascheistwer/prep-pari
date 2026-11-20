package com.preppari.household.adapters.out.persistence;

import com.preppari.household.application.HouseholdRepository;
import com.preppari.household.application.HouseholdViews.Summary;
import com.preppari.household.domain.Household;
import com.preppari.household.domain.MembershipRole;
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
public class PostgresHouseholdRepository implements HouseholdRepository {

  private final JdbcTemplate jdbc;

  public PostgresHouseholdRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public void insert(Household household) {
    jdbc.update(
        """
        INSERT INTO household (id, name, timezone, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        household.id().value(),
        household.name(),
        household.timezone(),
        household.createdBy().value(),
        timestamp(household.createdAt()),
        timestamp(household.updatedAt()));
  }

  @Override
  public Optional<Household> findById(HouseholdId id) {
    List<Household> rows =
        jdbc.query(
            "SELECT * FROM household WHERE id = ?",
            (rs, row) ->
                new Household(
                    new HouseholdId(rs.getObject("id", UUID.class)),
                    rs.getString("name"),
                    rs.getString("timezone"),
                    new UserId(rs.getObject("created_by", UUID.class)),
                    instant(rs, "created_at"),
                    instant(rs, "updated_at")),
            id.value());
    return rows.stream().findFirst();
  }

  @Override
  public List<Summary> listActiveFor(UserId userId) {
    return jdbc.query(
        """
        SELECT h.id, h.name, m.role
        FROM household h
        JOIN household_membership m ON m.household_id = h.id
        WHERE m.user_id = ? AND m.status = 'ACTIVE'
        ORDER BY h.created_at ASC, h.name ASC
        """,
        (rs, row) ->
            new Summary(
                new HouseholdId(rs.getObject("id", UUID.class)),
                rs.getString("name"),
                MembershipRole.valueOf(rs.getString("role"))),
        userId.value());
  }

  private static Timestamp timestamp(Instant instant) {
    return Timestamp.from(instant);
  }

  private static Instant instant(ResultSet rs, String column) throws SQLException {
    return rs.getTimestamp(column).toInstant();
  }
}
