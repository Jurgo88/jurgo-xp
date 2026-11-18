export const profile = {
  name: 'Juraj Paluš',
  nick: 'Jurgo',
  city: 'Bratislava',
  careerStart: 2016,
  email: 'palus.dev@gmail.com',
  linkedin: 'https://www.linkedin.com/in/juraj-palus',
  github: 'https://github.com/Jurgo88',
  /**
   * Phone number, deliberately NOT in plain text (scrapers): base64 of the
   * reversed number. Decoded only in the browser after a click – see XpPhone.vue.
   */
  phoneEnc: 'ODg0IDI4OCAxMTkgMTI0Kw==',
}

export function decodePhone(enc = profile.phoneEnc) {
  return atob(enc).split('').reverse().join('')
}

/**
 * PDFs in public/cv/ are generated from Jurgo88/job-hunting-pro (cv/build.py,
 * profiles general/frontend/fullstack/analyst/ai) WITHOUT the phone number.
 */
export function cvPdf(locale: string, roleId?: string) {
  const lang = locale === 'sk' ? 'sk' : 'en'
  return roleId ? `/cv/Juraj-Palus-CV-${roleId}-${lang}.pdf` : `/cv/Juraj-Palus-CV-${lang}.pdf`
}
