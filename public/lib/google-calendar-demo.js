// google-calendar-demo.js
// Example script: Schedule a calendar event for a new lead

const { createCalendarEvent } = require('./google');

async function scheduleEstimate({ name, email, phone, address, date, time }) {
  const event = {
    summary: `Glass Estimate: ${name}`,
    description: `Estimate for ${name}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address}`,
    start: {
      dateTime: `${date}T${time}:00`,
      timeZone: 'America/Phoenix',
    },
    end: {
      dateTime: `${date}T${parseInt(time) + 1}:00`,
      timeZone: 'America/Phoenix',
    },
    attendees: [
      { email },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };
  const result = await createCalendarEvent(event);
  console.log('Event created:', result.data.htmlLink);
}

// Example usage:
// scheduleEstimate({
//   name: 'John Doe',
//   email: 'john@example.com',
//   phone: '555-123-4567',
//   address: '123 Main St, Phoenix, AZ',
//   date: '2025-06-05',
//   time: '14:00',
// });

module.exports = { scheduleEstimate };
