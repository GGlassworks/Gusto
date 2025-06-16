// google-auto-reply.js
// Example: Auto-reply to generic emails using Gmail API

const { google } = require('googleapis');
const { getAuthorizedClient } = require('./google');

async function autoReplyToUnread() {
  const auth = getAuthorizedClient();
  const gmail = google.gmail({ version: 'v1', auth });
  // List unread messages
  const res = await gmail.users.messages.list({ userId: 'me', q: 'is:unread' });
  const messages = res.data.messages || [];
  for (const msg of messages) {
    const msgData = await gmail.users.messages.get({ userId: 'me', id: msg.id });
    const headers = msgData.data.payload.headers;
    const from = headers.find(h => h.name === 'From').value;
    // Simple auto-reply logic (customize as needed)
    const reply = {
      to: from,
      subject: 'Thank you for contacting Glaze Glassworks',
      message: '<p>We received your message and will respond soon. For immediate help, call us at (XXX) XXX-XXXX.</p>',
    };
    // Send reply
    await require('./google').sendEmail(reply);
    // Mark as read
    await gmail.users.messages.modify({ userId: 'me', id: msg.id, requestBody: { removeLabelIds: ['UNREAD'] } });
    console.log('Auto-replied to:', from);
  }
}

// Example usage:
// autoReplyToUnread();

module.exports = { autoReplyToUnread };
