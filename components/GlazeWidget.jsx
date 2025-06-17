"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Send, Mic, StopCircle, MessageCircle, X, Minimize2, Maximize2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { submitToPipedrive } from "@/app/actions/submitToPipedrive"
import Image from "next/image"

function processTextForSpeech(text) {
  return text
    .replace(/Gusto/gi, "Gus-toh")
    .replace(/([.?!])\s*/g, "$1\n")
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/[^\w\s.,!?'"-]/g, "")
    .trim()
}

export default function GlazeWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [language, setLanguage] = useState("en")
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [leadData, setLeadData] = useState({})
  const [conversationStage, setConversationStage] = useState("greeting")
  const [isListening, setIsListening] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [hasAutoOpened, setHasAutoOpened] = useState(false)
  const [hasAppearedOnce, setHasAppearedOnce] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const audioRef = useRef(null)
  const spokenMessageIds = useRef(new Set())
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)
  const containerRef = useRef(null)

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // ✅ 5-second delay before showing widget, 10-second auto-open
  useEffect(() => {
    const visibilityTimer = setTimeout(() => {
      setHasAppearedOnce(true)
      console.log("🎯 Chat widget button now visible after 5-second delay")
    }, 5000)

    const autoOpenTimer = setTimeout(() => {
      if (!isOpen && !hasAutoOpened) {
        setIsOpen(true)
        setHasAutoOpened(true)
        console.log("🤖 Auto-opening chat after 10 seconds")
      }
    }, 10000)

    return () => {
      clearTimeout(visibilityTimer)
      clearTimeout(autoOpenTimer)
    }
  }, [isOpen, hasAutoOpened])

  // ✅ Enhanced email validation function
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  // ✅ Enhanced streaming chunk handler
  const handleStreamChunk = (data) => {
    if (data === "[DONE]") return
    try {
      const json = JSON.parse(data)
      const deltaContent = json.choices[0]?.delta?.content
      return deltaContent || ""
    } catch (err) {
      console.warn("Invalid JSON chunk skipped:", data)
      return ""
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = language

      recognitionRef.current.onstart = () => {
        setIsListening(true)
        console.log("🎙️ Speech recognition started.")
      }

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setInput(transcript)
        console.log("🗣️ Recognized speech:", transcript)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
        console.log("🎙️ Speech recognition ended.")
      }

      recognitionRef.current.onerror = (event) => {
        console.error("🎙️ Speech recognition error:", event.error)
        setIsListening(false)
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          alert("Microphone access denied. Please enable it in your browser settings to use voice input.")
        } else if (event.error === "no-speech") {
          if (!input.trim()) setInput("")
        }
      }
    } else {
      console.warn("Speech Recognition API not supported in this browser.")
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [language, input])

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userLang = navigator.language.split("-")[0]
      const supportedLang = initialMessagesDict[userLang] ? userLang : "en"
      setLanguage(supportedLang)

      const generateAndSetInitialMessages = async () => {
        try {
          console.log("🚀 Starting initial message setup...")
          const greetingMessage = { ...initialMessagesDict[supportedLang][0], id: Date.now() + Math.random() }
          console.log("📝 Setting greeting message:", greetingMessage.content.substring(0, 50) + "...")
          setMessages([greetingMessage])
          await playTTS(greetingMessage)
          console.log("✅ Initial setup complete")
        } catch (error) {
          console.error("Failed to setup initial messages:", error)
          const initialMsg = { ...initialMessagesDict[supportedLang][0], id: Date.now() + Math.random() }
          setMessages([initialMsg])
          playTTS(initialMsg)
        }
      }
      generateAndSetInitialMessages()
    }
  }, [isOpen])

  const playTTS = async (message) => {
    if (!message || isMuted) return
    if (spokenMessageIds.current.has(message.id)) {
      console.log("🛑 Skipping duplicate TTS playback for message ID:", message.id)
      return
    }

    try {
      const cleaned = processTextForSpeech(message.content)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned }),
      })

      if (!res.ok) throw new Error("TTS error")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      audio.play()
      spokenMessageIds.current.add(message.id)
    } catch (err) {
      console.error("🔊 Playback error:", err)
    }
  }

  const toggleSpeechRecognition = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop()
      } else {
        setInput("")
        recognitionRef.current.start()
      }
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: "user", content: input.trim(), id: Date.now() + Math.random() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)
    setError(null)

    let botResponseContent = ""
    let nextConversationStage = conversationStage
    let systemPrompt = ""
    const currentLeadData = { ...leadData }

    const extractAndFormatName = (text) => {
      const words = text.trim().split(/\s+/)
      let name = ""
      if (words.length > 0) {
        name = words[words.length - 1]
      }
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    }

    // Handle data collection based on current stage
    switch (conversationStage) {
      case "greeting":
        botResponseContent =
          "Fantastic! To kick things off and make sure I'm helping you perfectly, could you share your first name with me?"
        nextConversationStage = "firstName"
        break
      case "firstName":
        currentLeadData.firstName = extractAndFormatName(input)
        setLeadData(currentLeadData)
        systemPrompt = `You are Gusto, a very upbeat, friendly, and helpful AI assistant for Glaze Glassworks. Your primary goal is to collect customer information to create a lead for glass installation or service. You need to ask for one piece of information at a time, clearly and politely.
        The customer has just provided their first name: ${currentLeadData.firstName}.
        Your next task is to ask for their last name. Be appreciative and enthusiastic. Keep your response concise.`
        nextConversationStage = "lastName"
        break
      case "lastName":
        currentLeadData.lastName = extractAndFormatName(input)
        setLeadData(currentLeadData)
        systemPrompt = `You are Gusto, a very upbeat, friendly, and helpful AI assistant for Glaze Glassworks. Your primary goal is to collect customer information to create a lead for glass installation or service. You need to ask for one piece of information at a time, clearly and politely.
        The customer has just provided their last name: ${currentLeadData.lastName}.
        Your next task is to ask for details about their specific glass needs. Encourage them to provide details like the type of project (e.g., shower enclosure, custom mirrors, window repairs, glass doors, wine rooms, smart glass, office partitions), dimensions, glass type (clear, frosted, textured), or frame preferences. Be enthusiastic and helpful. Keep your response concise.`
        nextConversationStage = "notes"
        break
      case "notes":
        currentLeadData.notes = input.trim()
        setLeadData(currentLeadData)
        systemPrompt = `You are Gusto, a very upbeat, friendly, and helpful AI assistant for Glaze Glassworks. Your primary goal is to collect customer information to create a lead for glass installation or service. You need to ask for one piece of information at a time, clearly and politely.
        The customer has just provided details about their glass needs.
        Your next task is to ask for the best phone number for our team to reach out to them. Be appreciative and enthusiastic. Keep your response concise.`
        nextConversationStage = "phone"
        break
      case "phone":
        currentLeadData.phone = input.trim()
        setLeadData(currentLeadData)
        systemPrompt = `You are Gusto, a very upbeat, friendly, and helpful AI assistant for Glaze Glassworks. Your primary goal is to collect customer information to create a lead for glass installation or service. You need to ask for one piece of information at a time, clearly and politely.
        The customer has just provided their phone number.
        Your next task is to ask for their email address. Explain that this helps send important updates. Be appreciative and enthusiastic. Keep your response concise.`
        nextConversationStage = "email"
        break
      case "email":
        const emailInput = input.trim()
        if (!isValidEmail(emailInput)) {
          setError("Please enter a valid email address (e.g., john@example.com)")
          setIsLoading(false)
          return
        }
        currentLeadData.email = emailInput
        setLeadData(currentLeadData)
        systemPrompt = `You are Gusto, a very upbeat, friendly, and helpful AI assistant for Glaze Glassworks. Your primary goal is to collect customer information to create a lead for glass installation or service. You need to ask for one piece of information at a time, clearly and politely.
        The customer has just provided their email address.
        Your next task is to ask for the physical address for the job location. Explain that this helps plan everything perfectly. Be appreciative and enthusiastic. Keep your response concise.`
        nextConversationStage = "address"
        break
      case "address":
        currentLeadData.address = input.trim()
        setLeadData(currentLeadData)
        systemPrompt = `You are Gusto, a very upbeat, friendly, and helpful AI assistant for Glaze Glassworks. All required customer information (first name, last name, glass needs, phone, email, address) has been collected.
        Your final task is to confirm that all details are gathered and inform the customer that a specialist team will be in touch very soon to discuss everything. Be absolutely fantastic and enthusiastic! Keep your response concise. Do not mention any order numbers as the CRM will handle that.`
        nextConversationStage = "complete"
        break
      case "complete":
        systemPrompt = `You are Gusto, a very upbeat, friendly, and helpful AI assistant for Glaze Glassworks. The lead generation process is complete.
        Your task now is to offer further assistance if they have any more questions, maintaining your helpful and friendly persona. Keep your response concise.`
        nextConversationStage = "complete"
        break
      default:
        systemPrompt = `You are Gusto, a very upbeat, friendly, and helpful AI assistant for Glaze Glassworks. Your primary goal is to collect customer information to create a lead.
        It seems there might have been a misunderstanding. Please gently guide the user back to the current information needed. Keep your response concise.`
        nextConversationStage = "greeting"
    }

    // Only send to AI if not in the initial 'greeting' stage (which is hardcoded)
    if (conversationStage !== "greeting") {
      const messagesForAI = [{ role: "system", content: systemPrompt }, ...newMessages]

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesForAI }),
        })

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedContent = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n").filter((line) => line.trim() !== "")
          for (const line of lines) {
            if (line.startsWith("data:")) {
              const jsonStr = line.substring(5)
              const deltaContent = handleStreamChunk(jsonStr)
              if (deltaContent) {
                accumulatedContent += deltaContent
              }
            }
          }
        }

        botResponseContent = accumulatedContent.trim()
        if (!botResponseContent) {
          botResponseContent = "I'm sorry, I couldn't generate a response. Could you please try again?"
        }
      } catch (error) {
        console.error("Error fetching AI response:", error)
        botResponseContent = "Oops! I'm having a little trouble connecting right now. Please try again in a moment!"
      }
    }

    setConversationStage(nextConversationStage)
    const botMessage = { role: "assistant", content: botResponseContent, id: Date.now() + Math.random() }
    setMessages((prev) => [...prev, botMessage])
    setIsLoading(false)
    await playTTS(botMessage)

    // Handle submission when complete
    if (nextConversationStage === "complete" && Object.keys(currentLeadData).length > 0 && !hasSubmitted) {
      startTransition(async () => {
        try {
          if (hasSubmitted) return
          setHasSubmitted(true)
          console.log("🚀 Submitting complete lead data...")

          const comprehensiveNotes = `WEBSITE CHAT LEAD - ${new Date().toLocaleString()}

CUSTOMER INFORMATION:
- Full Name: ${currentLeadData.firstName} ${currentLeadData.lastName}
- First Name: ${currentLeadData.firstName}
- Last Name: ${currentLeadData.lastName}
- Email: ${currentLeadData.email || "Not provided"}
- Phone: ${currentLeadData.phone || "Not provided"}  
- Address: ${currentLeadData.address || "Not provided"}
- Service Interest: Glass Services

CONVERSATION DETAILS:
${currentLeadData.notes || "No conversation notes available"}

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

          const leadInfo = {
            fullName: `${currentLeadData.firstName} ${currentLeadData.lastName}`,
            phone: currentLeadData.phone || "",
            email: currentLeadData.email || "",
            address: currentLeadData.address || "",
            notes: comprehensiveNotes,
          }

          console.log("📤 Submitting to Pipedrive:", leadInfo.fullName)
          const result = await submitToPipedrive(leadInfo)
          console.log("📬 Server Action Result:", result)

          if (result.success) {
            console.log("✅ Submission successful!")
            const updatedBotMessage = {
              role: "assistant",
              content:
                botResponseContent +
                `\n\n✅ Perfect! I've submitted your information to our team for immediate follow-up. You should receive confirmation shortly!`,
              id: Date.now() + Math.random(),
            }
            setMessages((prev) => [...prev.slice(0, -1), updatedBotMessage])
          } else {
            console.error("❌ Server Action failed:", result.error)
            setHasSubmitted(false)
            setError("There was an issue submitting your information. Please try again.")
          }
        } catch (error) {
          console.error("❌ Failed to submit:", error)
          setHasSubmitted(false)
          setError("There was an issue submitting your information. Please try again.")
        }
      })
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
    // Reset chat state
    setMessages([])
    setConversationStage("greeting")
    setLeadData({})
    setHasSubmitted(false)
    setError(null)
  }

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <>
      {/* Transparent Container with Parallax - Back Layer */}
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none z-40"
        style={{
          background: "transparent",
          transform: `translateY(${scrollY * 0.1}px)`,
        }}
      />

      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && hasAppearedOnce && (
          <motion.div
            className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 pointer-events-auto"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
              transform: `translateY(${scrollY * -0.05}px)`,
              opacity: 1,
            }}
          >
            <Button
              onClick={() => {
                console.log("🎯 Chat button clicked!")
                setIsOpen(true)
                setHasAutoOpened(true)
              }}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl border-4 border-white/20 backdrop-blur-sm"
              style={{ opacity: 1 }}
            >
              <MessageCircle size={20} className="text-white md:w-6 md:h-6" />
            </Button>
            {/* Pulsing ring animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-ping opacity-20"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed z-50 pointer-events-auto transition-all duration-300 ${
              isMinimized
                ? "bottom-4 right-4 w-80 h-16 md:bottom-6 md:right-6"
                : "bottom-4 right-4 w-[95vw] h-[85vh] md:bottom-6 md:right-6 md:w-96 md:h-[600px]"
            }`}
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
              transform: `translateY(${scrollY * -0.03}px)`,
              opacity: 1,
            }}
          >
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md h-full" style={{ opacity: 1 }}>
              <CardContent className="p-0 h-full flex flex-col" style={{ opacity: 1 }}>
                {/* Header with Logo */}
                <div
                  className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white p-3 md:p-4 rounded-t-lg flex items-center justify-between"
                  style={{ opacity: 1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0">
                      <Image src="/glaze-logo.png" alt="Glaze Glassworks" fill className="object-contain" priority />
                    </div>
                    <div className={`${isMinimized ? "hidden" : "block"}`}>
                      <h3 className="font-bold text-base md:text-lg">Glaze Glassworks</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <p className="text-slate-300 text-xs md:text-sm">Chat with Gusto</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 md:gap-2">
                    {!isMinimized && (
                      <Button
                        variant="ghost"
                        onClick={() => setIsMuted((m) => !m)}
                        title={isMuted ? "Unmute voice" : "Mute voice"}
                        className="text-white hover:bg-slate-600 p-1 md:p-2"
                        style={{ opacity: 1 }}
                      >
                        {isMuted ? (
                          <VolumeX size={14} className="md:w-4 md:h-4" />
                        ) : (
                          <Volume2 size={14} className="md:w-4 md:h-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={handleToggleMinimize}
                      title={isMinimized ? "Expand chat" : "Minimize chat"}
                      className="text-white hover:bg-slate-600 p-1 md:p-2"
                      style={{ opacity: 1 }}
                    >
                      {isMinimized ? (
                        <Maximize2 size={14} className="md:w-4 md:h-4" />
                      ) : (
                        <Minimize2 size={14} className="md:w-4 md:h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleClose}
                      title="Close chat"
                      className="text-white hover:bg-slate-600 p-1 md:p-2"
                      style={{ opacity: 1 }}
                    >
                      <X size={14} className="md:w-4 md:h-4" />
                    </Button>
                  </div>
                </div>

                {/* Chat Content */}
                {!isMinimized && (
                  <>
                    {/* Messages Area */}
                    <div
                      className="flex-1 overflow-y-auto p-3 md:p-4 bg-gradient-to-b from-slate-50 to-white"
                      style={{ opacity: 1 }}
                    >
                      <AnimatePresence>
                        {messages
                          .filter((msg) => msg.role !== "system")
                          .map((msg, index) => (
                            <motion.div
                              key={index}
                              className={`mb-3 md:mb-4 flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div
                                className={`max-w-[85%] px-3 md:px-4 py-2 md:py-3 rounded-2xl shadow-sm ${
                                  msg.role === "assistant"
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                    : "bg-gradient-to-r from-slate-600 to-slate-700 text-white"
                                }`}
                                style={{ opacity: 1 }}
                              >
                                <p className="text-xs md:text-sm leading-relaxed">
                                  {msg?.content ?? "Message unavailable."}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                      {(isLoading || isPending) && (
                        <div className="flex justify-start">
                          <div
                            className="max-w-[70%] p-2 md:p-3 rounded-2xl bg-gray-200 text-gray-800"
                            style={{ opacity: 1 }}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
                              {isPending && <span className="text-xs ml-2">Submitting...</span>}
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 md:p-4 bg-white border-t border-slate-200 rounded-b-lg" style={{ opacity: 1 }}>
                      {error && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg" style={{ opacity: 1 }}>
                          <p className="text-red-600 text-xs md:text-sm">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-xs md:text-sm"
                          disabled={isLoading || isListening || isPending}
                          style={{ opacity: 1 }}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSend()
                            }
                          }}
                        />
                        {recognitionRef.current && (
                          <Button
                            onClick={toggleSpeechRecognition}
                            disabled={isLoading || isPending}
                            className={`px-2 md:px-3 shadow-lg ${
                              isListening ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
                            } text-white`}
                            style={{ opacity: 1 }}
                            title={isListening ? "Stop speaking" : "Speak your message"}
                          >
                            {isListening ? (
                              <StopCircle size={14} className="md:w-4 md:h-4" />
                            ) : (
                              <Mic size={14} className="md:w-4 md:h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={handleSend}
                          disabled={isLoading || isListening || isPending}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-3 md:px-4 shadow-lg"
                          style={{ opacity: 1 }}
                        >
                          <Send size={14} className="md:w-4 md:h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-center" style={{ opacity: 1 }}>
                        Powered by AI • Your privacy is protected {isPending && "• Submitting to Pipedrive..."}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

const initialMessagesDict = {
  en: [
    {
      role: "assistant",
      content:
        "Hi there, I'm Gusto, your glass guide at Glaze Glassworks! If you're looking for answers, inspiration, or quotes — our services page is the perfect place to start. And if you're ready, I can help gather a few quick details to get things rolling!",
    },
  ],
  es: [
    {
      role: "assistant",
      content: "¡Hola! 👋 Soy Gusto, tu experto personal en vidrio aquí en Glaze Glassworks! ¿Cómo puedo ayudarte hoy?",
    },
  ],
}
