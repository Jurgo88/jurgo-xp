import type { L10n, Locale } from '~/data/l10n'
import { profile } from '~/data/profile'

/** Pick the current locale's text from an { en, sk } object. */
export function useL10n() {
  const { locale } = useI18n()
  const l = (v: L10n) => v[(locale.value as Locale)] ?? v.en
  return { l, locale }
}

export function useCareer() {
  const year = new Date().getFullYear()
  return { year, years: year - profile.careerStart }
}
