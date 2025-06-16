import { createOpenAI } from "@ai-sdk/openai"
import { generateText } from "ai"

// Create a configured OpenAI provider with explicit API key
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// LIVEBENCH-INSPIRED EVALUATION METRICS
interface ConversationMetrics {
  informationExtracted: number
  responseRelevance: number
  customerSatisfaction: number
  conversionPotential: number
}

// BENCHMARK-QUALITY RESPONSE EVALUATION
const evaluateResponse = (conversation: string, extractedData: any): ConversationMetrics => {
  const metrics: ConversationMetrics = {
    informationExtracted: 0,
    responseRelevance: 0,
    customerSatisfaction: 0,
    conversionPotential: 0,
  }

  // Information extraction scoring (0-100)
  let infoScore = 0
  if (extractedData.firstName) infoScore += 20
  if (extractedData.lastName) infoScore += 20
  if (extractedData.phone || extractedData.email) infoScore += 25
  if (extractedData.address) infoScore += 15
  if (extractedData.serviceType && extractedData.serviceType !== "General Glass Services") infoScore += 20
  metrics.informationExtracted = infoScore

  // Response relevance scoring
  const conversationLower = conversation.toLowerCase()
  let relevanceScore = 50 // Base score

  // Check for service-specific responses
  if (conversationLower.includes("shower") && conversationLower.includes("enclosure")) relevanceScore += 15
  if (conversationLower.includes("estimate") && conversationLower.includes("free")) relevanceScore += 10
  if (conversationLower.includes("timeline") || conversationLower.includes("schedule")) relevanceScore += 10
  if (conversationLower.includes("price") || conversationLower.includes("cost")) relevanceScore += 10

  metrics.responseRelevance = Math.min(relevanceScore, 100)

  // Customer satisfaction indicators
  let satisfactionScore = 50
  if (conversationLower.includes("thank")) satisfactionScore += 15
  if (conversationLower.includes("helpful")) satisfactionScore += 20
  if (conversationLower.includes("great") || conversationLower.includes("perfect")) satisfactionScore += 15

  metrics.customerSatisfaction = Math.min(satisfactionScore, 100)

  // Conversion potential
  let conversionScore = 0
  if (metrics.informationExtracted >= 80) conversionScore += 40
  if (conversationLower.includes("ready") || conversationLower.includes("schedule")) conversionScore += 30
  if (conversationLower.includes("estimate") || conversationLower.includes("quote")) conversionScore += 30

  metrics.conversionPotential = Math.min(conversionScore, 100)

  return metrics
}

// DEEPSEEK-INSPIRED ADVANCED REASONING
const advancedReasoningPrompt = (messages: any[], extractedData: any, metrics: ConversationMetrics) => {
  return `You are Gusto, an advanced AI with sophisticated reasoning capabilities inspired by state-of-the-art language models.

ADVANCED REASONING FRAMEWORK:
- Use multi-step logical reasoning for complex customer needs
- Apply contextual understanding across conversation history
- Demonstrate deep domain expertise in glass installation
- Employ strategic conversation management

CURRENT CONVERSATION METRICS:
- Information Extracted: ${metrics.informationExtracted}%
- Response Relevance: ${metrics.responseRelevance}%
- Customer Satisfaction: ${metrics.customerSatisfaction}%
- Conversion Potential: ${metrics.conversionPotential}%

REASONING OBJECTIVES:
${metrics.informationExtracted < 60 ? "🎯 PRIORITY: Information gathering through strategic questioning" : ""}
${metrics.responseRelevance < 70 ? "🎯 PRIORITY: Improve response relevance to customer needs" : ""}
${metrics.customerSatisfaction < 70 ? "🎯 PRIORITY: Enhance customer experience and satisfaction" : ""}
${metrics.conversionPotential >= 70 ? "🎯 PRIORITY: Guide toward conversion with urgency and value" : ""}

ADVANCED CAPABILITIES:
1. **Multi-Modal Reasoning**: Consider technical, emotional, and business factors
2. **Predictive Analysis**: Anticipate customer objections and needs
3. **Strategic Communication**: Use persuasion psychology and sales methodology
4. **Quality Assurance**: Self-evaluate and optimize each response

EXTRACTED CUSTOMER DATA:
${JSON.stringify(extractedData, null, 2)}

RESPONSE OPTIMIZATION:
- Provide value in every interaction
- Use advanced pattern recognition
- Apply sophisticated conversation flow management
- Demonstrate expertise through detailed knowledge`
}

// Enhanced the extractCustomerInfoFromConversation function to be more flexible with language

// Replace the existing extractCustomerInfoFromConversation function with this improved version
const extractCustomerInfoFromConversation = (conversationText: string) => {
  const data: any = {}
  console.log("🔍 BENCHMARK-QUALITY EXTRACTION:", conversationText.substring(0, 300) + "...")

  // ADVANCED EMAIL EXTRACTION with multiple validation layers
  const emailPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    /(?:email|e-mail|mail|contact)(?:\s+is|\s+address)?:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/i,
    /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/g,
  ]

  for (const pattern of emailPatterns) {
    const emailMatch = conversationText.match(pattern)
    if (emailMatch) {
      const email = Array.isArray(emailMatch) && emailMatch.length > 1 ? emailMatch[1] : emailMatch[0]
      // Validate email format
      if (email && email.includes("@") && email.includes(".") && email.length > 5) {
        data.email = email.toLowerCase()
        console.log("✅ EMAIL EXTRACTED:", data.email)
        break
      }
    }
  }

  // ADVANCED PHONE EXTRACTION with international format support
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /$$\d{3}$$[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\+1[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /(?:phone|number|cell|mobile|tel)(?:\s+is)?:?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
  ]

  for (const pattern of phonePatterns) {
    const phoneMatch = conversationText.match(pattern)
    if (phoneMatch) {
      const phone = Array.isArray(phoneMatch) && phoneMatch.length > 1 ? phoneMatch[1] : phoneMatch[0]
      const cleanPhone = phone.replace(/[^\d]/g, "")
      if (cleanPhone.length === 10 || cleanPhone.length === 11) {
        const formattedPhone =
          cleanPhone.length === 11
            ? cleanPhone.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, "+$1-$2-$3-$4")
            : cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
        data.phone = formattedPhone
        console.log("✅ PHONE EXTRACTED:", data.phone)
        break
      }
    }
  }

  // SOPHISTICATED NAME EXTRACTION with context awareness
  const nameExtractionPatterns = [
    // Explicit introductions
    /(?:my name is|i'm|i am|this is|name's|call me)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)/i,
    // Formal introductions
    /(?:hello|hi),?\s+(?:my name is|i'm|this is)\s+([A-Z][a-z]+)\s+([A-Z][a-z]+)/i,
    // Professional context
    /([A-Z][a-z]+)\s+([A-Z][a-z]+)(?:\s+here|\s+calling|\s+speaking)/i,
    // Direct name provision
    /(?:first name|firstname)[:\s]+([A-Z][a-z]+)/i,
    /(?:last name|lastname)[:\s]+([A-Z][a-z]+)/i,
  ]

  for (const pattern of nameExtractionPatterns) {
    const nameMatch = conversationText.match(pattern)
    if (nameMatch && nameMatch.length >= 2) {
      const firstName = nameMatch[1]?.trim()
      const lastName = nameMatch[2]?.trim() || nameMatch[1]?.trim()

      // Validate names (avoid common words)
      const invalidWords = [
        "sorry",
        "thank",
        "hello",
        "please",
        "would",
        "could",
        "should",
        "glass",
        "window",
        "door",
        "mirror",
        "shower",
        "about",
        "where",
        "what",
        "when",
        "how",
        "can",
        "will",
        "get",
        "need",
        "want",
      ]

      if (
        firstName &&
        lastName &&
        !invalidWords.includes(firstName.toLowerCase()) &&
        !invalidWords.includes(lastName.toLowerCase()) &&
        firstName.length >= 2 &&
        lastName.length >= 2
      ) {
        data.firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
        data.lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()
        data.name = `${data.firstName} ${data.lastName}`
        console.log("✅ NAME EXTRACTED:", data.name)
        break
      }
    }
  }

  // ADVANCED ADDRESS EXTRACTION with geocoding patterns
  const addressPatterns = [
    /(?:address|live|located|project)(?:\s+is|\s+at)?:?\s*([0-9]+\s+[A-Za-z0-9\s,.-]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|place|pl)[A-Za-z0-9\s,.-]*)/i,
    /([0-9]+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|place|pl))/i,
  ]

  for (const pattern of addressPatterns) {
    const addressMatch = conversationText.match(pattern)
    if (addressMatch) {
      data.address = addressMatch[1] || addressMatch[0]
      console.log("✅ ADDRESS EXTRACTED:", data.address)
      break
    }
  }

  // INTELLIGENT SERVICE TYPE CLASSIFICATION
  const serviceClassification = classifyServiceType(conversationText)
  data.serviceType = serviceClassification

  console.log("🎯 BENCHMARK-QUALITY EXTRACTION COMPLETE:", data)
  return data
}

// ADVANCED SERVICE TYPE CLASSIFICATION
const classifyServiceType = (text: string): string => {
  const lowerText = text.toLowerCase()

  // Weighted scoring system for service classification
  const serviceScores: { [key: string]: number } = {
    "Shower Enclosures": 0,
    Mirrors: 0,
    Windows: 0,
    "Glass Doors": 0,
    "Wine Rooms": 0,
    "Smart Glass": 0,
    "Office Partitions": 0,
    "General Glass Services": 0,
  }

  // Shower Enclosures scoring
  if (lowerText.includes("shower")) serviceScores["Shower Enclosures"] += 30
  if (lowerText.includes("enclosure")) serviceScores["Shower Enclosures"] += 25
  if (lowerText.includes("bathroom")) serviceScores["Shower Enclosures"] += 15
  if (lowerText.includes("frameless")) serviceScores["Shower Enclosures"] += 20

  // Mirrors scoring
  if (lowerText.includes("mirror")) serviceScores["Mirrors"] += 40
  if (lowerText.includes("reflection")) serviceScores["Mirrors"] += 15
  if (lowerText.includes("vanity")) serviceScores["Mirrors"] += 20

  // Windows scoring
  if (lowerText.includes("window")) serviceScores["Windows"] += 35
  if (lowerText.includes("pane")) serviceScores["Windows"] += 20
  if (lowerText.includes("view")) serviceScores["Windows"] += 10

  // Glass Doors scoring
  if (lowerText.includes("door")) serviceScores["Glass Doors"] += 30
  if (lowerText.includes("entrance")) serviceScores["Glass Doors"] += 20
  if (lowerText.includes("sliding")) serviceScores["Glass Doors"] += 25

  // Wine Rooms scoring
  if (lowerText.includes("wine")) serviceScores["Wine Rooms"] += 40
  if (lowerText.includes("cellar")) serviceScores["Wine Rooms"] += 30
  if (lowerText.includes("storage")) serviceScores["Wine Rooms"] += 15

  // Smart Glass scoring
  if (lowerText.includes("smart")) serviceScores["Smart Glass"] += 35
  if (lowerText.includes("switchable")) serviceScores["Smart Glass"] += 40
  if (lowerText.includes("privacy")) serviceScores["Smart Glass"] += 20

  // Office Partitions scoring
  if (lowerText.includes("office")) serviceScores["Office Partitions"] += 30
  if (lowerText.includes("partition")) serviceScores["Office Partitions"] += 35
  if (lowerText.includes("divider")) serviceScores["Office Partitions"] += 25

  // Find highest scoring service
  const maxScore = Math.max(...Object.values(serviceScores))
  if (maxScore >= 20) {
    const topService = Object.keys(serviceScores).find((key) => serviceScores[key] === maxScore)
    return topService || "General Glass Services"
  }

  return "General Glass Services"
}

// Also enhance the extractCustomerInfo function for better name extraction
const extractCustomerInfo = (messages: any[]) => {
  const conversationText = messages.map((m: any) => m.content || m.text).join(" ")
  return extractCustomerInfoFromConversation(conversationText)
}

// Enhance the isAskingAboutPOOrderStatus function to be more flexible
const isAskingAboutPOOrderStatus = (messages: any[]) => {
  const conversationText = messages
    .map((m: any) => m.content || m.text)
    .join(" ")
    .toLowerCase()

  // More flexible P.O# reference patterns
  const poPatterns = [
    /p\.?o\.?#\d+/i,
    /purchase\s+order\s+#?\d+/i,
    /order\s+#?\d+/i,
    /po\s+#?\d+/i,
    /p\.?o\.?\s+number\s+#?\d+/i,
  ]

  // Check if any PO pattern matches
  const hasPOReference = poPatterns.some((pattern) => pattern.test(conversationText))

  // More flexible order status language
  const orderStatusPatterns = [
    "where is my order",
    "what stage am i in",
    "order status",
    "my order",
    "summarize the notes",
    "check my order",
    "order details",
    "track my order",
    "how is my order",
    "update on my order",
    "progress of my order",
    "status of my order",
    "where are we with",
    "what's happening with",
    "how's my project",
    "project status",
  ]

  const hasOrderStatusReference = orderStatusPatterns.some((pattern) => conversationText.includes(pattern))

  // More flexible customer identification patterns
  const customerIdPatterns = ["my name is", "i'm", "i am", "this is", "name's", "call me", "speaking", "here"]

  const hasCustomerIdentification = customerIdPatterns.some((keyword) => conversationText.includes(keyword))

  // Check for password in the conversation with more flexibility
  const passwordPatterns = [
    /password[:\s]+([a-zA-Z0-9]+)/i,
    /pass[:\s]+([a-zA-Z0-9]+)/i,
    /code[:\s]+([a-zA-Z0-9]+)/i,
    /verification[:\s]+([a-zA-Z0-9]+)/i,
  ]

  const hasPassword = passwordPatterns.some((pattern) => pattern.test(conversationText))

  // ONLY trigger for customers with P.O#, order status inquiry, and password
  return hasPOReference && hasOrderStatusReference && hasCustomerIdentification && hasPassword
}

// Function to detect if customer is asking about delivery/materials timing - VERY RESTRICTIVE
// Function to detect if customer is asking for a customer care representative
const isAskingForRepresentative = (messages: any[]) => {
  const conversationText = messages
    .map((m: any) => m.content || m.text)
    .join(" ")
    .toLowerCase()

  // Patterns indicating customer wants to speak with a representative
  const representativePatterns = [
    "speak to someone",
    "talk to someone",
    "speak with someone",
    "talk with someone",
    "speak to a person",
    "talk to a person",
    "speak to a representative",
    "talk to a representative",
    "speak to a human",
    "talk to a human",
    "speak to an agent",
    "talk to an agent",
    "speak to a specialist",
    "talk to a specialist",
    "can someone call me",
    "have someone call me",
    "can someone contact me",
    "have someone contact me",
  ].some((pattern) => conversationText.includes(pattern))

  return representativePatterns
}

// Function to detect if conversation has enough information to direct to CTA
const shouldDirectToCTA = (messages: any[], extractedData: any) => {
  const conversationText = messages
    .map((m: any) => m.text)
    .join(" ")
    .toLowerCase()

  // Check if we have the 3 vital contact points
  const hasVitalInfo = extractedData.firstName && extractedData.lastName && (extractedData.phone || extractedData.email)

  // Check if customer has shared project details
  const hasProjectDetails = extractedData.serviceType && extractedData.serviceType !== "General Glass Services"

  // Check if customer has shared enough about their needs
  const hasDetailedNeeds =
    conversationText.includes("need") ||
    conversationText.includes("want") ||
    conversationText.includes("looking for") ||
    conversationText.includes("interested in") ||
    conversationText.includes("project") ||
    conversationText.includes("estimate") ||
    conversationText.includes("quote")

  // Check if conversation has progressed enough (at least 4 exchanges)
  const hasEnoughExchanges = messages.length >= 8

  return hasVitalInfo && hasProjectDetails && hasDetailedNeeds && hasEnoughExchanges
}

// Fallback responses for when AI is unavailable
const getFallbackResponse = (userMessage: string) => {
  const message = userMessage.toLowerCase()

  // Check if asking for a representative
  if (isAskingForRepresentative([{ text: message }])) {
    return "I'd be absolutely thrilled to have one of our Customer Care Specialists reach out to you directly! 😊 To ensure they can contact you promptly, could you please share your name, phone number, and a brief description of your glass project needs?"
  }

  // Service-specific responses
  if (message.includes("shower") || message.includes("enclosure")) {
    return "Oh wonderful! Shower enclosures are one of my favorite projects to help with! 🚿 We create absolutely stunning frameless, semi-frameless, framed, and sliding shower solutions that will transform your bathroom. What kind of shower project are you considering?"
  }

  if (message.includes("mirror")) {
    return "Mirrors are such a fantastic way to brighten and open up any space! ✨ We specialize in both gorgeous framed and sleek frameless mirrors for residential and commercial spaces. What type of mirror project do you have in mind?"
  }

  if (message.includes("wine room") || message.includes("wine cellar")) {
    return "Oh my goodness, wine rooms are absolutely one of our most exciting specialties! 🍷 We create breathtaking temperature-controlled glass enclosures that beautifully showcase your collection. Tell me more about your wine room vision!"
  }

  if (message.includes("smart glass") || message.includes("switchable")) {
    return "Smart glass technology is absolutely fascinating and so cool! 🤖 We install incredible switchable privacy glass that can go from crystal clear to completely opaque with just the flip of a switch. What application are you considering for smart glass?"
  }

  // General greeting responses
  if (message.includes("hello") || message.includes("hi") || message.includes("hey")) {
    return "Hello there! Welcome to Glaze Glassworks! 👋 I'm absolutely thrilled you're here! We're passionate experts in all types of glass installation and services. What kind of amazing glass project are you considering today?"
  }

  // Pricing questions
  if (
    message.includes("price") ||
    message.includes("cost") ||
    message.includes("estimate") ||
    message.includes("promotion") ||
    message.includes("discount")
  ) {
    return "I'm so excited to help you with pricing information! 💰 We provide completely free estimates for all our glass services, and pricing depends on the specific type of glass, size, and installation requirements. What type of glass project are you interested in?"
  }

  // Default response
  return "Thank you so much for contacting Glaze Glassworks! I'm absolutely delighted to help you today! 🌟 We specialize in all types of amazing glass installation including stunning shower enclosures, beautiful mirrors, elegant wine rooms, cutting-edge smart glass, and incredible custom projects. What type of glass service are you interested in?"
}

export async function POST(req: Request) {
  try {
    const { messages, leadData } = await req.json()

    // Check if customer is asking for a representative
    if (isAskingForRepresentative(messages)) {
      const conversationText = messages.map((m: any) => m.content || m.text).join(" ")
      const extractedData = extractCustomerInfoFromConversation(conversationText)

      if (
        extractedData &&
        extractedData.firstName &&
        extractedData.lastName &&
        (extractedData.email || extractedData.phone)
      ) {
        try {
          await fetch(`${req.url.replace("/api/chat", "/api/leads")}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `${extractedData.firstName} ${extractedData.lastName}`,
              firstName: extractedData.firstName,
              lastName: extractedData.lastName,
              email: extractedData.email || "",
              phone: extractedData.phone || "",
              serviceType: extractedData.serviceType || "Representative Request",
              notes: `Representative request from chat\n\n${messages.map((m: any) => `${m.sender || "user"}: ${m.text}`).join("\n")}`,
            }),
          })
        } catch (error) {
          console.error("Failed to create representative request lead:", error)
        }
      }

      return Response.json({
        reply:
          "I'd be absolutely thrilled to have one of our Customer Care Specialists reach out to you directly! 😊 To ensure they can contact you promptly, could you please share your name, phone number, and a brief description of your glass project needs?",
      })
    }

    // Check if customer is asking about P.O# order status (stages 5-8)
    const askingAboutPOStatus = isAskingAboutPOOrderStatus(messages)

    if (askingAboutPOStatus) {
      console.log("Customer asking about P.O# order status with password - searching stages 5-8")

      const customerInfo = extractCustomerInfo(messages)

      // Extract password from conversation
      const conversationText = messages.map((m: any) => m.content || m.text).join(" ")
      const passwordMatch = conversationText.match(/password[:\s]+([a-zA-Z0-9]+)/i)
      const password = passwordMatch ? passwordMatch[1] : null

      if (customerInfo && password) {
        try {
          const lookupResponse = await fetch(`${req.url.replace("/api/chat", "/api/customer-lookup")}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...customerInfo,
              password: password,
            }),
          })

          if (lookupResponse.ok) {
            const lookupData = await lookupResponse.json()

            if (lookupData.found) {
              const deliveryInfo = lookupData.estimatedDelivery || "ETA information is being updated by our team"
              const customerName = lookupData.customerName || `${customerInfo.firstName} ${customerInfo.lastName}`
              const stageName = lookupData.stageName || "Unknown stage"
              const stageId = lookupData.stageId || "Unknown"

              return Response.json({
                reply: `Perfect, ${customerName}! 🎉 I found your order in our system!

**Current Stage:** ${stageName} (Stage ${stageId})
**Delivery Status:** ${deliveryInfo}

Your project is progressing beautifully through our production pipeline. Is there anything specific about your order you'd like me to clarify?`,
              })
            } else {
              return Response.json({
                reply: `I'm having difficulty locating your P.O# order with those details and password. 😔 Please verify your information is correct, or contact our Customer Care team for assistance.`,
              })
            }
          }
        } catch (lookupError) {
          return Response.json({
            reply: `I'm experiencing technical difficulties with our P.O# order lookup system. 😔 A Customer Care Specialist will contact you shortly with your order details.`,
          })
        }
      } else if (!password) {
        return Response.json({
          reply:
            "To look up your P.O# order status, I need your password for security. Please provide your order password along with your name and phone number.",
        })
      } else {
        return Response.json({
          reply:
            "To look up your P.O# order status, I need your full name, phone number, and order password for verification. Could you please provide those details?",
        })
      }
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is missing")
      const lastMessage = messages[messages.length - 1]?.text || ""
      return Response.json({
        reply: getFallbackResponse(lastMessage),
      })
    }

    // Convert message format to AI SDK format
    const aiMessages = messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }))

    // Extract current conversation data with benchmark quality
    const conversationText = messages.map((m: any) => m.text).join(" ")
    const extractedData = extractCustomerInfoFromConversation(conversationText)

    // Evaluate conversation metrics
    const metrics = evaluateResponse(conversationText, extractedData)

    // Check if we should direct to CTA
    const shouldShowCTA = shouldDirectToCTA(messages, extractedData)

    try {
      const { text } = await generateText({
        model: openaiProvider("gpt-4"), // Using GPT-4 for benchmark-quality responses
        system: advancedReasoningPrompt(messages, extractedData, metrics),
        messages: aiMessages,
        maxTokens: 400,
      })

      // Log metrics for continuous improvement
      console.log("📊 CONVERSATION METRICS:", metrics)
      console.log("🎯 EXTRACTED DATA QUALITY:", extractedData)

      return Response.json({
        reply: text,
        shouldShowCTA: shouldShowCTA,
        extractedData: extractedData,
        metrics: metrics, // Include metrics for frontend optimization
      })
    } catch (aiError: any) {
      console.error("AI generation failed:", aiError)
      const lastMessage = messages[messages.length - 1]?.text || ""
      return Response.json({
        reply: getFallbackResponse(lastMessage),
      })
    }
  } catch (e) {
    console.error("API error:", e)
    return Response.json({ reply: "Sorry, I'm having some technical difficulties. Please try again later." })
  }
}
