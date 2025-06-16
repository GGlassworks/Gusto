import { PipedriveService } from "@/lib/pipedrive"

export async function POST(req) {
  try {
    const body = await req.json()
    console.log("Received customer lookup request:", body)

    const { firstName, lastName, phone, password } = body

    // Validate required fields
    if (!firstName || !lastName || !phone) {
      console.error("Missing required fields for customer lookup:", { firstName, lastName, phone })
      return Response.json({ error: "First name, last name, and phone number are required" }, { status: 400 })
    }

    // Validate environment variables
    if (!process.env.PIPEDRIVE_API_KEY) {
      console.error("Missing Pipedrive API key")
      return Response.json({ error: "Pipedrive configuration missing" }, { status: 500 })
    }

    console.log("Creating Pipedrive service for customer lookup...")
    const pipedrive = new PipedriveService()

    console.log("Searching for customer...")
    const result = await pipedrive.searchCustomerByNameAndPhone(firstName, lastName, phone, password)

    console.log("Customer lookup result:", result)

    return Response.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Customer lookup error:", error)

    return Response.json(
      {
        error: "Failed to lookup customer",
        details: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
