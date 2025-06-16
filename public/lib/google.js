// google.js
// Integration for Google Calendar and Gmail API
// Requires OAuth2 credentials from Google Cloud Console

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Load client secrets from a local file (download from Google Cloud Console)
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const TOKEN_PATH = path.join(__dirname, 'google-token.json');

function getOAuth2Client() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
}

// Step 1: Generate Auth URL
function getAuthUrl() {
  const oAuth2Client = getOAuth2Client();
  const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.readonly',
  ];
  return oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES });
}

// Step 2: Exchange code for token and save
async function saveTokenFromCode(code) {
  const oAuth2Client = getOAuth2Client();
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

// Step 3: Load authorized client
function getAuthorizedClient() {
  const oAuth2Client = getOAuth2Client();
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

// Only allow actions for the authorized user (owner)
const AUTHORIZED_EMAIL = 'YOUR_EMAIL@YOUR_DOMAIN.COM'; // <-- Set your Google Workspace email here

function isAuthorizedUser(email) {
  return email && email.toLowerCase() === AUTHORIZED_EMAIL.toLowerCase();
}

// Example: Create a calendar event
async function createCalendarEvent(event) {
  const auth = getAuthorizedClient();
  const calendar = google.calendar({ version: 'v3', auth });
  return await calendar.events.insert({ calendarId: 'primary', resource: event });
}

// Example: Send an email
async function sendEmail({ to, subject, message }) {
  const auth = getAuthorizedClient();
  const gmail = google.gmail({ version: 'v1', auth });
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${message}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  return await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
}

// Example: Audit log function
const AUDIT_LOG_PATH = path.join(__dirname, '../audit-log.txt');

function logAudit(action, user) {
  const entry = `[${new Date().toISOString()}] ${user}: ${action}\n`;
  fs.appendFileSync(AUDIT_LOG_PATH, entry);
}

// Wrap sensitive actions with authorization check
async function secureCreateCalendarEvent(event, userEmail) {
  if (!isAuthorizedUser(userEmail)) {
    throw new Error('Unauthorized: Only the owner can schedule events.');
  }
  const result = await createCalendarEvent(event);
  logAudit(`Created calendar event: ${JSON.stringify(event)}`, userEmail);
  return result;
}

async function secureSendEmail({ to, subject, message }, userEmail) {
  if (!isAuthorizedUser(userEmail)) {
    throw new Error('Unauthorized: Only the owner can send emails.');
  }
  const result = await sendEmail({ to, subject, message });
  logAudit(`Sent email to ${to}: ${subject}`, userEmail);
  return result;
}

module.exports = {
  getAuthUrl,
  saveTokenFromCode,
  createCalendarEvent,
  sendEmail,
  secureCreateCalendarEvent,
  secureSendEmail,
  isAuthorizedUser,
  logAudit,
};
