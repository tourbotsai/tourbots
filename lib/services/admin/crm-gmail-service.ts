import crypto from 'crypto';
import { supabaseServiceRole as supabase } from '../../supabase-service-role';

// --------------------
// Config
// --------------------

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const GOOGLE_REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';
const GMAIL_SEND_URL = `${GMAIL_API_BASE}/messages/send`;

// gmail.send is "sensitive"; gmail.readonly (needed to poll for inbound
// replies) is classified "restricted" by Google — it needs a CASA security
// assessment only if the app is verified/published for >100 users. Staying
// in Testing mode with jack@tourbotsai.com as a listed test user avoids that
// entirely, same as today.
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'openid',
  'email',
].join(' ');

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
    // select_account forces Google to show the account chooser instead of
    // silently continuing with whichever Google session happens to be
    // active in the browser — important because the admin panel login and
    // the Workspace mailbox being connected are different Google accounts,
    // and a stale/wrong active session otherwise causes a spurious
    // "Error 403: org_internal" even for legitimate org members.
    prompt: 'consent select_account',
    include_granted_scopes: 'true',
    state,
  });
  // Deliberately no login_hint: the only email we'd have here is the admin's
  // own login email (e.g. a personal Gmail used to sign into the CRM), which
  // is not the Workspace mailbox being connected and would just mislead the
  // account chooser.
  void loginHint;
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

export interface CrmGmailAccountRow extends CrmGmailAccount {
  refresh_token_encrypted: string;
  access_token_encrypted: string | null;
  access_token_expires_at: string | null;
  last_history_id: string | null;
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

export async function getActiveCrmGmailAccountRow(): Promise<CrmGmailAccountRow | null> {
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
 * or is within 60 seconds of expiring. Exported so the inbound-poll cron can
 * reuse the exact same refresh logic as sending does.
 */
export async function getValidAccessToken(account: CrmGmailAccountRow): Promise<string> {
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
}): Promise<{ gmailMessageId: string; gmailThreadId: string | null; fromAddress: string }> {
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

  return {
    gmailMessageId: data.id as string,
    gmailThreadId: (data.threadId as string) || null,
    fromAddress: account.email_address,
  };
}

// --------------------
// Inbound polling (reply detection)
// --------------------

export async function updateGmailHistoryId(accountId: string, historyId: string): Promise<void> {
  const { error } = await supabase.from('crm_gmail_accounts').update({ last_history_id: historyId }).eq('id', accountId);
  if (error) throw new Error(error.message);
}

/**
 * Seeds last_history_id from Gmail's current historyId, without processing
 * any existing mail. Used the first time the poll cron ever runs for this
 * account so we start watching from "now" rather than retroactively firing
 * activity logs / auto-stops for old mail that predates this feature.
 */
export async function bootstrapGmailHistoryId(accessToken: string): Promise<string> {
  const response = await fetch(`${GMAIL_API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch Gmail profile for history bootstrap');
  }
  return String(data.historyId);
}

export interface GmailHistoryResult {
  messageIds: string[];
  latestHistoryId: string;
  // True when Gmail reports the given startHistoryId is too old (history is
  // only retained ~1 week) — the caller should re-bootstrap and skip this cycle.
  expired: boolean;
}

/**
 * Returns every message ID added to INBOX since startHistoryId, paginating
 * as needed, plus the historyId to resume from next time.
 */
export async function getGmailHistorySince(accessToken: string, startHistoryId: string): Promise<GmailHistoryResult> {
  const messageIds = new Set<string>();
  let pageToken: string | undefined;
  let latestHistoryId = startHistoryId;

  do {
    const params = new URLSearchParams({
      startHistoryId,
      historyTypes: 'messageAdded',
      labelId: 'INBOX',
    });
    if (pageToken) params.set('pageToken', pageToken);

    const response = await fetch(`${GMAIL_API_BASE}/history?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await response.json();

    if (!response.ok) {
      // Gmail returns 404 with reason "notFound" once startHistoryId falls
      // outside its retention window.
      if (response.status === 404) {
        return { messageIds: [], latestHistoryId: startHistoryId, expired: true };
      }
      throw new Error(data.error?.message || 'Failed to fetch Gmail history');
    }

    for (const record of data.history || []) {
      for (const added of record.messagesAdded || []) {
        if (added.message?.id) messageIds.add(added.message.id as string);
      }
    }
    if (data.historyId) latestHistoryId = String(data.historyId);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return { messageIds: Array.from(messageIds), latestHistoryId, expired: false };
}

export interface InboundGmailMessage {
  gmailMessageId: string;
  gmailThreadId: string | null;
  fromAddress: string;
  subject: string | null;
  bodyText: string;
  receivedAt: string | null;
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Gmail messages can nest MIME parts arbitrarily (multipart/alternative inside
// multipart/mixed, etc.) — walk the tree and prefer the first text/plain part
// found, falling back to a stripped text/html part.
function extractBodyFromPayload(payload: any): { plain: string | null; html: string | null } {
  let plain: string | null = null;
  let html: string | null = null;

  const visit = (part: any) => {
    if (!part) return;
    const mimeType = part.mimeType || '';
    const data = part.body?.data;
    if (mimeType === 'text/plain' && data && plain === null) {
      plain = decodeBase64Url(data);
    } else if (mimeType === 'text/html' && data && html === null) {
      html = decodeBase64Url(data);
    }
    for (const child of part.parts || []) visit(child);
  };

  visit(payload);
  return { plain, html };
}

function parseFromHeader(value: string): string {
  const match = value.match(/<([^>]+)>/);
  return (match ? match[1] : value).trim().toLowerCase();
}

/**
 * Fetches one full inbound message and extracts what we need to log it:
 * sender address, subject, plain-text body (falling back to stripped HTML,
 * then Gmail's snippet if neither MIME part is present).
 */
export async function fetchInboundGmailMessage(accessToken: string, messageId: string): Promise<InboundGmailMessage> {
  const response = await fetch(`${GMAIL_API_BASE}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Failed to fetch Gmail message ${messageId}`);
  }

  const headers: { name: string; value: string }[] = data.payload?.headers || [];
  const getHeader = (name: string) =>
    headers.find((header) => header.name.toLowerCase() === name.toLowerCase())?.value || null;

  const fromHeader = getHeader('From') || '';
  const subject = getHeader('Subject');
  const { plain, html } = extractBodyFromPayload(data.payload);
  const bodyText = (plain || (html ? stripHtml(html) : null) || data.snippet || '').trim();

  return {
    gmailMessageId: data.id as string,
    gmailThreadId: (data.threadId as string) || null,
    fromAddress: parseFromHeader(fromHeader),
    subject,
    bodyText,
    receivedAt: data.internalDate ? new Date(Number(data.internalDate)).toISOString() : null,
  };
}
