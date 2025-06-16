// Enhanced Twilio recording handler with Deepgram transcription
export async function POST(req) {
  try {
    const formData = await req.formData()
    const recordingUrl = formData.get("RecordingUrl")
    const callSid = formData.get("CallSid")
    const from = formData.get("From")
    const recordingSid = formData.get("RecordingSid")

    console.log("🎙️ Processing recording:", {
      recordingUrl,
      callSid,
      from,
      recordingSid,
    })

    let transcription = ""
    const customerInfo = {
      phone: from,
      source: "Phone Call",
      timestamp: new Date().toISOString(),
    }

    // Transcribe with Deepgram
    if (recordingUrl && process.env.DEEPGRAM_API_KEY) {
      try {
        const audioResponse = await fetch(recordingUrl + ".mp3")
        const audioBuffer = await audioResponse.arrayBuffer()

        const deepgramResponse = await fetch("https://api.deepgram.com/v1/listen", {
          method: "POST",
          headers: {
            Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
            "Content-Type": "audio/mpeg",
          },
          body: audioBuffer,
        })

        const deepgramData = await deepgramResponse.json()
        transcription = deepgramData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""

        console.log("✅ Deepgram transcription:", transcription)
      } catch (error) {
        console.error("❌ Deepgram transcription failed:", error)
        transcription = "Transcription unavailable"
      }
    }

    // Extract customer details from transcription
    if (transcription) {
      customerInfo.message = transcription
      customerInfo.recordingUrl = recordingUrl

      // Basic info extraction
      const emailMatch = transcription.match(/[\w.-]+@[\w.-]+\.\w+/g)
      const nameMatch = transcription.match(/(?:my name is|i'm|this is)\s+([a-zA-Z\s]+)/i)

      if (emailMatch) customerInfo.email = emailMatch[0]
      if (nameMatch) customerInfo.name = nameMatch[1].trim()
    }

    // Create high-priority lead
    try {
      const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...customerInfo,
          priority: "urgent", // Phone calls are urgent
          callSid,
          recordingSid,
        }),
      })

      if (response.ok) {
        console.log("✅ Phone lead created successfully")
      }
    } catch (error) {
      console.error("❌ Failed to create phone lead:", error)
    }

    // Return success response
    return new Response("OK", { status: 200 })
  } catch (error) {
    console.error("❌ Recording processing error:", error)
    return new Response("Error", { status: 500 })
  }
}
