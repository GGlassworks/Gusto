"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Send, Mic, StopCircle, MessageCircle, X, Minimize2 } from "lucide-react"
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
  const [isVisible, setIsVisible] = useState(false)
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

  const audioRef = useRef(null)
  const spokenMessageIds = useRef(new Set())
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  // ✅ 5-second delay before showing widget
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
      console.log("🎯 Chat widget now visible after 5-second delay")
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

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

  // ✅ NEW: Deepgram Real-time Speech Recognition
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

  const startDeepgramRecording = async () => {
    try {
      console.log("🎙️ Starting Deepgram real-time recording...")
      setIsListening(true)
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      audioChunksRef.current = []
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        console.log("🎙️ Recording stopped, processing with Deepgram...")

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm;codecs=opus" })

        if (audioBlob.size === 0) {
          console.warn("No audio data recorded")
          setError("No audio detected. Please try again.")
          setIsListening(false)
          return
        }

        try {
          const formData = new FormData()
          formData.append("audio", audioBlob, "recording.webm")

          const response = await fetch("/api/speech-to-text", {
            method: "POST",
            body: formData,
          })

          const result = await response.json()
          console.log("🗣️ Deepgram STT result:", result)

          if (result.success && result.transcript) {
            setInput(result.transcript)
            console.log(`✅ Transcribed: "${result.transcript}" (confidence: ${result.confidence})`)
          } else {
            setError("Could not understand speech. Please try again or type your message.")
          }
        } catch (error) {
          console.error("STT processing error:", error)
          setError("Speech recognition failed. Please try again.")
        }

        // Clean up
        stream.getTracks().forEach((track) => track.stop())
        setIsListening(false)
      }

      mediaRecorderRef.current.start()
      console.log("🎙️ Recording started with Deepgram STT")
    } catch (error) {
      console.error("🎙️ Microphone access error:", error)
      setIsListening(false)

      if (error.name === "NotAllowedError") {
        setError("Microphone access denied. Please enable microphone permissions and try again.")
      } else if (error.name === "NotFoundError") {
        setError("No microphone found. Please check your audio devices.")
      } else {
        setError("Could not access microphone. Please try again.")
      }
    }
  }

  const stopDeepgramRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("🛑 Stopping Deepgram recording...")
      mediaRecorderRef.current.stop()
    }
  }

  const toggleSpeechRecognition = () => {
    if (isListening) {
      stopDeepgramRecording()
    } else {
      setInput("") // Clear input before starting
      startDeepgramRecording()
    }
  }

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

  // Don't render anything until the 5-second delay is complete
  if (!isVisible) {
    return null
  }

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-[9999]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <div className="relative">
              <Button
                onClick={() => {
                  console.log("🎯 Chat button clicked!")
                  setIsOpen(true)
                }}
                className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-2xl border-4 border-white/20 backdrop-blur-sm"
                size="lg"
              >
                <MessageCircle size={28} className="text-white" />
              </Button>
              {/* Pulsing ring animation */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-ping opacity-20 pointer-events-none"></div>

              {/* Attention-grabbing tooltip */}
              <motion.div
                className="absolute -top-12 right-0 bg-white text-slate-800 px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap pointer-events-none"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                💬 Need help with glass services?
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Widget Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-[9998]"
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 100 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            <Card
              className={`shadow-2xl border-0 bg-white/95 backdrop-blur-md ${isMinimized ? "w-80" : "w-96"} ${isMinimized ? "h-16" : "h-[600px]"} transition-all duration-300`}
            >
              <CardContent className="p-0 h-full flex flex-col">
                {/* Header with Logo */}
                <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white p-4 rounded-t-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <Image src="/glaze-logo.png" alt="Glaze Glassworks" fill className="object-contain" priority />
                    </div>
                    <div className={`${isMinimized ? "hidden" : "block"}`}>
                      <h3 className="font-bold text-lg">Glaze Glassworks</h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <p className="text-slate-300 text-sm">Chat with Gusto</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isMinimized && (
                      <Button
                        variant="ghost"
                        onClick={() => setIsMuted((m) => !m)}
                        title={isMuted ? "Unmute voice" : "Mute voice"}
                        className="text-white hover:bg-slate-600 p-2"
                        size="sm"
                      >
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      onClick={() => setIsMinimized(!isMinimized)}
                      title={isMinimized ? "Expand chat" : "Minimize chat"}
                      className="text-white hover:bg-slate-600 p-2"
                      size="sm"
                    >
                      <Minimize2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsOpen(false)}
                      title="Close chat"
                      className="text-white hover:bg-slate-600 p-2"
                      size="sm"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>

                {/* Chat Content */}
                {!isMinimized && (
                  <>
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-white">
                      <AnimatePresence>
                        {messages
                          .filter((msg) => msg.role !== "system")
                          .map((msg, index) => (
                            <motion.div
                              key={index}
                              className={`mb-4 flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
                              initial={{ opacity: 0, y: 20, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div
                                className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm ${
                                  msg.role === "assistant"
                                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                                    : "bg-gradient-to-r from-slate-600 to-slate-700 text-white"
                                }`}
                              >
                                <p className="text-sm leading-relaxed">{msg?.content ?? "Message unavailable."}</p>
                              </div>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                      {(isLoading || isPending) && (
                        <div className="flex justify-start">
                          <div className="max-w-[70%] p-3 rounded-2xl bg-gray-200 text-gray-800">
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
                    <div className="p-4 bg-white border-t border-slate-200 rounded-b-lg">
                      {error && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-red-600 text-sm">{error}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Input
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="Type or speak your message..."
                          className="flex-1 border-slate-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                          disabled={isLoading || isListening || isPending}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSend()
                            }
                          }}
                        />
                        {/* Microphone Button */}
                        <Button
                          onClick={() => {
                            console.log("🎙️ Microphone button clicked! Current state:", {
                              isListening,
                              isLoading,
                              isPending,
                            })
                            toggleSpeechRecognition()
                          }}
                          disabled={isLoading || isPending}
                          className={`px-3 shadow-lg ${
                            isListening ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"
                          } text-white`}
                          size="sm"
                          title={isListening ? "Stop recording (Deepgram)" : "Start voice recording (Deepgram)"}
                        >
                          {isListening ? <StopCircle size={16} /> : <Mic size={16} />}
                        </Button>
                        <Button
                          onClick={() => {
                            console.log("📤 Send button clicked! Input:", input)
                            handleSend()
                          }}
                          disabled={isLoading || isListening || isPending}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 shadow-lg"
                          size="sm"
                        >
                          <Send size={16} />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2 text-center">
                        Powered by AI & Deepgram STT • Your privacy is protected
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
        "Hi there! 👋 I'm Gusto, your glass guide at Glaze Glassworks! Whether you're looking for shower enclosures, custom mirrors, smart glass, or any glass installation - I'm here to help gather your details and get you connected with our expert team. Ready to get started?",
    },
  ],
  es: [
    {
      role: "assistant",
      content: "¡Hola! 👋 Soy Gusto, tu experto personal en vidrio aquí en Glaze Glassworks! ¿Cómo puedo ayudarte hoy?",
    },
  ],
}
