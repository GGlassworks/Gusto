// google-email-demo.js
// Example script: Send a marketing email or auto-reply

const { sendEmail } = require('./google');

async function sendCampaignEmail({ to, subject, message }) {
  const result = await sendEmail({ to, subject, message });
  console.log('Email sent:', result.data.id);
}

// Example usage:
// sendCampaignEmail({
//   to: 'customer@example.com',
//   subject: 'Summer Glass Specials!',
//   message: '<h1>Save on Glass Projects!</h1><p>Contact us for a free estimate.</p>',
// });

module.exports = { sendCampaignEmail };
