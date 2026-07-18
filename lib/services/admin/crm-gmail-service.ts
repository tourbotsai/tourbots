import crypto from 'crypto';
import { supabaseServiceRole as supabase } from '../../supabase-service-role';

// --------------------
// Config
// --------------------

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

// Send-only scope — classified "sensitive" (not "restricted") by Google, so it
// needs no CASA security assessment, only standard OAuth verification (which
// itself is skippable while the app stays in Testing mode with under 100 users).
const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'openid', 'email'].join(' ');

function getClientId(): string {
  const value = process.env.CRM_GMAIL_CLIENT_ID;
  if (!value) throw new Error('CRM_GMAIL_CLIENT_ID is not configured');
  return value;
}

function getClientSecret(): string {
  const value = process.env.CRM_GMAIL_CLIENT_SECRET;
  if (!value) throw new Error('CRM_GMAIL_CLIENT_SECRET is not configured');
  return value;
}

function getRedirectUri(): string {
  const value = process.env.CRM_GMAIL_REDIRECT_URI;
  if (!value) throw new Error('CRM_GMAIL_REDIRECT_URI is not configured');
  return value;
}

function getEncryptionKey(): Buffer {
  const value = process.env.CRM_GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!value) throw new Error('CRM_GMAIL_TOKEN_ENCRYPTION_KEY is not configured');
  const key = Buffer.from(value, 'hex');
  if (key.length !== 32) {
    throw new Error('CRM_GMAIL_TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes) for AES-256-GCM');
  }
  return key;
}

// --------------------
// Token encryption (AES-256-GCM, at rest only — never logged or returned to the client)
// --------------------

export function encryptSecret(plainText: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

export function decryptSecret(encoded: string): string {
  const key = getEncryptionKey();
  const raw = Buffer.from(encoded, 'base64');
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const ciphertext = raw.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// --------------------
// OAuth state signing (HMAC) — lets the callback verify the redirect came from
// our own "start connect" step without needing a bearer token, since Google's
// redirect back to us is a plain top-level browser navigation with no headers.
// --------------------

export function signOAuthState(payload: { exp: number }): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', getClientSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyOAuthState(state: string): boolean {
  const [body, signature] = (state || '').split('.');
  if (!body || !signature) return false;
  const expectedSignature = crypto.createHmac('sha256', getClientSecret()).update(body).digest('base64url');
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// --------------------
// OAuth flow
// --------------------

export function getGoogleOAuthConsentUrl(state: string, loginHint?: string | null): string {
  const params = new URLSearchParams({
    client_id: getClientId(),
    redirect_uri: getRedirectUri(),
    response_type: 'code',
    scope: GMAIL_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  if (loginHint) params.set('login_hint', loginHint);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      redirect_uri: getRedirectUri(),
      grant_type: 'authorization_code',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code');
  }
  return data as GoogleTokenResponse;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: getClientId(),
      client_secret: getClientSecret(),
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error_description || data.error || 'Failed to refresh Gmail access token');
  }
  return data;
}

export async function fetchGoogleUserEmail(accessToken: string): Promise<string> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok || !data.email) {
    throw new Error('Failed to fetch the connected Google account email address');
  }
  return data.email as string;
}

// --------------------
// crm_gmail_accounts persistence
// --------------------

export interface CrmGmailAccount {
  id: string;
  email_address: string;
  display_name: string | null;
  status: 'active' | 'revoked';
  connected_by: string | null;
  created_at: string;
  updated_at: string;
}

interface CrmGmailAccountRow extends CrmGmailAccount {
  refresh_token_encrypted: string;
  access_token_encrypted: string | null;
  access_token_expires_at: string | null;
}

export async function getActiveCrmGmailAccount(): Promise<CrmGmailAccount | null> {
  const { data, error } = await supabase
    .from('crm_gmail_accounts')
    .select('id, email_address, display_name, status, connected_by, created_at, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as CrmGmailAccount) || null;
}

async function getActiveCrmGmailAccountRow(): Promise<CrmGmailAccountRow | null> {
  const { data, error } = await supabase
    .from('crm_gmail_accounts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as CrmGmailAccountRow) || null;
}

export async function saveCrmGmailAccount(input: {
  emailAddress: string;
  refreshToken: string;
  accessToken: string;
  expiresIn: number;
  connectedBy?: string | null;
}): Promise<CrmGmailAccount> {
  // Only one connected account is supported in V1 — deactivate any others so
  // there's never ambiguity about which mailbox sequence emails send from.
  await supabase.from('crm_gmail_accounts').update({ status: 'revoked' }).eq('status', 'active');

  const accessTokenExpiresAt = new Date(Date.now() + input.expiresIn * 1000).toISOString();

  const { data, error } = await supabase
    .from('crm_gmail_accounts')
    .upsert(
      [
        {
          email_address: input.emailAddress,
          refresh_token_encrypted: encryptSecret(input.refreshToken),
          access_token_encrypted: encryptSecret(input.accessToken),
          access_token_expires_at: accessTokenExpiresAt,
          status: 'active',
          connected_by: input.connectedBy || null,
        },
      ],
      { onConflict: 'email_address' }
    )
    .select('id, email_address, display_name, status, connected_by, created_at, updated_at')
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to save connected Gmail account');
  return data as CrmGmailAccount;
}

export async function disconnectCrmGmailAccount(): Promise<void> {
  const account = await getActiveCrmGmailAccountRow();
  if (!account) return;

  try {
    const refreshToken = decryptSecret(account.refresh_token_encrypted);
    await fetch(GOOGLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: refreshToken }),
    });
  } catch (error) {
    // Revoking with Google is best-effort — always still mark it disconnected on our side.
    console.error('Failed to revoke Gmail token with Google:', error);
  }

  const { error } = await supabase.from('crm_gmail_accounts').update({ status: 'revoked' }).eq('id', account.id);
  if (error) throw new Error(error.message);
}

/**
 * Returns a valid (non-expired) access token for the connected Gmail account,
 * refreshing and persisting a new one first if the cached token has expired
 * or is within 60 seconds of expiring.
 */
async function getValidAccessToken(account: CrmGmailAccountRow): Promise<string> {
  const expiresAt = account.access_token_expires_at ? new Date(account.access_token_expires_at).getTime() : 0;
  const isExpiringSoon = !account.access_token_encrypted || expiresAt - Date.now() < 60_000;

  if (!isExpiringSoon) {
    return decryptSecret(account.access_token_encrypted as string);
  }

  const refreshToken = decryptSecret(account.refresh_token_encrypted);
  const refreshed = await refreshAccessToken(refreshToken);

  await supabase
    .from('crm_gmail_accounts')
    .update({
      access_token_encrypted: encryptSecret(refreshed.access_token),
      access_token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    })
    .eq('id', account.id);

  return refreshed.access_token;
}

// --------------------
// Sending
// --------------------

function encodeMimeHeaderValue(value: string): string {
  // Encode non-ASCII header values (e.g. a name with an apostrophe/accent) per RFC 2047
  // so mail clients render them correctly instead of showing raw UTF-8 bytes.
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function buildRawMimeMessage(input: {
  fromAddress: string;
  fromName?: string | null;
  toAddress: string;
  toName?: string | null;
  subject: string;
  bodyText: string;
}): string {
  const fromHeader = input.fromName
    ? `${encodeMimeHeaderValue(input.fromName)} <${input.fromAddress}>`
    : input.fromAddress;
  const toHeader = input.toName ? `${encodeMimeHeaderValue(input.toName)} <${input.toAddress}>` : input.toAddress;

  const lines = [
    `From: ${fromHeader}`,
    `To: ${toHeader}`,
    `Subject: ${encodeMimeHeaderValue(input.subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(input.bodyText, 'utf8').toString('base64'),
  ];

  return lines.join('\r\n');
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Sends one plain-text email through the connected Gmail account's own inbox —
 * it lands in that account's real Sent folder and any reply threads there
 * naturally, exactly like a normal email sent from Gmail's own UI.
 */
export async function sendCrmSequenceEmailViaGmail(input: {
  toAddress: string;
  toName?: string | null;
  subject: string;
  bodyText: string;
}): Promise<{ gmailMessageId: string; fromAddress: string }> {
  const account = await getActiveCrmGmailAccountRow();
  if (!account) {
    throw new Error('No Gmail account is connected. Connect one from the CRM before sending sequence emails.');
  }

  const accessToken = await getValidAccessToken(account);
  const raw = buildRawMimeMessage({
    fromAddress: account.email_address,
    fromName: account.display_name,
    toAddress: input.toAddress,
    toName: input.toName,
    subject: input.subject,
    bodyText: input.bodyText,
  });

  const response = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: base64UrlEncode(raw) }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to send email via Gmail');
  }

  return { gmailMessageId: data.id as string, fromAddress: account.email_address };
}
