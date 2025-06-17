"use client"

import GlazeChat from "@/components/GlazeChat"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* The GlazeChat component will now be rendered directly as the content of the iframe */}
      <GlazeChat />
    </div>
  )
}
