import { createRemoteJWKSet, jwtVerify } from 'jose';

const cloudflareTeamDomain = String(process.env.CLOUDFLARE_ACCESS_TEAM_DOMAIN || '').trim().replace(/\/$/, '');
const cloudflareAudience = String(process.env.CLOUDFLARE_ACCESS_AUD || '').trim();
const accessConfigured = Boolean(cloudflareTeamDomain && cloudflareAudience);
const JWKS = accessConfigured ? createRemoteJWKSet(new URL(`${cloudflareTeamDomain}/cdn-cgi/access/certs`)) : null;

function parseCookies(header = '') {
  return Object.fromEntries(String(header).split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    const key = separator >= 0 ? part.slice(0, separator) : part;
    const value = separator >= 0 ? part.slice(separator + 1) : '';
    return [decodeURIComponent(key), decodeURIComponent(value)];
  }));
}

function getAccessToken(request) {
  return request.headers['cf-access-jwt-assertion'] || parseCookies(request.headers.cookie || '').CF_Authorization || '';
}

export async function requireCloudflareAdmin(request, response, next) {
  try {
    if (!JWKS || !accessConfigured) return response.status(503).json({ error: 'Cloudflare Access authentication is not configured.' });
    const token = String(getAccessToken(request));
    if (!token) return response.status(401).json({ error: 'Cloudflare Access authentication required.' });
    const { payload } = await jwtVerify(token, JWKS, { issuer: cloudflareTeamDomain, audience: cloudflareAudience });
    const email = String(payload.email || '').trim().toLowerCase();
    if (!email) return response.status(401).json({ error: 'Invalid Cloudflare Access session.' });
    request.user = { id: String(payload.sub || email), email, full_name: String(payload.name || email), role: 'admin', provider: 'cloudflare' };
    next();
  } catch (error) {
    console.error('[Admin Auth] Cloudflare token validation failed:', error.message);
    response.status(401).json({ error: 'Invalid Cloudflare Access session.' });
  }
}
