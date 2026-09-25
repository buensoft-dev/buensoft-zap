import crypto from 'crypto';

const COOKIE = 'zap_user';
const STATE = 'zap_oauth';

function secret() {
  return process.env.SESSION_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
}

function configured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function readSigned(token) {
  if (!token || !secret()) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function cookieValue(req, name) {
  const header = req.headers.cookie || '';
  const found = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!found) return '';
  return decodeURIComponent(found.slice(name.length + 1));
}

function publicOrigin(req) {
  const proto = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${proto}://${host}`;
}

function cookieFlags(req, maxAge) {
  const secure = (req.get('x-forwarded-proto') || req.protocol) === 'https';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function currentUser(req) {
  const data = readSigned(cookieValue(req, COOKIE));
  if (!data?.sub || !data?.name) return null;
  return { id: data.sub, name: data.name, email: data.email || '' };
}

export function authRoutes(app) {
  app.get('/api/auth/me', (req, res) => {
    res.json({ configured: configured(), user: currentUser(req) });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.setHeader('Set-Cookie', `${COOKIE}=; ${cookieFlags(req, 0)}`);
    res.json({ ok: true });
  });

  app.get('/api/auth/google', (req, res) => {
    if (!configured()) {
      res.status(503).json({ error: 'Falta configurar Google en el servidor' });
      return;
    }
    const state = crypto.randomBytes(16).toString('hex');
    const redirect = `${publicOrigin(req)}/api/auth/google/callback`;
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
    url.searchParams.set('redirect_uri', redirect);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');
    res.setHeader('Set-Cookie', `${STATE}=${state}; ${cookieFlags(req, 600)}`);
    res.redirect(url.toString());
  });

  app.get('/api/auth/google/callback', async (req, res) => {
    const back = `${publicOrigin(req)}/`;
    try {
      if (!configured() || req.query.state !== cookieValue(req, STATE) || !req.query.code) {
        res.redirect(`${back}?auth=error`);
        return;
      }
      const redirect = `${publicOrigin(req)}/api/auth/google/callback`;
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(req.query.code),
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: redirect,
          grant_type: 'authorization_code',
        }),
      });
      const token = await tokenResponse.json();
      if (!token.access_token) {
        res.redirect(`${back}?auth=error`);
        return;
      }
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      const profile = await profileResponse.json();
      const name = String(profile.name || profile.email || '').replace(/[^\p{L} ]/gu, ' ').trim().replace(/ {2,}/g, ' ').slice(0, 20);
      if (!profile.sub || !name) {
        res.redirect(`${back}?auth=error`);
        return;
      }
      const session = sign({
        sub: profile.sub,
        name,
        email: profile.email || '',
        exp: Date.now() + 14 * 24 * 60 * 60 * 1000,
      });
      res.setHeader('Set-Cookie', [
        `${COOKIE}=${encodeURIComponent(session)}; ${cookieFlags(req, 14 * 24 * 60 * 60)}`,
        `${STATE}=; ${cookieFlags(req, 0)}`,
      ]);
      res.redirect(back);
    } catch {
      res.redirect(`${back}?auth=error`);
    }
  });
}
