package com.preppari.identity.adapters.out.persistence;

import com.preppari.identity.application.UserRepository;
import com.preppari.identity.domain.ExternalSubject;
import com.preppari.identity.domain.User;
import com.preppari.shared.domain.ConflictException;
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
public class PostgresUserRepository implements UserRepository {

  private final JdbcTemplate jdbc;

  public PostgresUserRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @Override
  public Optional<User> findByExternalSubject(ExternalSubject subject) {
    return one("SELECT * FROM app_user WHERE external_subject = ?", subject.value());
  }

  @Override
  public Optional<User> findById(UserId id) {
    return one("SELECT * FROM app_user WHERE id = ?", id.value());
  }

  @Override
  public void insert(User user) {
    try {
      jdbc.update(
          """
          INSERT INTO app_user (id, external_subject, email, display_name, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
          """,
          user.id().value(),
          user.externalSubject().value(),
          user.email(),
          user.displayName(),
          timestamp(user.createdAt()),
          timestamp(user.updatedAt()));
    } catch (DuplicateKeyException ex) {
      throw new ConflictException("USER_ALREADY_REGISTERED", "Esa cuenta ya existe.");
    }
  }

  @Override
  public void updateProfile(User user) {
    jdbc.update(
        """
        UPDATE app_user
        SET email = ?, display_name = ?, updated_at = ?
        WHERE id = ?
        """,
        user.email(),
        user.displayName(),
        timestamp(user.updatedAt()),
        user.id().value());
  }

  private Optional<User> one(String sql, Object parameter) {
    List<User> rows = jdbc.query(sql, (rs, row) -> map(rs), parameter);
    return rows.stream().findFirst();
  }

  private static User map(ResultSet rs) throws SQLException {
    return new User(
        new UserId(rs.getObject("id", UUID.class)),
        new ExternalSubject(rs.getString("external_subject")),
        rs.getString("email"),
        rs.getString("display_name"),
        instant(rs, "created_at"),
        instant(rs, "updated_at"));
  }

  private static Timestamp timestamp(Instant instant) {
    return Timestamp.from(instant);
  }

  private static Instant instant(ResultSet rs, String column) throws SQLException {
    return rs.getTimestamp(column).toInstant();
  }
}
