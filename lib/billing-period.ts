/**
 * Message-credit billing period helpers.
 *
 * Message credits are a *monthly* allowance: every venue's usage refreshes at
 * the start of each calendar month (UTC). We deliberately do NOT store a
 * running balance or run a reset cron — usage is always counted live from the
 * start of the current period, so a new month automatically "resets" the
 * count. Past conversation rows remain in the database but stop counting once
 * the period rolls over.
 *
 * Calendar-month (rather than per-venue billing date) is used because:
 * - it is uniform for free, paid and add-on venues (add-ons are separate
 *   Stripe subscriptions with independent renewal dates, so there is no single
 *   billing date to anchor to);
 * - it matches the existing chatbot hard-limit "monthly" semantics; and
 * - it needs no extra schema, cron or webhook wiring.
 */

export interface MessageCreditPeriod {
  /** ISO timestamp for the start of the current calendar month (UTC). */
  periodStart: string;
  /** ISO timestamp for when credits next refresh (start of next month, UTC). */
  resetAt: string;
}

/**
 * Returns the current message-credit period window. Usage should be counted
 * with `created_at >= periodStart`; `resetAt` is the next refresh date to show
 * to users.
 */
export function getCurrentMessageCreditPeriod(reference: Date = new Date()): MessageCreditPeriod {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();

  const periodStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const resetAt = new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0));

  return {
    periodStart: periodStart.toISOString(),
    resetAt: resetAt.toISOString(),
  };
}
