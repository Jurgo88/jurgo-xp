export const profile = {
  name: 'Juraj Paluš',
  nick: 'Jurgo',
  city: 'Bratislava',
  careerStart: 2016,
  email: 'palus.dev@gmail.com',
  linkedin: 'https://www.linkedin.com/in/juraj-palus',
  github: 'https://github.com/Jurgo88',
}

/**
 * PDFs in public/cv/ are generated from Jurgo88/job-hunting-pro (cv/build.py,
 * profiles general/frontend/fullstack/analyst/ai) WITHOUT the phone number.
 */
export function cvPdf(locale: string, roleId?: string) {
  const lang = locale === 'sk' ? 'sk' : 'en'
  return roleId ? `/cv/Juraj-Palus-CV-${roleId}-${lang}.pdf` : `/cv/Juraj-Palus-CV-${lang}.pdf`
}
