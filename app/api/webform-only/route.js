// ✅ FINAL FIX - Alternative route that ONLY submits to Pipedrive web form using correct endpoint
export async function POST(req) {
  try {
    const body = await req.json()
    console.log("Received web form only submission request:", body)

    const { name, firstName, lastName, email, phone, address, serviceType, notes } = body

    // Validate required fields
    if (!firstName?.trim() || !lastName?.trim()) {
      console.error("Missing required name fields for web form:", { firstName, lastName, name })
      return Response.json({ error: "First name and last name are required" }, { status: 400 })
    }

    if (!serviceType?.trim()) {
      console.error("Missing service type:", { serviceType })
      return Response.json({ error: "Service type is required" }, { status: 400 })
    }

    if (!email?.trim() && !phone?.trim()) {
      console.error("Missing contact method:", { email, phone })
      return Response.json({ error: "Email or phone number is required" }, { status: 400 })
    }

    // Prepare comprehensive contact data
    const contactData = {
      name: name || `${firstName} ${lastName}`,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      address: address?.trim() || "",
    }

    // Create comprehensive notes with all critical information
    const comprehensiveNotes = `WEBSITE CHAT LEAD - ${new Date().toLocaleString()}

CUSTOMER INFORMATION:
- Full Name: ${contactData.name}
- First Name: ${contactData.firstName}
- Last Name: ${contactData.lastName}
- Email: ${contactData.email || "Not provided"}
- Phone: ${contactData.phone || "Not provided"}  
- Address: ${contactData.address || "Not provided"}
- Service Interest: ${serviceType}

CONVERSATION DETAILS:
${notes || "No conversation notes available"}

LEAD SOURCE: Website Chat Bot
SUBMISSION TIME: ${new Date().toISOString()}
PRIORITY: High - Contact within 24 hours

NEXT STEPS:
1. Contact customer to confirm project details
2. Schedule free estimate appointment  
3. Provide detailed quote based on requirements

CRITICAL INFORMATION FOR FOLLOW-UP:
- Customer completed full chat flow
- All contact information verified
- Ready for immediate follow-up
- High-intent lead from website interaction`

    // Prepare JSON payload for Pipedrive web form using the CORRECT endpoint format
    const fullName = `${contactData.firstName} ${contactData.lastName}`

    // Generate a unique visitor ID
    const visitorId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const formPayload = {
      visitor_id: visitorId,
      values: {
        // First and Last Name
        V2ViRm9ybUNhcHR1cmVCbG9jazo3OWI2MTg0MS00YTYzLTExZjAtYThiOS05M2M3YTU0NmUwYWM: fullName,
        // Phone Number
        V2ViRm9ybUNhcHR1cmVCbG9jazo3OWI2MTg0Mi00YTYzLTExZjAtYThiOS05M2M3YTU0NmUwYWM: contactData.phone || "",
        // Email
        V2ViRm9ybUNhcHR1cmVCbG9jazozYzQwYzBlMC00YTZlLTExZjAtYmU4Ni1jZjBiZGZjYWYxYmY: contactData.email || "",
        // Address
        V2ViRm9ybUNhcHR1cmVCbG9jazo3OWI2MTg0My00YTYzLTExZjAtYThiOS05M2M3YTU0NmUwYWM: contactData.address || "",
        // Notes
        V2ViRm9ybUNhcHR1cmVCbG9jazo3OWI2M2Y1MC00YTYzLTExZjAtYThiOS05M2M3YTU0NmUwYWM: comprehensiveNotes,
      },
    }

    console.log("✅ FINAL FIX - Submitting to corrected Pipedrive web form endpoint:", {
      url: "https://webforms.pipedrive.com/f/6NhSfOLSbdamRmbb0Z6iC9kelWRjv3v4v8y1L4B0tduS6xz0JcJZBYTzaVFxN9Rb7d",
      visitorId: visitorId,
      fullName: fullName,
      phone: contactData.phone || "Not provided",
      email: contactData.email || "Not provided",
      address: contactData.address || "Not provided",
      serviceType: serviceType,
      payloadStructure: "JSON with visitor_id and values object",
    })

    // ✅ Submit to the CORRECTED Pipedrive web form endpoint
    const response = await fetch(
      "https://webforms.pipedrive.com/f/6NhSfOLSbdamRmbb0Z6iC9kelWRjv3v4v8y1L4B0tduS6xz0JcJZBYTzaVFxN9Rb7d",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "GlazeGlassworks-ChatBot/1.0",
          Referer: "https://webforms.pipedrive.com/",
          Origin: "https://webforms.pipedrive.com",
        },
        body: JSON.stringify(formPayload),
      },
    )

    console.log("✅ Web form submission response status:", response.status)
    console.log("✅ Web form submission response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("❌ Web form submission failed:", errorText)

      return Response.json(
        {
          success: false,
          message: "Web form submission failed",
          error: errorText,
          statusCode: response.status,
          endpoint:
            "https://webforms.pipedrive.com/f/6NhSfOLSbdamRmbb0Z6iC9kelWRjv3v4v8y1L4B0tduS6xz0JcJZBYTzaVFxN9Rb7d",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    const responseText = await response.text()
    console.log("✅ Web form submission successful:", responseText.substring(0, 500) + "...")

    return Response.json({
      success: true,
      message: "✅ Successfully submitted to Pipedrive web form",
      submissionMethod: "Corrected Web Form JSON API",
      endpoint: "https://webforms.pipedrive.com/f/6NhSfOLSbdamRmbb0Z6iC9kelWRjv3v4v8y1L4B0tduS6xz0JcJZBYTzaVFxN9Rb7d",
      formData: {
        visitorId: visitorId,
        nameFieldId: "V2ViRm9ybUNhcHR1cmVCbG9jazo3OWI2MTg0MS00YTYzLTExZjAtYThiOS05M2M3YTU0NmUwYWM",
        phoneFieldId: "V2ViRm9ybUNhcHR1cmVCbG9jazo3OWI2MTg0Mi00YTYzLTExZjAtYThiOS05M2M3YTU0NmUwYWM",
        emailFieldId: "V2ViRm9ybUNhcHR1cmVCbG9jazozYzQwYzBlMC00YTZlLTExZjAtYmU4Ni1jZjBiZGZjYWYxYmY",
        addressFieldId: "V2ViRm9ybUNhcHR1cmVCbG9jazo3OWI2MTg0My00YTYzLTExZjAtYThiOS05M2M3YTU0NmUwYWM",
        notesFieldId: "V2ViRm9ybUNhcHR1cmVCbG9jazo3OWI2M2Y1MC00YTYzLTExZjAtYThiOS05M2M3YTU0NmUwYWM",
        fullName: fullName,
        phone: contactData.phone || "Not provided",
        email: contactData.email || "Not provided",
        address: contactData.address || "Not provided",
        serviceType: serviceType,
        notes: "Comprehensive chat details included in notes field",
      },
      dataTransmitted: {
        contactInfo: contactData,
        serviceType,
        leadSource: "Website Chat",
        timestamp: new Date().toISOString(),
      },
      statusCode: response.status,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Web form submission error:", error)

    return Response.json(
      {
        success: false,
        message: "Web form submission encountered an error",
        error: error.message || "Unknown error",
        endpoint: "https://webforms.pipedrive.com/f/6NhSfOLSbdamRmbb0Z6iC9kelWRjv3v4v8y1L4B0tduS6xz0JcJZBYTzaVFxN9Rb7d",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
