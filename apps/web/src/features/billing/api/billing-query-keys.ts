export const billingKeys = {
  all: ['billing'] as const,
  myPlan: () => [...billingKeys.all, 'myPlan'] as const,
  mySubscription: () => [...billingKeys.all, 'mySubscription'] as const,
  myPlanPeriods: (limit?: number) =>
    [...billingKeys.all, 'myPlanPeriods', limit] as const,
  myEventSponsorships: (limit?: number) =>
    [...billingKeys.all, 'myEventSponsorships', limit] as const,
  eventSponsorship: (eventId: string) =>
    [...billingKeys.all, 'eventSponsorship', eventId] as const,
};
