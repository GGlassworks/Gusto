import { PipedriveService } from "@/lib/pipedrive"

export async function POST(req: Request) {
  try {
    console.log("Generating S.O# for new chat session...")

    // Validate environment variables
    if (!process.env.PIPEDRIVE_API_KEY) {
      console.error("Missing Pipedrive API key")
      return Response.json({ error: "Pipedrive configuration missing" }, { status: 500 })
    }

    console.log("Creating Pipedrive service for S.O# generation...")
    const pipedrive = new PipedriveService()

    console.log("Getting next S.O# number...")
    const soNumber = await pipedrive.getNextSONumber()

    console.log("S.O# generated successfully:", soNumber)

    // Determine if this is an error number
    const isErrorNumber = soNumber.includes("S.O#E")

    return Response.json({
      success: true,
      soNumber: soNumber,
      isErrorNumber: isErrorNumber,
      message: isErrorNumber ? "S.O# generated using error fallback pattern" : "S.O# generated successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("S.O# generation error:", error)

    // Ultimate fallback - return S.O#E1
    return Response.json({
      success: true,
      soNumber: "S.O#E1",
      isErrorNumber: true,
      message: "S.O# generated using ultimate fallback",
      error: error.message || "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
