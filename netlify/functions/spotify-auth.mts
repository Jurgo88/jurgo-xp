// One-time helper: /api/spotify-auth -> log in to Spotify -> shows the refresh token once,
// so Jurgo can paste it into Netlify env (SPOTIFY_REFRESH_TOKEN). It never stores it anywhere.
// Turns itself off as soon as SPOTIFY_REFRESH_TOKEN is set. To redo it, delete that env var.

const SCOPES = 'user-read-currently-playing user-read-recently-played user-top-read'

const page = (title: string, body: string, status = 200, headers: Record<string, string> = {}) =>
  new Response(
    `<!doctype html><html lang="sk"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${title}</title>
<style>body{font:15px/1.5 Tahoma,Verdana,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#222}
textarea{width:100%;height:110px;font:13px monospace;word-break:break-all}button{font:inherit;padding:6px 14px}code{background:#eee;padding:1px 4px}</style>
<h1>${title}</h1>${body}</html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers } },
  )

const esc = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

export default async (req: Request) => {
  if (Netlify.env.get('SPOTIFY_REFRESH_TOKEN')) {
    return page('Spotify je už pripojené', '<p>Refresh token je nastavený, tento pomocník je vypnutý. Ak ho chceš získať znova, zmaž v Netlify premennú <code>SPOTIFY_REFRESH_TOKEN</code> a spusti nový deploy.</p>')
  }
  const id = Netlify.env.get('SPOTIFY_CLIENT_ID')
  const secret = Netlify.env.get('SPOTIFY_CLIENT_SECRET')
  if (!id || !secret) {
    return page('Chýba nastavenie', '<p>Najprv nastav v Netlify <code>SPOTIFY_CLIENT_ID</code> a <code>SPOTIFY_CLIENT_SECRET</code> a spusti nový deploy.</p>', 500)
  }

  const url = new URL(req.url)
  const redirectUri = `${url.origin}/api/spotify-auth`
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) return page('Spotify prihlásenie zlyhalo', `<p>${esc(error)}</p>`, 400)

  if (!code) {
    const state = crypto.randomUUID()
    const auth = new URL('https://accounts.spotify.com/authorize')
    auth.search = new URLSearchParams({ response_type: 'code', client_id: id, scope: SCOPES, redirect_uri: redirectUri, state }).toString()
    return new Response(null, {
      status: 302,
      headers: {
        Location: auth.toString(),
        'Set-Cookie': `sp_state=${state}; Path=/api/spotify-auth; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
        'Cache-Control': 'no-store',
      },
    })
  }

  const cookieState = /(?:^|;\s*)sp_state=([^;]+)/.exec(req.headers.get('cookie') ?? '')?.[1]
  if (!cookieState || cookieState !== url.searchParams.get('state')) {
    return page('Neplatný pokus', '<p>Stav prihlásenia nesedí. Otvor <a href="/api/spotify-auth">/api/spotify-auth</a> znova.</p>', 400)
  }

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  })
  if (!res.ok) {
    return page('Výmena kódu zlyhala', `<p>Spotify odpovedal ${res.status}. Skontroluj, či je v Spotify appke presne táto Redirect URI: <code>${esc(redirectUri)}</code></p>`, 502)
  }
  const { refresh_token } = await res.json() as { refresh_token: string }

  return page('Hotovo, skopíruj si token', `
<p>Toto je tvoj <b>refresh token</b>. Nikomu ho neposielaj, ani do chatu.</p>
<textarea id="t" readonly>${esc(refresh_token)}</textarea>
<p><button onclick="navigator.clipboard.writeText(document.getElementById('t').value);this.textContent='Skopírované ✓'">Kopírovať</button></p>
<ol><li>Netlify → stránka <b>jurgo-xp</b> → <b>Site configuration → Environment variables → Add a variable</b>.</li>
<li>Key: <code>SPOTIFY_REFRESH_TOKEN</code>, Value: token vyššie, označ ho ako <b>secret</b>. Ulož.</li>
<li><b>Deploys → Trigger deploy → Deploy site</b>. Potom Winamp na webe ukáže, čo počúvaš.</li></ol>
<p>Túto stránku potom zavri. Po nastavení tokenu sa tento pomocník sám vypne.</p>`, 200, { 'Set-Cookie': 'sp_state=; Path=/api/spotify-auth; Max-Age=0; HttpOnly; Secure; SameSite=Lax' })
}

export const config = { path: '/api/spotify-auth' }
