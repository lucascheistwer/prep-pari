package com.preppari.household.application;

import com.preppari.household.domain.HouseholdInvitation;

public record InvitationDetails(
    HouseholdInvitation invitation, String householdName, String inviterName) {}
