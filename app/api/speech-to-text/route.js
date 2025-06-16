// API route for Deepgram speech-to-text
export async function POST(req) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio")

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    console.log("🎙️ Processing audio with Deepgram...")

    // Convert the audio file to buffer
    const audioBuffer = await audioFile.arrayBuffer()

    // Call Deepgram API
    const deepgramResponse = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token 0ae91d9f2f50c599c4a905801745b8c4db8dc9c8`,
          "Content-Type": "audio/wav",
        },
        body: audioBuffer,
      },
    )

    if (!deepgramResponse.ok) {
      const errorText = await deepgramResponse.text()
      console.error("❌ Deepgram API error:", errorText)
      return Response.json({ error: "Speech recognition failed" }, { status: 500 })
    }

    const result = await deepgramResponse.json()
    console.log("✅ Deepgram response:", result)

    // Extract the transcript
    const transcript = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""
    const confidence = result.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0

    console.log("📝 Transcript:", transcript)
    console.log("🎯 Confidence:", confidence)

    return Response.json({
      success: true,
      transcript: transcript,
      confidence: confidence,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Speech-to-text error:", error)
    return Response.json(
      {
        error: "Failed to process speech",
        details: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
