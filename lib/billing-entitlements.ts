// Central billing entitlement helpers.
//
// Agency Portal is a plan tier (free -> pro -> agency), not an add-on. White-label
// is included with the agency plan. Always resolve entitlement through the
// effective plan code so platform-admin overrides are respected.

export interface PlanEntitlementRecord {
  plan_code?: string | null;
  billing_override_enabled?: boolean | null;
  override_plan_code?: string | null;
  addon_white_label?: boolean | null;
}

/** Columns required to resolve entitlements; use when selecting from venue_billing_records. */
export const ENTITLEMENT_COLUMNS =
  'plan_code, billing_override_enabled, override_plan_code, addon_white_label';

export function effectivePlanCode(record?: PlanEntitlementRecord | null): string {
  if (!record) return 'free';
  if (record.billing_override_enabled && record.override_plan_code) {
    return record.override_plan_code;
  }
  return record.plan_code || 'free';
}

/** Agency Portal is entitled when the effective plan is the agency tier. */
export function venueHasAgencyPortal(record?: PlanEntitlementRecord | null): boolean {
  return effectivePlanCode(record) === 'agency';
}

/** White-label is entitled via the dedicated add-on or built into the agency plan. */
export function venueHasWhiteLabel(record?: PlanEntitlementRecord | null): boolean {
  return Boolean(record?.addon_white_label) || effectivePlanCode(record) === 'agency';
}
