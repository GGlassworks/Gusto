# Glaze Glassworks Voice AI Server

WebSocket server that handles real-time voice conversations for Glaze Glassworks using:
- Twilio Media Streams (audio input)
- Deepgram (speech-to-text)
- OpenAI GPT-4o (conversation AI)
- OpenAI TTS (text-to-speech)

## Setup

1. Copy `.env.example` to `.env` and add your API keys
2. Install dependencies: `npm install`
3. Run locally: `npm run dev`
4. Deploy to DigitalOcean App Platform using the Dockerfile

## Environment Variables

- `DEEPGRAM_API_KEY`: Your Deepgram API key
- `OPENAI_API_KEY`: Your OpenAI API key  
- `PORT`: Server port (default: 8080)

## Usage

The server listens for WebSocket connections at `/ws` and processes:
1. Incoming audio from Twilio Media Streams
2. Real-time transcription via Deepgram
3. AI responses via OpenAI GPT-4o
4. Text-to-speech conversion for replies

## Deployment

Push to GitHub and deploy via DigitalOcean App Platform:
1. Connect your GitHub repo
2. Select "Dockerfile" build method
3. Add environment variables in DO dashboard
4. Deploy and get your WebSocket URL: `wss://your-app.ondigitalocean.app/ws`
