import dotenv from 'dotenv';
import https from 'https';
dotenv.config();

export async function handlePipedriveLead(data) {
  const { fullName, email, phone, address, notes } = data;
  const payload = {
    full_name: fullName,
    email,
    phone,
    address,
    notes
  };
  const apiUrl = process.env.PIPEDRIVE_WEBFORM_URL;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    const url = new URL(apiUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ success: true, data: JSON.parse(raw) });
        } catch {
          resolve({ success: false });
        }
      });
    });

    req.on('error', () => resolve({ success: false }));
    req.write(postData);
    req.end();
  });
}