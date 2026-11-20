package com.preppari.household.application;

import com.preppari.household.domain.HouseholdInvitation;
import com.preppari.household.domain.InvitationId;
import com.preppari.shared.domain.HouseholdId;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface InvitationRepository {

  void insert(HouseholdInvitation invitation);

  void updateFromPending(HouseholdInvitation invitation);

  Optional<InvitationDetails> findByTokenHash(String tokenHash);

  Optional<HouseholdInvitation> findById(HouseholdId householdId, InvitationId id);

  int countUsablePending(HouseholdId householdId, Instant now);

  List<HouseholdInvitation> listUsablePending(HouseholdId householdId, Instant now);
}
