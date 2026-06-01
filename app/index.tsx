import { Redirect } from 'expo-router';

/**
 * Entry route — for now always lands on onboarding.
 * Phase 2 will gate this on the `onboarded` flag from the store.
 */
export default function Index() {
  return <Redirect href="/onboarding" />;
}
