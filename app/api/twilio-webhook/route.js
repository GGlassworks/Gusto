// Twilio webhook for incoming calls with Deepgram STT
export async function POST(req) {
  try {
    const formData = await req.formData()
    const callSid = formData.get("CallSid")
    const from = formData.get("From")
    const to = formData.get("To")
    const callStatus = formData.get("CallStatus")

    console.log("📞 Incoming Twilio call:", {
      callSid,
      from,
      to,
      callStatus,
    })

    // TwiML response for incoming calls
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Hi there! You've reached Glaze Glassworks. I'm Gusto, your AI assistant. I'm here to help with your glass installation needs. Please tell me about your project after the beep.</Say>
    <Record 
        action="/api/twilio-recording" 
        method="POST" 
        maxLength="60" 
        playBeep="true"
        transcribe="false"
    />
    <Say voice="alice">Thank you for calling Glaze Glassworks. We'll process your message and get back to you soon. Goodbye!</Say>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("❌ Twilio webhook error:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Sorry, we're experiencing technical difficulties. Please try calling back later or visit our website. Goodbye!</Say>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
