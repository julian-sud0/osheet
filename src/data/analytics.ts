/**
 * No-op analytics shim wired at high-leverage call sites (mode pick, FAB
 * child action, questionnaire start / item / completion, timestamp toggle
 * use, PDF generation). In dev it logs; in production it does nothing.
 * Swap the body of `track` to PostHog / Plausible / Mixpanel later
 * without re-touching every screen.
 */

export type AnalyticsEvent =
  | 'mode_picked'
  | 'mode_changed'
  | 'fab_opened'
  | 'fab_child_tapped'
  | 'log_added'
  | 'timestamp_toggle_used'
  | 'questionnaire_started'
  | 'questionnaire_item_answered'
  | 'questionnaire_completed'
  | 'questionnaire_skipped'
  | 'profile_field_set'
  | 'pdf_generated'
  | 'soft_profile_prompt_seen'
  | 'soft_profile_prompt_accepted'
  | 'soft_profile_prompt_dismissed'
  | 'activity_started'
  | 'activity_step_completed'
  | 'activity_completed'
  | 'activity_abandoned'
  | 'tip_shown'
  | 'tip_dismissed'
  | 'tip_tapped'
  | 'story_tapped'
  | 'community_waitlist_joined';

type Props = Record<string, string | number | boolean | undefined>;

export function track(event: AnalyticsEvent, props: Props = {}) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`[track] ${event}`, props);
  }
}
