import WebSocket from "ws"
import { Deepgram } from "@deepgram/sdk"
import OpenAI from "openai"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"
import http from "http"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize services
const deepgram = new Deepgram(process.env.DEEPGRAM_API_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const PORT = process.env.PORT || 8080

// Create HTTP server first
const server = http.createServer()
const port = process.env.PORT || 8080

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({
  server,
  path: "/ws",
})

// Start server on 0.0.0.0 for external access
server.listen(port, "0.0.0.0", () => {
  console.log(`✅ Glaze Glassworks Voice Server listening on port ${port}`)
  console.log(`🔌 WebSocket endpoint: ws://0.0.0.0:${port}/ws`)
  console.log(`🌐 External access: wss://your-domain:${port}/ws`)
})

// Store active connections and their state
const connections = new Map()

wss.on("connection", (socket, request) => {
  console.log("📞 New Twilio connection established")

  const connectionId = Date.now() + Math.random()

  // Initialize connection state
  connections.set(connectionId, {
    socket,
    deepgramConnection: null,
    conversationHistory: [],
    currentTranscript: "",
    isProcessing: false,
  })

  // Set up Deepgram live transcription
  const deepgramLive = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    interim_results: false,
    punctuate: true,
    diarize: false,
    encoding: "mulaw",
    sample_rate: 8000,
    channels: 1,
  })

  connections.get(connectionId).deepgramConnection = deepgramLive

  // Handle Deepgram transcription results
  deepgramLive.on("transcriptReceived", async (data) => {
    const transcript = data.channel?.alternatives?.[0]?.transcript

    if (transcript && transcript.trim()) {
      console.log("🗣️ Transcript:", transcript)

      const connection = connections.get(connectionId)
      if (connection && !connection.isProcessing) {
        connection.isProcessing = true
        await processUserInput(connectionId, transcript)
      }
    }
  })

  deepgramLive.on("error", (error) => {
    console.error("❌ Deepgram error:", error)
  })

  // Handle incoming Twilio media
  socket.on("message", (data) => {
    try {
      const message = JSON.parse(data)

      if (message.event === "start") {
        console.log("🎬 Call started:", message.start?.callSid)
      }

      if (message.event === "media" && message.media?.payload) {
        // Decode base64 audio and send to Deepgram
        const audioBuffer = Buffer.from(message.media.payload, "base64")

        const connection = connections.get(connectionId)
        if (connection?.deepgramConnection) {
          connection.deepgramConnection.send(audioBuffer)
        }
      }

      if (message.event === "stop") {
        console.log("🛑 Call ended")
        cleanup(connectionId)
      }
    } catch (error) {
      console.error("❌ Message parsing error:", error)
    }
  })

  socket.on("close", () => {
    console.log("📞 Connection closed")
    cleanup(connectionId)
  })

  socket.on("error", (error) => {
    console.error("❌ WebSocket error:", error)
    cleanup(connectionId)
  })
})

// Process user input with GPT and generate TTS response
async function processUserInput(connectionId, transcript) {
  const connection = connections.get(connectionId)
  if (!connection) return

  try {
    // Add user message to conversation history
    connection.conversationHistory.push({
      role: "user",
      content: transcript,
    })

    // Generate GPT response
    const systemPrompt = `You are Gusto, a friendly AI assistant for Glaze Glassworks, a glass installation company. 
    You help customers with:
    - Shower enclosures and glass doors
    - Custom mirrors and glass panels  
    - Window repairs and replacements
    - Smart glass and office partitions
    - Wine rooms and display cases
    
    Keep responses conversational, helpful, and under 50 words. Ask for contact info when appropriate.
    If they want a quote, ask for their name, phone, email, and project details.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }, ...connection.conversationHistory],
      max_tokens: 150,
      temperature: 0.7,
    })

    const gptResponse = completion.choices[0]?.message?.content
    if (!gptResponse) {
      console.error("❌ No GPT response generated")
      connection.isProcessing = false
      return
    }

    console.log("🤖 GPT Response:", gptResponse)

    // Add assistant response to history
    connection.conversationHistory.push({
      role: "assistant",
      content: gptResponse,
    })

    // Generate TTS audio
    await generateAndPlayTTS(connectionId, gptResponse)
  } catch (error) {
    console.error("❌ Error processing input:", error)
    connection.isProcessing = false
  }
}

// Generate TTS and send play command to Twilio
async function generateAndPlayTTS(connectionId, text) {
  const connection = connections.get(connectionId)
  if (!connection) return

  try {
    console.log("🔊 Generating TTS for:", text.substring(0, 50) + "...")

    // Generate speech with OpenAI TTS
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy", // You can change to: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1.0,
    })

    // Save audio to temporary file
    const audioBuffer = Buffer.from(await mp3Response.arrayBuffer())
    const audioPath = path.join(__dirname, "temp", `reply_${connectionId}.mp3`)

    // Ensure temp directory exists
    const tempDir = path.dirname(audioPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    fs.writeFileSync(audioPath, audioBuffer)
    console.log("💾 Audio saved to:", audioPath)

    // Send TwiML command to play the audio
    // Note: In production, you'd host this file on a public URL
    // For now, we'll send a simple TwiML response
    const twimlResponse = `
      <Response>
        <Say voice="Polly.Joanna">${text}</Say>
      </Response>
    `

    // Send TwiML back to Twilio (this would typically go through your Vercel API)
    console.log("📤 TwiML Response ready:", twimlResponse)

    connection.isProcessing = false
  } catch (error) {
    console.error("❌ TTS generation error:", error)
    connection.isProcessing = false
  }
}

// Cleanup connection resources
function cleanup(connectionId) {
  const connection = connections.get(connectionId)
  if (connection) {
    if (connection.deepgramConnection) {
      connection.deepgramConnection.finish()
    }
    connections.delete(connectionId)
  }
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down server...")
  wss.close(() => {
    console.log("✅ Server closed")
    process.exit(0)
  })
})
