package com.preppari.household.application;

import com.preppari.household.application.HouseholdViews.Summary;
import com.preppari.household.domain.Household;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import java.util.List;
import java.util.Optional;

public interface HouseholdRepository {

  void insert(Household household);

  Optional<Household> findById(HouseholdId id);

  List<Summary> listActiveFor(UserId userId);
}
