// /app/api/tts/route.js
export async function POST(req) {
  try {
    const { text, voice = "onyx", speed = 1.15 } = await req.json()

    if (!process.env.OPENAI_API_KEY) {
      return new Response("Missing API key", { status: 500 })
    }

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response("No text provided", { status: 400 })
    }

    if (text.length > 4000) {
      return new Response("Text too long", { status: 400 })
    }

    const openaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        input: text,
        voice,
        response_format: "mp3",
        speed,
      }),
    })

    if (!openaiRes.ok || !openaiRes.body) {
      const errText = await openaiRes.text()
      console.error("TTS error:", errText)
      return new Response("TTS failed", { status: 500 })
    }

    return new Response(openaiRes.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (err) {
    console.error("Internal TTS error:", err)
    return new Response("Internal error", { status: 500 })
  }
}
