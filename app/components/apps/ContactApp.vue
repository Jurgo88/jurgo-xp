<script setup lang="ts">
import { profile, cvPdf } from '~/data/profile'

/**
 * Outlook Express-style "New Message" window.
 * Sends through Netlify Forms: the form "contact" is registered by public/__forms.html
 * (keep the field names in sync) and we post to that file with fetch.
 */
const { t, locale } = useI18n()
const { l } = useL10n()
const { $track } = useNuxtApp()
const status = useState<string>('status-contact', () => '')

const form = reactive({ name: '', email: '', subject: '', message: '' })
const honeypot = ref('')
const state = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const sentTo = ref({ name: '', email: '' })

const mailto = computed(() => {
  const q = new URLSearchParams()
  if (form.subject) q.set('subject', form.subject)
  if (form.message) q.set('body', form.message)
  const qs = q.toString().replace(/\+/g, '%20')
  return `mailto:${profile.email}${qs ? `?${qs}` : ''}`
})

async function send() {
  if (state.value === 'sending') return
  state.value = 'sending'
  status.value = l({ en: 'Sending message…', sk: 'Odosielam správu…' })
  try {
    const body = new URLSearchParams({
      'form-name': 'contact',
      'bot-field': honeypot.value,
      'name': form.name.trim(),
      'email': form.email.trim(),
      'subject': form.subject.trim(),
      'message': form.message.trim(),
    })
    const res = await fetch('/__forms.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) throw new Error(String(res.status))
    // no personal data in analytics, just that a message was sent
    $track?.('contact_submit', { has_subject: !!form.subject.trim(), lang: locale.value }, 'contact_form_sent')
    sentTo.value = { name: form.name.trim(), email: form.email.trim() }
    Object.assign(form, { name: '', email: '', subject: '', message: '' })
    state.value = 'sent'
    status.value = l({ en: 'Message sent', sk: 'Správa bola odoslaná' })
  }
  catch {
    $track?.('contact_submit_error', {}, 'contact_form_error')
    state.value = 'error'
    status.value = l({ en: 'Message could not be sent', sk: 'Správu sa nepodarilo odoslať' })
  }
}

function again() {
  state.value = 'idle'
  status.value = ''
  nextTick(() => document.getElementById('oe-name')?.focus())
}

onBeforeUnmount(() => { status.value = '' })
</script>

<template>
  <div class="oe">
    <!-- success: XP-style confirmation instead of the form -->
    <div v-if="state === 'sent'" class="oe-sent" role="status">
      <img src="/icons/mail.svg" alt="" width="48" height="48">
      <div>
        <h2>{{ l({ en: 'Your message has been sent', sk: 'Správa bola odoslaná' }) }}</h2>
        <p>
          {{ l({ en: 'Thank you', sk: 'Ďakujem' }) }}<template v-if="sentTo.name">, {{ sentTo.name }}</template>!
          {{ l({ en: 'I usually reply within a day to', sk: 'Zvyčajne odpíšem do jedného dňa na' }) }}
          <b>{{ sentTo.email }}</b>.
        </p>
        <p class="oe-sent-btns">
          <button type="button" @click="again">{{ l({ en: 'Write another message', sk: 'Napísať ďalšiu správu' }) }}</button>
          <a :href="cvPdf(locale)" target="_blank" rel="noopener"><button type="button" tabindex="-1">{{ l({ en: 'Download my CV', sk: 'Stiahnuť moje CV' }) }}</button></a>
        </p>
      </div>
    </div>

    <form v-else class="oe-form" name="contact" @submit.prevent="send">
      <!-- toolbar -->
      <div class="oe-tools">
        <button type="submit" class="oe-tool oe-send" :disabled="state === 'sending'">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <defs>
              <linearGradient id="oe-env" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf2" /><stop offset="1" stop-color="#e2d6ad" /></linearGradient>
              <linearGradient id="oe-arr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7fe07f" /><stop offset="1" stop-color="#1e8f1e" /></linearGradient>
            </defs>
            <rect x="2" y="9" width="21" height="15" rx="1.5" fill="url(#oe-env)" stroke="#8a7a4a" />
            <path d="M2.5 10 12.5 18 22.5 10" fill="none" stroke="#8a7a4a" />
            <path d="M17 13h7V8.5l7 7.5-7 7.5V19h-7z" fill="url(#oe-arr)" stroke="#156b15" stroke-linejoin="round" />
          </svg>
          <span>{{ state === 'sending' ? l({ en: 'Sending…', sk: 'Odosielam…' }) : l({ en: 'Send', sk: 'Odoslať' }) }}</span>
        </button>
        <span class="oe-tsep" />
        <a class="oe-tool" :href="cvPdf(locale)" target="_blank" rel="noopener">
          <img src="/icons/pdf.svg" alt="" width="28" height="28">
          <span>{{ l({ en: 'My CV', sk: 'Moje CV' }) }}</span>
        </a>
        <a class="oe-tool" :href="profile.linkedin" target="_blank" rel="noopener">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <rect x="3" y="3" width="26" height="26" rx="4" fill="#0a66c2" />
            <circle cx="10" cy="10" r="2.4" fill="#fff" />
            <path d="M8 14h4v11H8zM14.5 14h3.8v1.7c.6-1.1 2-2 3.9-2 3.4 0 4.3 2.1 4.3 5.1V25h-4v-5.5c0-1.4-.3-2.6-1.8-2.6s-2.2 1.1-2.2 2.6V25h-4z" fill="#fff" />
          </svg>
          <span>LinkedIn</span>
        </a>
        <a class="oe-tool" :href="profile.github" target="_blank" rel="noopener">
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
            <circle cx="16" cy="16" r="13" fill="#24292f" />
            <path d="M11.5 12.5 7.8 16l3.7 3.5M20.5 12.5l3.7 3.5-3.7 3.5M17.6 10.5l-3.2 11" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span>GitHub</span>
        </a>
        <a class="oe-tool" :href="mailto">
          <img src="/icons/mail.svg" alt="" width="28" height="28">
          <span>{{ l({ en: 'E-mail app', sk: 'Poštový klient' }) }}</span>
        </a>
      </div>

      <!-- header fields -->
      <div class="oe-head">
        <span class="oe-lbl"><span class="oe-book" aria-hidden="true" />{{ t('contact_to') }}</span>
        <span class="oe-field oe-to">
          <span class="oe-rcpt">{{ profile.name }} &lt;<a :href="`mailto:${profile.email}`">{{ profile.email }}</a>&gt;</span>
        </span>

        <label class="oe-lbl" for="oe-name"><span class="oe-book" aria-hidden="true" />{{ l({ en: 'From:', sk: 'Od:' }) }}</label>
        <input id="oe-name" v-model="form.name" class="oe-field" name="name" type="text" required maxlength="120" autocomplete="name" :placeholder="l({ en: 'Your name', sk: 'Vaše meno' })">

        <label class="oe-lbl" for="oe-email">{{ l({ en: 'Reply to:', sk: 'Odpovedať na:' }) }}</label>
        <input id="oe-email" v-model="form.email" class="oe-field" name="email" type="email" required maxlength="200" autocomplete="email" :placeholder="l({ en: 'you@example.com', sk: 'vas@email.sk' })">

        <label class="oe-lbl" for="oe-subject">{{ l({ en: 'Subject:', sk: 'Predmet:' }) }}</label>
        <input id="oe-subject" v-model="form.subject" class="oe-field" name="subject" type="text" maxlength="200" :placeholder="l({ en: 'e.g. Frontend developer position', sk: 'napr. Pozícia frontend developer' })">

        <!-- honeypot for spam bots, hidden from people -->
        <p class="oe-hp" aria-hidden="true">
          <label>Don’t fill this out: <input v-model="honeypot" name="bot-field" tabindex="-1" autocomplete="off"></label>
        </p>
      </div>

      <!-- decorative format bar (desktop only) -->
      <div class="oe-fmt" aria-hidden="true">
        <span class="wp-field oe-font">Arial</span>
        <span class="wp-field wp-size">10</span>
        <span class="wp-sep" />
        <b class="wp-btn">B</b><i class="wp-btn">I</i><u class="wp-btn">U</u>
        <span class="wp-btn oe-color">A</span>
        <span class="wp-sep" />
        <span class="wp-btn wp-align on" /><span class="wp-btn wp-align c" /><span class="wp-btn wp-align r" />
      </div>

      <label class="sr-only" for="oe-message">{{ l({ en: 'Message', sk: 'Správa' }) }}</label>
      <textarea
        id="oe-message"
        v-model="form.message"
        class="oe-body"
        name="message"
        required
        minlength="5"
        maxlength="5000"
        :placeholder="l({ en: 'Hi Juraj,\n\n…', sk: 'Ahoj Juraj,\n\n…' })"
      />

      <div v-if="state === 'error'" class="oe-err" role="alert">
        <b>{{ l({ en: 'The message could not be sent.', sk: 'Správu sa nepodarilo odoslať.' }) }}</b>
        {{ l({ en: 'Try again, or', sk: 'Skúste to znova, alebo' }) }}
        <a :href="mailto">{{ l({ en: 'open it in your e-mail app', sk: 'ju otvorte vo svojom poštovom klientovi' }) }}</a>.
      </div>

      <p class="oe-info">
        {{ t('contact_intro') }}
        <span class="oe-phone"><XpPhone /></span>
      </p>
    </form>
  </div>
</template>
