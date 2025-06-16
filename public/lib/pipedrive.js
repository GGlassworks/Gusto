require('dotenv').config({ path: path.join(__dirname, '../.env') });

export class PipedriveService {
  constructor() {
    this.apiKey = process.env.PIPEDRIVE_API_KEY
    this.stageId = process.env.PIPEDRIVE_STAGE_ID
    this.baseUrl = "https://api.pipedrive.com/v1"
    // Updated: Search stages 5, 6, 7, and 8 for P.O# order status inquiries (Material Procurement and beyond)
    this.deliveryLookupStageIds = [5, 6, 7, 8] // Stages 5-8 for P.O# order status inquiries
    this.allStageIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] // All stages for duplicate checking
  }

  async checkCustomerExistsInAllStages(firstName, lastName, phone) {
    try {
      console.log(`Checking if customer exists in ALL pipeline stages: ${firstName} ${lastName}, Phone: ${phone}`)

      // Get ALL deals from ALL stages (not just search stages)
      const response = await fetch(`${this.baseUrl}/deals?api_token=${this.apiKey}&limit=500&sort=add_time DESC`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("All deals response for duplicate check:", data)

      if (!response.ok || !data.success) {
        console.error("Failed to search all deals:", data)
        return { found: false }
      }

      if (!data.data || !Array.isArray(data.data)) {
        console.log("No deals found in any stages")
        return { found: false }
      }

      // Search through ALL deals to find matching customer
      for (const deal of data.data) {
        if (deal.person_id) {
          // Get person details
          const personResponse = await fetch(`${this.baseUrl}/persons/${deal.person_id}?api_token=${this.apiKey}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          const personData = await personResponse.json()

          if (personResponse.ok && personData.success && personData.data) {
            const person = personData.data

            // Check if name matches
            const personFirstName = person.first_name?.toLowerCase() || ""
            const personLastName = person.last_name?.toLowerCase() || ""
            const searchFirstName = firstName.toLowerCase()
            const searchLastName = lastName.toLowerCase()

            // Check if phone matches (extract digits only for comparison)
            const personPhones = person.phone || []
            const searchPhoneDigits = phone.replace(/\D/g, "")

            let phoneMatch = false
            for (const phoneEntry of personPhones) {
              const personPhoneDigits = phoneEntry.value?.replace(/\D/g, "") || ""
              if (personPhoneDigits === searchPhoneDigits) {
                phoneMatch = true
                break
              }
            }

            // If both name and phone match
            if (personFirstName === searchFirstName && personLastName === searchLastName && phoneMatch) {
              console.log(`Found existing customer in stage ${deal.stage_id}:`, person.name)

              // Get stage name
              const stageResponse = await fetch(`${this.baseUrl}/stages/${deal.stage_id}?api_token=${this.apiKey}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              })

              let stageName = `Stage ${deal.stage_id}`
              if (stageResponse.ok) {
                const stageData = await stageResponse.json()
                if (stageData.success && stageData.data) {
                  stageName = stageData.data.name
                }
              }

              return {
                found: true,
                dealTitle: deal.title,
                stageName: stageName,
                customerName: person.name,
                dealId: deal.id,
                stageId: deal.stage_id,
              }
            }
          }
        }
      }

      console.log("Customer does not exist in any pipeline stage")
      return { found: false }
    } catch (error) {
      console.error("Error checking customer existence in all stages:", error)
      return { found: false }
    }
  }

  async searchCustomerByNameAndPhone(firstName, lastName, phone, password) {
    try {
      console.log(`Searching for customer order info in stages 5-8: ${firstName} ${lastName}, Phone: ${phone}`)

      // Search for deals in stages 5-8 for order inquiries
      const response = await fetch(
        `${this.baseUrl}/deals?api_token=${this.apiKey}&limit=500&stage_id=5&stage_id=6&stage_id=7&stage_id=8`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      const data = await response.json()
      console.log("Deals search response for order lookup (stages 5-8):", data)

      if (!response.ok || !data.success) {
        console.error("Failed to search deals for orders in stages 5-8:", data)
        return { found: false }
      }

      if (!data.data || !Array.isArray(data.data)) {
        console.log("No deals found in stages 5-8 for order lookup")
        return { found: false }
      }

      // Search through deals to find matching customer
      for (const deal of data.data) {
        // Only process deals in stages 5-8
        if (deal.stage_id < 5 || deal.stage_id > 8) {
          continue
        }

        if (deal.person_id) {
          // Get person details
          const personResponse = await fetch(`${this.baseUrl}/persons/${deal.person_id}?api_token=${this.apiKey}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          })

          const personData = await personResponse.json()

          if (personResponse.ok && personData.success && personData.data) {
            const person = personData.data

            // Check if name matches (case insensitive)
            const personFirstName = person.first_name?.toLowerCase() || ""
            const personLastName = person.last_name?.toLowerCase() || ""
            const searchFirstName = firstName.toLowerCase()
            const searchLastName = lastName.toLowerCase()

            // Check if phone matches
            const personPhones = person.phone || []
            const searchPhoneDigits = phone.replace(/\D/g, "")

            let phoneMatch = false
            for (const phoneEntry of personPhones) {
              const personPhoneDigits = phoneEntry.value?.replace(/\D/g, "") || ""
              if (personPhoneDigits === searchPhoneDigits) {
                phoneMatch = true
                break
              }
            }

            // If both name and phone match
            if (personFirstName === searchFirstName && personLastName === searchLastName && phoneMatch) {
              console.log(`Found matching customer for order lookup in stage ${deal.stage_id}:`, person.name)

              // Get the deal's details including password field
              const dealResponse = await fetch(`${this.baseUrl}/deals/${deal.id}?api_token=${this.apiKey}`, {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              })

              const dealData = await dealResponse.json()

              if (dealResponse.ok && dealData.success && dealData.data) {
                const dealDetails = dealData.data

                // Check password if provided
                if (password) {
                  const storedPassword = dealDetails["8c415c401086165cc6323a614f5e85d74ec3c05a"]
                  if (storedPassword !== password) {
                    console.log("Password mismatch for order lookup")
                    return { found: false }
                  }
                }

                // Look for delivery information
                let estimatedDelivery = null
                if (dealDetails["3e71f7cfcb154b7cb7e19bc3959842f4ca782331"]) {
                  estimatedDelivery = dealDetails["3e71f7cfcb154b7cb7e19bc3959842f4ca782331"]
                }

                // Get stage name
                const stageResponse = await fetch(`${this.baseUrl}/stages/${deal.stage_id}?api_token=${this.apiKey}`, {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                  },
                })

                let stageName = `Stage ${deal.stage_id}`
                if (stageResponse.ok) {
                  const stageData = await stageResponse.json()
                  if (stageData.success && stageData.data) {
                    stageName = stageData.data.name
                  }
                }

                return {
                  found: true,
                  estimatedDelivery: estimatedDelivery
                    ? `Your materials are estimated to arrive: ${estimatedDelivery}`
                    : "ETA information is being updated by our team",
                  dealTitle: deal.title,
                  stageName: stageName,
                  customerName: person.name,
                  dealId: deal.id,
                  stageId: deal.stage_id,
                }
              }
            }
          }
        }
      }

      console.log("No matching customer found in stages 5-8 for order lookup")
      return { found: false }
    } catch (error) {
      console.error("Error searching for customer order info:", error)
      return { found: false }
    }
  }

  async getNextEditNumber() {
    try {
      console.log("Getting next Edit number...")

      // Get all deals to find the highest Edit number
      const response = await fetch(`${this.baseUrl}/deals?api_token=${this.apiKey}&limit=500&sort=add_time DESC`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("Deals response for Edit# lookup:", data)

      if (!response.ok || !data.success) {
        console.error("Failed to fetch deals for Edit number:", data)
        // Default to Edit1 if we can't fetch deals
        return "S.O# (Edit1)"
      }

      let highestEditNumber = 0

      // Look through all deals to find the highest Edit number
      if (data.data && Array.isArray(data.data)) {
        for (const deal of data.data) {
          // Check if the deal title contains S.O# (Edit pattern
          const editMatch = deal.title?.match(/S\.O# $$Edit(\d+)$$/)
          if (editMatch) {
            const number = Number.parseInt(editMatch[1], 10)
            if (number > highestEditNumber) {
              highestEditNumber = number
            }
          }
        }
      }

      // Increment and format
      const nextEditNumber = highestEditNumber + 1
      const salesOrderNumber = `S.O# (Edit${nextEditNumber})`

      console.log(`Generated next Edit S.O#: ${salesOrderNumber}`)
      return salesOrderNumber
    } catch (error) {
      console.error("Error getting next Edit number:", error)
      // Default to Edit1 if there's an error
      return "S.O# (Edit1)"
    }
  }

  async getNextSalesOrderNumber() {
    try {
      console.log("Getting next regular sales order number...")

      // Get all deals to find the highest S.O# number
      const response = await fetch(`${this.baseUrl}/deals?api_token=${this.apiKey}&limit=500&sort=add_time DESC`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("Deals response for regular S.O# lookup:", data)

      if (!response.ok || !data.success) {
        console.error("Failed to fetch deals for regular S.O#:", data)
        // Use Edit number system for errors
        throw new Error("Failed to fetch deals for regular S.O# generation")
      }

      let highestNumber = 0

      // Look through all deals to find the highest regular S.O# number (excluding Edit numbers)
      if (data.data && Array.isArray(data.data)) {
        for (const deal of data.data) {
          // Check if the deal title contains regular S.O# pattern (not Edit pattern)
          const soMatch = deal.title?.match(/S\.O#(\d+)/)
          const isEditNumber = deal.title?.includes("S.O# (Edit")

          if (soMatch && !isEditNumber) {
            const number = Number.parseInt(soMatch[1], 10)
            if (number > highestNumber) {
              highestNumber = number
            }
          }
        }
      }

      // Increment and format with leading zeros
      const nextNumber = highestNumber + 1
      const formattedNumber = nextNumber.toString().padStart(3, "0")
      const salesOrderNumber = `S.O#${formattedNumber}`

      console.log(`Generated next regular S.O#: ${salesOrderNumber}`)
      return salesOrderNumber
    } catch (error) {
      console.error("Error getting next regular sales order number:", error)
      // Don't fallback to Edit here - let the calling function handle it
      throw error
    }
  }

  async createPerson(contact) {
    try {
      console.log("Creating person in Pipedrive:", contact)

      const requestBody = {
        name: contact.name,
        first_name: contact.firstName,
        last_name: contact.lastName,
        ...(contact.email && { email: [contact.email] }),
        ...(contact.phone && { phone: [contact.phone] }),
      }

      console.log("Request body for person:", requestBody)

      const response = await fetch(`${this.baseUrl}/persons?api_token=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log("Pipedrive person response:", data)

      if (!response.ok) {
        console.error("Failed to create person:", data)
        throw new Error(`Failed to create person: ${data.error || "Unknown error"}`)
      }

      return data.success ? data.data : null
    } catch (error) {
      console.error("Error creating person in Pipedrive:", error)
      throw error
    }
  }

  async createDeal(deal) {
    try {
      console.log("Creating deal in Pipedrive with custom field IDs:", deal)

      // Use standard Pipedrive deal fields + your custom field IDs
      const requestBody = {
        title: deal.title,
        stage_id: Number.parseInt(this.stageId),
      }

      // Add person_id if provided
      if (deal.person_id) {
        requestBody.person_id = deal.person_id
      }

      // Add value if provided
      if (deal.value) {
        requestBody.value = deal.value
      }

      // Add custom fields using your provided API field IDs
      if (deal.firstName) {
        requestBody["ec8eb37b6a90185f670fbede0bc58ff5c25dda36"] = deal.firstName // First Name
      }

      if (deal.lastName) {
        requestBody["eecae84cd9aeae468efcd48400c04955c828fb2d"] = deal.lastName // Last Name
      }

      if (deal.phone) {
        requestBody["d10627bd60fcebc10ee32024e072ee371b9dcf7b"] = deal.phone // Phone#
      }

      if (deal.email) {
        requestBody["9a5a4c9322abc4c89714b7b31b56ba7fd3c6a686"] = deal.email // Email
      }

      if (deal.address) {
        requestBody["2db4a3d13e6e9f3ad830b74a5acdd1f93ea857a4"] = deal.address // Address
      }

      if (deal.notes) {
        requestBody["bbd8bb08b71e1a3a578ee8c857907f9bbc3cad75"] = deal.notes // Notes
      }

      console.log("Deal request body with custom fields:", requestBody)

      const response = await fetch(`${this.baseUrl}/deals?api_token=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log("Pipedrive deal response:", data)

      if (!response.ok) {
        console.error("Failed to create deal:", data)
        throw new Error(`Failed to create deal: ${data.error || "Unknown error"}`)
      }

      return data.success ? data.data : null
    } catch (error) {
      console.error("Error creating deal in Pipedrive:", error)
      throw error
    }
  }

  async addNoteToActivity(dealId, notes) {
    try {
      console.log("Adding comprehensive note to deal:", dealId)

      const requestBody = {
        content: notes,
        deal_id: dealId,
        subject: "Website Chat Lead - Complete Information",
      }

      const response = await fetch(`${this.baseUrl}/notes?api_token=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      console.log("Note creation response:", data)

      return data.success ? data.data : null
    } catch (error) {
      console.error("Error adding note:", error)
      // Don't throw error for notes - it's not critical
      return null
    }
  }

  async createUrgentLead(contact, serviceType, notes) {
    try {
      console.log("Creating urgent lead due to lookup failure...")

      // For urgent leads, always use Edit number system
      const salesOrderNumber = await this.getNextEditNumber()

      // Create the person
      const person = await this.createPerson(contact)

      if (!person) {
        throw new Error("Failed to create contact for urgent lead")
      }

      console.log("Person created for urgent lead:", person.id)

      // Create comprehensive notes
      const urgentNotes = `
DELIVERY INQUIRY - CUSTOMER NOT FOUND - URGENT FOLLOW-UP NEEDED
==============================================================

CUSTOMER INFORMATION:
- Full Name: ${contact.name}
- First Name: ${contact.firstName || "Not provided"}
- Last Name: ${contact.lastName || "Not provided"}
- Phone: ${contact.phone || "Not provided"}
- Email: ${contact.email || "Not provided"}
- Project Address: ${contact.address || "Not provided"}

SALES ORDER NUMBER: ${salesOrderNumber}

INQUIRY DETAILS:
- Customer was asking about delivery timing but could not be found in existing orders in stages 5+
- Customer may be in early pipeline stages (1-4) or not in system at all
- Customer Care Specialist needs to follow up immediately

SERVICE TYPE: ${serviceType}
LEAD SOURCE: Website Chat Bot
SUBMISSION TIME: ${new Date().toLocaleString()}

FULL CONVERSATION:
${notes}

ACTION REQUIRED: Contact customer within 24 hours to address delivery inquiry.
`

      // Create the deal with all custom fields populated
      const deal = await this.createDeal({
        title: `${salesOrderNumber} - ${serviceType} - ${contact.name}`,
        person_id: person.id,
        stage_id: Number.parseInt(this.stageId),
        firstName: contact.firstName,
        lastName: contact.lastName,
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        notes: urgentNotes,
      })

      if (!deal) {
        throw new Error("Failed to create deal for urgent lead")
      }

      console.log("Deal created for urgent lead:", deal.id)

      return { person, deal, salesOrderNumber }
    } catch (error) {
      console.error("Failed to create urgent lead:", error)
      throw error
    }
  }

  async getNextSONumber() {
    try {
      console.log("Getting next S.O# for org_id field...")

      // Get all leads to find the highest S.O# number
      const response = await fetch(`${this.baseUrl}/leads?api_token=${this.apiKey}&limit=500&sort=add_time DESC`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("Leads response for S.O# lookup:", data)

      if (!response.ok || !data.success) {
        console.error("Failed to fetch leads for S.O#:", data)
        // Use S.O#E fallback pattern when API fails
        return await this.getNextSOErrorNumber()
      }

      let highestNumber = 0

      // Look through all leads to find the highest S.O# number
      if (data.data && Array.isArray(data.data)) {
        for (const lead of data.data) {
          // Check if the lead has org_id field with S.O# pattern (exclude S.O#E pattern)
          if (lead.org_id) {
            const soMatch = lead.org_id.match(/^S\.O#(\d+)$/) // Only match regular S.O# pattern
            if (soMatch) {
              const number = Number.parseInt(soMatch[1], 10)
              if (number > highestNumber) {
                highestNumber = number
              }
            }
          }
        }
      }

      // Increment and format
      const nextNumber = highestNumber + 1
      const salesOrderNumber = `S.O#${nextNumber}`

      console.log(`Generated next S.O#: ${salesOrderNumber}`)
      return salesOrderNumber
    } catch (error) {
      console.error("Error getting next S.O# number:", error)
      // Use S.O#E fallback pattern when there's an error
      return await this.getNextSOErrorNumber()
    }
  }

  async getNextSOErrorNumber() {
    try {
      console.log("Getting next S.O#E error number...")

      // Get all leads to find the highest S.O#E number
      const response = await fetch(`${this.baseUrl}/leads?api_token=${this.apiKey}&limit=500&sort=add_time DESC`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("Leads response for S.O#E lookup:", data)

      let highestErrorNumber = 0

      // Look through all leads to find the highest S.O#E number
      if (data.success && data.data && Array.isArray(data.data)) {
        for (const lead of data.data) {
          // Check if the lead has org_id field with S.O#E pattern
          if (lead.org_id) {
            const soErrorMatch = lead.org_id.match(/^S\.O#E(\d+)$/) // Match S.O#E pattern
            if (soErrorMatch) {
              const number = Number.parseInt(soErrorMatch[1], 10)
              if (number > highestErrorNumber) {
                highestErrorNumber = number
              }
            }
          }
        }
      }

      // Increment and format
      const nextErrorNumber = highestErrorNumber + 1
      const salesOrderNumber = `S.O#E${nextErrorNumber}`

      console.log(`Generated next S.O#E: ${salesOrderNumber}`)
      return salesOrderNumber
    } catch (error) {
      console.error("Error getting next S.O#E number:", error)
      // Ultimate fallback
      return "S.O#E1"
    }
  }

  async createCalendarActivity(personId, dealId, customerName, phone, soNumber) {
    try {
      console.log("Creating URGENT calendar activity for immediate callback...")

      // Calculate time slot: 10 minutes from now
      const now = new Date()
      const callTime = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutes from now
      const endTime = new Date(callTime.getTime() + 10 * 60 * 1000) // 10 minute window

      // Format dates for Pipedrive (YYYY-MM-DD HH:MM:SS)
      const formatDateTime = (date) => {
        return date.toISOString().slice(0, 19).replace("T", " ")
      }

      const activityRequestBody = {
        subject: `🚨 URGENT: Call ${customerName} - ${soNumber}`,
        type: "call",
        due_date: formatDateTime(callTime),
        due_time: formatDateTime(callTime),
        duration: "00:10", // 10 minutes
        person_id: personId,
        deal_id: dealId,
        note: `🚨 URGENT WEBSITE LEAD - CALL IMMEDIATELY! 🚨

PRIORITY: HIGH - Website chat lead requires immediate contact!

CUSTOMER: ${customerName}
PHONE: ${phone}
S.O#: ${soNumber}

⏰ CALL WINDOW: ${callTime.toLocaleString()} - ${endTime.toLocaleString()}

🎯 OBJECTIVE:
- Contact customer within 10 minutes
- Schedule free estimate appointment
- Convert hot lead to appointment

📋 TALKING POINTS:
- Thank them for their interest in Glaze Glassworks
- Reference their specific glass project needs
- Offer free estimate appointment
- Create urgency with limited availability

⚡ ACTION REQUIRED: Call customer NOW - they just submitted inquiry!`,
        marked_as_done_time: null, // Not completed yet
      }

      console.log("Creating urgent activity:", activityRequestBody)

      const response = await fetch(`${this.baseUrl}/activities?api_token=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityRequestBody),
      })

      const data = await response.json()
      console.log("Calendar activity response:", data)

      if (!response.ok) {
        console.error("Failed to create calendar activity:", data)
        throw new Error(`Failed to create calendar activity: ${data.error || "Unknown error"}`)
      }

      console.log("✅ URGENT calendar activity created successfully:", data.data?.id)
      return data.success ? data.data : null
    } catch (error) {
      console.error("Error creating calendar activity:", error)
      throw error
    }
  }

  async createLead(contact, serviceType, notes, isEditSubmission = false) {
    try {
      console.log("Starting LEAD creation process with S.O# generation...")

      // FIRST: Check if customer already exists in ANY pipeline stage
      const existingCustomer = await this.checkCustomerExistsInAllStages(
        contact.firstName || "",
        contact.lastName || "",
        contact.phone || "",
      )

      if (existingCustomer.found && !isEditSubmission) {
        console.log(`Customer already exists in stage ${existingCustomer.stageId}. NOT creating duplicate lead.`)
        throw new Error(
          `Customer ${contact.name} already exists in pipeline stage ${existingCustomer.stageId} (${existingCustomer.stageName}). Duplicate lead creation prevented.`,
        )
      }

      // Generate S.O# for the new field
      const salesOrderNumber = await this.getNextSONumber()
      console.log("Generated S.O# for new field:", salesOrderNumber)

      // Create summarized notes instead of full conversation
      const summarizedNotes = this.createSummarizedNotes(contact, serviceType, notes, salesOrderNumber)

      // CREATE LEAD with new field IDs and NO org_id
      console.log("Creating URGENT LEAD in Pipedrive with new field structure...")

      const leadRequestBody = {
        title: `🚨 URGENT: ${salesOrderNumber} - ${serviceType} - ${contact.name}`,
        // REMOVED org_id field that was causing the error
        // Use the new custom field IDs
        "17a48dc288f0d9c83f9bc23435008defaf673a02": salesOrderNumber, // S.O# field
        c55145b65ede922da0793d920270845599b39656: contact.firstName, // First Name
        "024a82c8082c44d11292566a2f14aefcb6e559ce": contact.lastName, // Last Name
        d10627bd60fcebc10ee32024e072ee371b9dcf7b: contact.phone, // Phone#
        "9a5a4c9322abc4c89714b7b31b56ba7fd3c6a686": contact.email, // Email
        "2db4a3d13e6e9f3ad830b74a5acdd1f93ea857a4": contact.address, // Address
        bbd8bb08b71e1a3a578ee8c857907f9bbc3cad75: summarizedNotes, // Notes
      }

      console.log("Lead request body with new field structure:", leadRequestBody)

      const leadResponse = await fetch(`${this.baseUrl}/leads?api_token=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadRequestBody),
      })

      const leadData = await leadResponse.json()
      console.log("Pipedrive lead response:", leadData)

      if (!leadResponse.ok) {
        console.error("Failed to create lead:", leadData)
        throw new Error(`Failed to create lead: ${leadData.error || "Unknown error"}`)
      }

      const lead = leadData.success ? leadData.data : null

      if (!lead) {
        throw new Error("Lead creation returned no data")
      }

      console.log("Lead created successfully with S.O#:", lead.id, "S.O#:", salesOrderNumber)

      // Create person for calendar activity
      const person = await this.createPerson(contact)

      if (person) {
        console.log("Person created for calendar activity:", person.id)

        // Create urgent calendar activity
        try {
          await this.createCalendarActivity(
            person.id,
            lead.id,
            contact.name,
            contact.phone || contact.email || "No contact provided",
            salesOrderNumber,
          )
          console.log("✅ Urgent calendar activity created successfully!")
        } catch (activityError) {
          console.error("Failed to create calendar activity (non-critical):", activityError)
          // Don't fail the entire process if calendar activity fails
        }
      }

      return { lead, salesOrderNumber, person }
    } catch (error) {
      console.error("Lead creation failed:", error)
      throw error
    }
  }

  createSummarizedNotes(contact, serviceType, fullNotes, salesOrderNumber) {
    const currentDate = new Date().toLocaleString()

    // Extract key points from conversation
    const keyPoints = this.extractKeyPointsFromConversation(fullNotes)

    return `🚨 URGENT WEBSITE CHAT LEAD - ${currentDate} 🚨

CUSTOMER: ${contact.name}
S.O#: ${salesOrderNumber}
SERVICE: ${serviceType}
CONTACT: ${contact.phone || contact.email || "Not provided"}
ADDRESS: ${contact.address || "Not provided"}

KEY POINTS:
${keyPoints}

PRIORITY: HIGH - Hot lead requires immediate follow-up!
ACTION: Call customer within 10 minutes for free estimate scheduling.

Lead Source: Website Chat Bot`
  }

  // Helper method to extract key points from conversation
  extractKeyPointsFromConversation(conversation) {
    // Split conversation into lines
    const lines = conversation.split("\n")
    let keyPoints = ""
    const customerInterests = new Set()
    let hasTimelineQuestion = false
    let hasEstimateRequest = false
    let hasPricingQuestion = false
    let hasSpecificRequirements = false
    const mentionedLocations = new Set()

    // Look for key information in the conversation
    for (const line of lines) {
      const lowerLine = line.toLowerCase()

      // Check for service interests
      if (
        lowerLine.includes("shower") ||
        lowerLine.includes("enclosure") ||
        lowerLine.includes("mirror") ||
        lowerLine.includes("window") ||
        lowerLine.includes("door") ||
        lowerLine.includes("glass") ||
        lowerLine.includes("wine room") ||
        lowerLine.includes("smart glass") ||
        lowerLine.includes("partition")
      ) {
        // Extract the specific service mentioned
        if (lowerLine.includes("shower") || lowerLine.includes("enclosure")) {
          customerInterests.add("Shower Enclosures")
        }
        if (lowerLine.includes("mirror")) {
          customerInterests.add("Mirrors")
        }
        if (lowerLine.includes("window")) {
          customerInterests.add("Windows")
        }
        if (lowerLine.includes("door")) {
          customerInterests.add("Doors")
        }
        if (lowerLine.includes("wine room")) {
          customerInterests.add("Wine Rooms")
        }
        if (lowerLine.includes("smart glass") || lowerLine.includes("switchable")) {
          customerInterests.add("Smart Glass")
        }
        if (lowerLine.includes("partition") || lowerLine.includes("office")) {
          customerInterests.add("Office Partitions")
        }
      }

      // Check for timeline questions
      if (
        lowerLine.includes("how long") ||
        lowerLine.includes("timeline") ||
        lowerLine.includes("when can") ||
        lowerLine.includes("lead time") ||
        lowerLine.includes("how soon")
      ) {
        hasTimelineQuestion = true
      }

      // Check for estimate requests
      if (
        lowerLine.includes("estimate") ||
        lowerLine.includes("quote") ||
        lowerLine.includes("consultation") ||
        lowerLine.includes("appointment")
      ) {
        hasEstimateRequest = true
      }

      // Check for pricing questions
      if (
        lowerLine.includes("price") ||
        lowerLine.includes("cost") ||
        lowerLine.includes("how much") ||
        lowerLine.includes("pricing") ||
        lowerLine.includes("expensive")
      ) {
        hasPricingQuestion = true
      }

      // Check for specific requirements
      if (
        lowerLine.includes("specific") ||
        lowerLine.includes("custom") ||
        lowerLine.includes("exact") ||
        lowerLine.includes("particular") ||
        lowerLine.includes("special")
      ) {
        hasSpecificRequirements = true
      }

      // Try to extract locations
      const locationMatches = line.match(/\b(?:in|at|near|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g)
      if (locationMatches) {
        for (const match of locationMatches) {
          const location = match.replace(/\b(?:in|at|near|for)\s+/, "").trim()
          if (location.length > 3) {
            mentionedLocations.add(location)
          }
        }
      }
    }

    // Build key points summary
    if (customerInterests.size > 0) {
      keyPoints += "- Customer is interested in: " + Array.from(customerInterests).join(", ") + "\n"
    }

    if (hasTimelineQuestion) {
      keyPoints += "- Customer asked about project timeline/lead times\n"
    }

    if (hasEstimateRequest) {
      keyPoints += "- Customer requested an estimate/consultation\n"
    }

    if (hasPricingQuestion) {
      keyPoints += "- Customer inquired about pricing\n"
    }

    if (hasSpecificRequirements) {
      keyPoints += "- Customer mentioned specific requirements or custom needs\n"
    }

    if (mentionedLocations.size > 0) {
      keyPoints += "- Project location(s) mentioned: " + Array.from(mentionedLocations).join(", ") + "\n"
    }

    // If we couldn't extract any key points, provide a generic message
    if (keyPoints === "") {
      keyPoints = "- General inquiry about glass services\n"
    }

    return keyPoints
  }

  /**
   * Fetch and cache all pipeline, stage, and custom field metadata from Pipedrive.
   * This allows the bot to always know the latest structure for pro navigation.
   */
  async syncMetadata() {
    const endpoints = [
      { name: 'pipelines', url: `${this.baseUrl}/pipelines?api_token=${this.apiKey}` },
      { name: 'stages', url: `${this.baseUrl}/stages?api_token=${this.apiKey}` },
      { name: 'dealFields', url: `${this.baseUrl}/dealFields?api_token=${this.apiKey}` },
      { name: 'personFields', url: `${this.baseUrl}/personFields?api_token=${this.apiKey}` },
      { name: 'organizationFields', url: `${this.baseUrl}/organizationFields?api_token=${this.apiKey}` },
    ];
    const metadata = {};
    for (const ep of endpoints) {
      const res = await fetch(ep.url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (res.ok && data.success) {
        metadata[ep.name] = data.data;
      } else {
        metadata[ep.name] = null;
      }
    }
    this._metadata = metadata;
    return metadata;
  }

  /**
   * Get cached metadata (pipelines, stages, fields)
   */
  getMetadata() {
    return this._metadata || {};
  }

  /**
   * Create a follow-up activity/task for a deal or person
   */
  async createFollowUp({ subject, dealId, personId, dueDate, note }) {
    const requestBody = {
      subject,
      type: 'task',
      done: 0,
      due_date: dueDate,
      ...(dealId && { deal_id: dealId }),
      ...(personId && { person_id: personId }),
      note,
    };
    const response = await fetch(`${this.baseUrl}/activities?api_token=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Failed to create follow-up');
    return data.data;
  }

  /**
   * Move a deal to a new stage
   */
  async moveDealToStage(dealId, stageId) {
    const response = await fetch(`${this.baseUrl}/deals/${dealId}?api_token=${this.apiKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Failed to move deal');
    return data.data;
  }

  /**
   * Add a note to a deal or person
   */
  async addNote({ content, dealId, personId }) {
    const requestBody = {
      content,
      ...(dealId && { deal_id: dealId }),
      ...(personId && { person_id: personId }),
    };
    const response = await fetch(`${this.baseUrl}/notes?api_token=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Failed to add note');
    return data.data;
  }

  /**
   * Get analytics: deals by stage, won/lost, etc.
   */
  async getPipelineAnalytics() {
    const metadata = this.getMetadata();
    const stages = metadata.stages || [];
    const response = await fetch(`${this.baseUrl}/deals?api_token=${this.apiKey}&limit=500`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error('Failed to fetch deals');
    const deals = data.data || [];
    const byStage = {};
    for (const stage of stages) byStage[stage.id] = [];
    for (const deal of deals) {
      if (byStage[deal.stage_id]) byStage[deal.stage_id].push(deal);
    }
    return { byStage, total: deals.length };
  }

  /**
   * Suggest next action for a deal based on stage and data
   */
  suggestNextAction(deal) {
    const stageId = deal.stage_id;
    // Example logic (customize for your workflow)
    if (stageId === 1) return 'Schedule initial call';
    if (stageId === 2) return 'Send estimate';
    if (stageId === 3) return 'Follow up for approval';
    if (stageId === 4) return 'Schedule installation';
    if (stageId === 5) return 'Request payment';
    return 'Review deal status';
  }
}

// Example: Run metadata sync at startup
(async () => {
  try {
    const pd = new PipedriveService();
    const metadata = await pd.syncMetadata();
    console.log('Pipedrive metadata synced! Available keys:');
    console.log(Object.keys(metadata));
    // Optionally, save to disk for inspection
    const fs = require('fs');
    fs.writeFileSync(
      require('path').join(__dirname, '../pipedrive-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    console.log('Metadata saved to pipedrive-metadata.json');
  } catch (err) {
    console.error('Metadata sync failed:', err);
  }
})();
