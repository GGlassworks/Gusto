"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Send, MessageCircle, Shield, Clock, Phone, Calendar } from "lucide-react"

interface LeadData {
  name?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  serviceType?: string
  notes?: string
  soNumber?: string
}

export default function GlazeChat() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi there! 👋 Welcome to Glaze Glassworks. I'm Gusto — here to help with all your glass service needs.",
    },
    {
      sender: "bot",
      text: "I've assigned you inquiry number S.O#[GENERATING] for tracking. Let's get started! What type of glass project are you considering today? 🏁",
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [leadData, setLeadData] = useState<LeadData>({})
  const [leadSaved, setLeadSaved] = useState(false)
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [verificationData, setVerificationData] = useState<LeadData>({})
  const [messageCount, setMessageCount] = useState(0)
  const [showCallbackButton, setShowCallbackButton] = useState(false)

  // Add ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  // Track message count for auto-submission
  useEffect(() => {
    setMessageCount(messages.length)
  }, [messages])

  const handleCallbackRequest = () => {
    // Pre-populate the verification form with extracted data
    const extractedData = extractLeadInfo(messages.map((m) => m.text).join(" "))
    console.log("Pre-populating verification form with:", extractedData)

    setVerificationData({
      firstName: extractedData.firstName || "",
      lastName: extractedData.lastName || "",
      phone: extractedData.phone || "",
      email: extractedData.email || "",
      address: extractedData.address || "",
      serviceType: extractedData.serviceType || "",
    })
    setShowVerificationForm(true)
    setShowCallbackButton(false)
  }

  // Enhanced lead info extraction function
  const extractLeadInfo = (conversation: string) => {
    const data: LeadData = {}
    console.log("🔍 Extracting lead info from:", conversation.substring(0, 200) + "...")

    // Enhanced email extraction
    const emailPatterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      /(?:email|e-mail|mail|contact)(?:\s+is|\s+address)?:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/i,
      /([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/g,
    ]

    for (const pattern of emailPatterns) {
      const emailMatch = conversation.match(pattern)
      if (emailMatch) {
        const email = Array.isArray(emailMatch) && emailMatch.length > 1 ? emailMatch[1] : emailMatch[0]
        if (email && email.includes("@")) {
          data.email = email
          console.log("✅ EMAIL FOUND:", data.email)
          break
        }
      }
    }

    // Enhanced phone extraction
    const phonePatterns = [
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
      /$$\d{3}$$[-.\s]?\d{3}[-.\s]?\d{4}/g,
      /\d{10}/g,
      /(?:phone|number|cell|mobile|tel)(?:\s+is)?:?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
    ]

    for (const pattern of phonePatterns) {
      const phoneMatch = conversation.match(pattern)
      if (phoneMatch) {
        const phone = Array.isArray(phoneMatch) && phoneMatch.length > 1 ? phoneMatch[1] : phoneMatch[0]
        const cleanPhone = phone.replace(/[^\d]/g, "")
        if (cleanPhone.length === 10) {
          data.phone = cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
          console.log("✅ PHONE FOUND:", data.phone)
          break
        }
      }
    }

    // GREATLY IMPROVED name extraction - much more flexible patterns
    const explicitNamePatterns = [
      /(?:my name is|i'm|i am|this is|name's|call me|i go by)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+([a-zA-Z]+)/i,
      /(?:hi|hello),?\s+(?:my name is|i'm|this is)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+([a-zA-Z]+)/i,
      /([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+([a-zA-Z]+)(?:\s+here|\s+calling|\s+speaking)/i,
      /(?:i'm|this is)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+([a-zA-Z]+)/i,
      /(?:first name|firstname)[:\s]+([a-zA-Z]+)/i,
      /(?:last name|lastname)[:\s]+([a-zA-Z]+)/i,
      /(?:name)[:\s]+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+([a-zA-Z]+)/i,
    ]

    // Try each explicit pattern first
    for (const pattern of explicitNamePatterns) {
      const nameMatch = conversation.match(pattern)
      if (nameMatch && nameMatch.length > 2) {
        const firstName = nameMatch[1].trim()
        const lastName = nameMatch[2].trim()

        // Skip common words that might match the pattern
        const commonWords = [
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
          !commonWords.includes(firstName.toLowerCase()) &&
          !commonWords.includes(lastName.toLowerCase()) &&
          firstName.length >= 2 &&
          lastName.length >= 2
        ) {
          // Capitalize first letter of each name for consistency
          data.firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase()
          data.lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()
          data.name = `${data.firstName} ${data.lastName}`
          console.log("✅ NAME FOUND (explicit pattern):", data.name)
          break
        }
      }
    }

    // Enhanced address extraction
    const addressPatterns = [
      /(?:address|live|located|project)(?:\s+is|\s+at)?:?\s*([0-9]+\s+[A-Za-z0-9\s,.-]+)/i,
      /([0-9]+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|place|pl))/i,
      /(?:at|on)\s+([0-9]+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|way|court|ct|place|pl))/i,
    ]

    for (const pattern of addressPatterns) {
      const addressMatch = conversation.match(pattern)
      if (addressMatch) {
        data.address = addressMatch[1] || addressMatch[0]
        console.log("✅ ADDRESS FOUND:", data.address)
        break
      }
    }

    // Service type extraction with more context
    const text = conversation.toLowerCase()

    // Check for specific service mentions with context
    if (
      text.includes("shower") ||
      text.includes("enclosure") ||
      text.includes("bathroom glass") ||
      (text.includes("tub") && text.includes("glass"))
    ) {
      data.serviceType = "Shower Enclosures"
    } else if (text.includes("mirror") || text.includes("reflection") || text.includes("vanity")) {
      data.serviceType = "Mirrors"
    } else if (text.includes("window") || text.includes("pane") || text.includes("view")) {
      data.serviceType = "Windows"
    } else if (text.includes("door") || text.includes("entrance") || text.includes("sliding")) {
      data.serviceType = "Glass Doors"
    } else if (text.includes("wine room") || text.includes("wine cellar") || text.includes("wine storage")) {
      data.serviceType = "Wine Rooms"
    } else if (text.includes("smart glass") || text.includes("switchable") || text.includes("privacy glass")) {
      data.serviceType = "Smart Glass"
    } else if (text.includes("partition") || text.includes("office") || text.includes("divider")) {
      data.serviceType = "Office Partitions"
    } else {
      data.serviceType = "General Glass Services"
    }

    console.log("🎯 FINAL EXTRACTED DATA:", data)
    return data
  }

  const hasVitalContactInfo = (leadData: LeadData) => {
    const hasFirstName = !!leadData.firstName?.trim()
    const hasLastName = !!leadData.lastName?.trim()
    const hasContact = !!(leadData.email?.trim() || leadData.phone?.trim())

    console.log("🎯 Vital contact info check:", {
      firstName: leadData.firstName || "MISSING",
      lastName: leadData.lastName || "MISSING",
      email: leadData.email || "MISSING",
      phone: leadData.phone || "MISSING",
      hasFirstName,
      hasLastName,
      hasContact,
      hasVitalInfo: hasFirstName && hasLastName && hasContact,
    })

    return hasFirstName && hasLastName && hasContact
  }

  // Generate S.O# when component mounts
  useEffect(() => {
    const generateSONumber = async () => {
      try {
        // Simulate S.O# generation
        const soNumber = `S.O#${Math.floor(Math.random() * 900) + 100}`

        // Update the second message with the actual S.O#
        setMessages((prev) =>
          prev.map((msg, index) =>
            index === 1 ? { ...msg, text: msg.text.replace("S.O#[GENERATING]", soNumber) } : msg,
          ),
        )

        // Store S.O# for later use
        setLeadData((prev) => ({ ...prev, soNumber }))
      } catch (error) {
        console.error("Failed to generate S.O#:", error)
      }
    }

    generateSONumber()
  }, [])

  const sendMessage = async () => {
    if (!input.trim()) return
    const userMsg = { sender: "user", text: input }
    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    // Extract and update lead information
    const conversationText = updatedMessages.map((m) => m.text).join(" ")
    const extractedData = extractLeadInfo(conversationText)
    setLeadData(extractedData)

    setInput("")
    setLoading(true)

    try {
      // Simulate AI response with enhanced capabilities
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))

      let botReply = ""
      const userText = input.toLowerCase()

      // Enhanced response logic based on our benchmark improvements
      if (userText.includes("shower") || userText.includes("enclosure")) {
        botReply =
          "Oh wonderful! Shower enclosures are one of my absolute favorite projects! 🚿 We create stunning frameless, semi-frameless, and framed solutions that completely transform bathrooms. Are you looking for a specific style, and what's the approximate size of your shower space?"
      } else if (userText.includes("mirror")) {
        botReply =
          "Mirrors are such a fantastic way to brighten and open up any space! ✨ We specialize in custom mirrors for bathrooms, bedrooms, gyms, and commercial spaces. What type of mirror project do you have in mind, and where will it be installed?"
      } else if (userText.includes("wine")) {
        botReply =
          "Oh my goodness, wine rooms are absolutely one of our most exciting specialties! 🍷 We create breathtaking temperature-controlled glass enclosures that beautifully showcase collections. Tell me about your wine storage vision and the space you're working with!"
      } else if (userText.includes("smart glass") || userText.includes("switchable")) {
        botReply =
          "Smart glass technology is absolutely fascinating! 🤖 Our switchable privacy glass goes from crystal clear to completely opaque instantly. Perfect for offices, bathrooms, or conference rooms. What application are you considering?"
      } else if (userText.includes("my name is") || userText.includes("i'm ") || userText.includes("i am ")) {
        const nameMatch = userText.match(/(?:my name is|i'm|i am)\s+([a-zA-Z]+)\s+([a-zA-Z]+)/i)
        if (nameMatch) {
          const firstName = nameMatch[1]
          botReply = `Great to meet you, ${firstName}! 😊 I'm excited to help with your glass project. What's the best phone number or email to reach you at so our specialist can follow up with detailed information?`
        } else {
          botReply =
            "Thank you for sharing! To provide you with the most accurate information and pricing, could I get your full name and the best way to contact you?"
        }
      } else if (userText.includes("@") || userText.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)) {
        botReply =
          "Perfect! I have your contact information. Now, where will this beautiful glass project be located? Having the address helps our team provide the most accurate estimate and timeline."
      } else if (userText.includes("estimate") || userText.includes("quote") || userText.includes("price")) {
        botReply =
          "I'm so excited to help you get pricing! 💰 We provide completely free, no-obligation estimates. Our pricing depends on the specific glass type, dimensions, and installation complexity. To give you the most accurate quote, I'll need a few details about your project and contact information."
      } else if (userText.includes("timeline") || userText.includes("how long")) {
        botReply =
          "Great question about timing! ⏰ Our typical timeline is 2-3 weeks from measurement to installation, though it can vary based on the project complexity and current schedule. Custom pieces may take a bit longer. What's your ideal timeline for completion?"
      } else if (!extractedData.firstName || !extractedData.lastName) {
        botReply =
          "I'm absolutely thrilled to help with your glass project! 🌟 To provide you with the best recommendations and pricing, could I get your name? This helps me personalize our conversation and ensure our specialist can follow up properly."
      } else if (!extractedData.phone && !extractedData.email) {
        botReply = `Thanks ${extractedData.firstName}! What's the best phone number or email to reach you at? This ensures our glass specialist can contact you with detailed information and schedule your free estimate.`
      } else if (!extractedData.address) {
        botReply =
          "Excellent! Now, where will this project be located? Having the address helps our team provide accurate pricing and coordinate the installation timeline."
      } else {
        botReply = `Perfect! I have all the information I need, ${extractedData.firstName}! 🎉 Based on our conversation about ${extractedData.serviceType}, I'll have one of our glass specialists contact you shortly to schedule your free estimate. They'll provide detailed pricing and answer any technical questions you might have!`
        setShowCallbackButton(true)
      }

      const finalMessages = [...updatedMessages, { sender: "bot", text: botReply }]
      setMessages(finalMessages)

      // Check if we should show CTA
      if (hasVitalContactInfo(extractedData) && messageCount >= 6) {
        setShowCallbackButton(true)
      }
    } catch (error) {
      console.error("Chat error:", error)
      setMessages((prev) => [...prev, { sender: "bot", text: "Sorry, there was an issue getting a response." }])
    } finally {
      setLoading(false)
    }
  }

  // Monitor for vital contact info to show CTA button
  useEffect(() => {
    const extractedData = extractLeadInfo(messages.map((m) => m.text).join(" "))

    if (
      hasVitalContactInfo(extractedData) &&
      messageCount >= 6 &&
      !showVerificationForm &&
      !leadSaved &&
      !showCallbackButton
    ) {
      console.log("🎯 Vital contact info detected - showing CTA button!")
      setShowCallbackButton(true)
    }
  }, [messageCount, showVerificationForm, leadSaved, showCallbackButton])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleScheduleEstimate = async () => {
    // IMPROVED validation
    if (!verificationData.firstName?.trim() || !verificationData.lastName?.trim()) {
      alert("Please enter your first and last name.")
      return
    }

    if (!verificationData.phone?.trim() && !verificationData.email?.trim()) {
      alert("Please enter either a phone number or email address.")
      return
    }

    try {
      console.log("🚨 Submitting lead:", verificationData)

      // Simulate successful submission
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setLeadSaved(true)
      setShowVerificationForm(false)
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `🎉 Perfect! Thank you, ${verificationData.firstName}! Your information has been submitted and our glass specialist will call you within the next 10 minutes to schedule your free estimate. Please keep your phone nearby! 📞`,
        },
      ])
    } catch (error) {
      console.error("Lead submission error:", error)
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I apologize, but there was an issue submitting your information. Please try again or call us directly at your convenience.",
        },
      ])
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header with Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-6">
            <Image
              src="/glaze-logo.png"
              alt="Glaze Glassworks Logo"
              width={300}
              height={120}
              className="h-20 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Expert Glass Installation & Services</h1>
          <p className="text-slate-600">Get instant help with your glass project needs</p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          className="flex justify-center gap-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Shield className="w-4 h-4 text-green-600" />
            <span>Fully Licensed</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Free Estimates</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MessageCircle className="w-4 h-4 text-purple-600" />
            <span>Expert Advice</span>
          </div>
        </motion.div>

        {/* Chat Interface */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-6 rounded-t-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="font-semibold text-lg">Chat with Our Glass Experts</h3>
                    <p className="text-slate-300 text-sm">
                      <Shield className="w-3 h-3 inline mr-1" />
                      Your privacy is protected - we never share your information
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-6 bg-gradient-to-b from-slate-50 to-white">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      className={`mb-4 flex ${msg.sender === "bot" ? "justify-start" : "justify-end"}`}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                          msg.sender === "bot"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                            : "bg-gradient-to-r from-slate-600 to-slate-700 text-white"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg?.text ?? "Message unavailable."}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div className="flex justify-start mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-2xl shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-white rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-sm">Gusto is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Auto-scroll target */}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-white border-t border-slate-200">
                <div className="flex gap-3">
                  <Input
                    placeholder="Ask about glass installation, pricing, or services..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-base"
                    disabled={loading}
                  />
                  <Button
                    onClick={sendMessage}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 shadow-lg"
                    disabled={loading || !input.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Powered by AI • Responses typically within seconds
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Callback Button - Show when we have vital contact info */}
        {showCallbackButton && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <Phone className="w-5 h-5" />
                    <Calendar className="w-5 h-5" />
                  </div>
                  {leadData.firstName && (
                    <p className="text-sm text-slate-700 text-center font-medium">
                      🚨 {leadData.firstName}, ready to get your FREE estimate? Our specialist can call you in the next
                      10 minutes!
                    </p>
                  )}
                  {!leadData.firstName && (
                    <p className="text-sm text-slate-700 text-center font-medium">
                      🚨 Ready to get your FREE estimate? Our specialist can call you in the next 10 minutes!
                    </p>
                  )}
                  <Button
                    onClick={handleCallbackRequest}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-2 animate-pulse"
                  >
                    🚨 Get Immediate Callback!
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    ⏰ Limited availability - Act now for priority scheduling!
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Verification Form */}
        {showVerificationForm && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm border-orange-200">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Phone className="w-6 h-6 text-orange-600" />
                    <h3 className="text-xl font-semibold text-slate-800">🚨 Immediate Callback Request</h3>
                  </div>
                  <p className="text-slate-600">
                    Verify your details below and our specialist will call you within 10 minutes!
                  </p>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                    <p className="text-sm text-orange-700 font-medium">
                      ⏰ Priority scheduling available now - Limited time offer!
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                      <Input
                        value={verificationData.firstName || ""}
                        onChange={(e) => setVerificationData((prev) => ({ ...prev, firstName: e.target.value }))}
                        placeholder="Enter first name"
                        className="border-slate-300 focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                      <Input
                        value={verificationData.lastName || ""}
                        onChange={(e) => setVerificationData((prev) => ({ ...prev, lastName: e.target.value }))}
                        placeholder="Enter last name"
                        className="border-slate-300 focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number 📞</label>
                    <Input
                      value={verificationData.phone || ""}
                      onChange={(e) => setVerificationData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="(555) 123-4567"
                      className="border-slate-300 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <Input
                      value={verificationData.email || ""}
                      onChange={(e) => setVerificationData((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      className="border-slate-300 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Project Address</label>
                    <Input
                      value={verificationData.address || ""}
                      onChange={(e) => setVerificationData((prev) => ({ ...prev, address: e.target.value }))}
                      placeholder="1234 Main St, City, State, ZIP"
                      className="border-slate-300 focus:border-orange-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleScheduleEstimate}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 text-lg font-semibold animate-pulse"
                      disabled={
                        !verificationData.firstName?.trim() ||
                        !verificationData.lastName?.trim() ||
                        (!verificationData.phone?.trim() && !verificationData.email?.trim())
                      }
                    >
                      🚨 Call Me in 10 Minutes! 📞
                    </Button>
                    <Button
                      onClick={() => setShowVerificationForm(false)}
                      variant="outline"
                      className="px-6 border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          className="text-center mt-8 text-sm text-slate-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <p>© 2024 Glaze Glassworks. Professional glass installation and services.</p>
        </motion.div>
      </div>
    </div>
  )
}
