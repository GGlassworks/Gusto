// Twilio SMS webhook for incoming text messages
export async function POST(req) {
  try {
    const formData = await req.formData()
    const from = formData.get("From")
    const to = formData.get("To")
    const body = formData.get("Body")
    const messageSid = formData.get("MessageSid")

    console.log("📱 Incoming SMS:", {
      from,
      to,
      body,
      messageSid,
    })

    // Extract customer info from SMS
    const customerInfo = {
      phone: from,
      message: body,
      source: "SMS",
      timestamp: new Date().toISOString(),
    }

    // Create lead in Pipedrive
    try {
      const response = await fetch(`${process.env.VERCEL_URL || "http://localhost:3000"}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...customerInfo,
          priority: "high", // SMS leads are high priority
        }),
      })

      if (response.ok) {
        console.log("✅ SMS lead created successfully")
      }
    } catch (error) {
      console.error("❌ Failed to create SMS lead:", error)
    }

    // Auto-reply to customer
    const replyMessage = `Hi! Thanks for texting Glaze Glassworks! 🏠✨ 

We received your message about glass services. Our team will call you back within 2 hours to discuss your project.

For immediate help, call us at (602) 878-4375 or visit our website.

- The Glaze Glassworks Team`

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>${replyMessage}</Message>
</Response>`

    return new Response(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("❌ SMS webhook error:", error)

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>Thanks for contacting Glaze Glassworks! We'll get back to you soon. Call (602) 878-4375 for immediate assistance.</Message>
</Response>`

    return new Response(errorTwiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}
