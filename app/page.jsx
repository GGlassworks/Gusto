"use client"

import GlazeWidget from "@/components/GlazeWidget"

export default function Home() {
  return (
    <div className="min-h-screen bg-white opacity-100 backdrop-filter-none">
      {/* Clean, minimal page with just the chat widget */}
      <GlazeWidget />
    </div>
  )
}
