import { PipedriveService } from "@/lib/pipedrive"

export async function POST(req) {
  try {
    console.log("Generating sequential S.O# for new chat session...")

    // Validate environment variables
    if (!process.env.PIPEDRIVE_API_KEY) {
      console.error("Missing Pipedrive API key")
      return Response.json({ error: "Pipedrive configuration missing" }, { status: 500 })
    }

    console.log("Creating Pipedrive service for S.O# generation...")
    const pipedrive = new PipedriveService()

    console.log("Getting next sequential S.O# number...")
    const soNumber = await pipedrive.getNextSequentialSONumber()

    console.log("Sequential S.O# generated successfully:", soNumber)

    return Response.json({
      success: true,
      soNumber: soNumber,
      message: "S.O# generated successfully with sequential numbering",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("S.O# generation error:", error)

    // Fallback to timestamp-based S.O# if Pipedrive fails
    const fallbackSO = `S.O#${Date.now().toString().slice(-6)}`

    return Response.json({
      success: true,
      soNumber: fallbackSO,
      message: "S.O# generated using fallback method",
      error: error.message || "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
