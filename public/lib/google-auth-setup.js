// google-auth-setup.js
// One-time script to authorize your app and save the token

const { getAuthUrl, saveTokenFromCode } = require('./google');
const readline = require('readline');

async function main() {
  // Step 1: Get the auth URL
  const url = getAuthUrl();
  console.log('Authorize this app by visiting this URL:\n', url);

  // Step 2: Prompt for the code
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Enter the code from that page here: ', async (code) => {
    try {
      await saveTokenFromCode(code.trim());
      console.log('Token stored to google-token.json!');
    } catch (err) {
      console.error('Error saving token:', err);
    }
    rl.close();
  });
}

main();
