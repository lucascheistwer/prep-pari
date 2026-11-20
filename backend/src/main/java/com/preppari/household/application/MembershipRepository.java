package com.preppari.household.application;

import com.preppari.household.application.HouseholdViews.Member;
import com.preppari.household.domain.HouseholdMembership;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import java.util.List;
import java.util.Optional;

public interface MembershipRepository {

  void insert(HouseholdMembership membership);

  void update(HouseholdMembership membership);

  Optional<HouseholdMembership> find(HouseholdId householdId, UserId userId);

  List<Member> listActive(HouseholdId householdId);
}
