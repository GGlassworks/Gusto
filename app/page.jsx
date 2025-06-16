import GlazeChatPreview from "@/components/GlazeChatPreview" // Import the new preview component

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative">
      {/* Your existing website content goes here */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-4">Welcome to Your Website</h1>
          <p className="text-xl text-slate-600 mb-8">This is a preview of your Glaze Glassworks AI Chat!</p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Demo Content</h2>
            <p className="text-slate-600 mb-4">
              This is your main website content. Below, you'll find the Glaze Glassworks chat interface, ready for
              testing.
            </p>
            <p className="text-slate-600">Interact with Gusto directly here!</p>
          </div>
        </div>
      </div>

      {/* Chat Widget - Direct placement for preview */}
      <GlazeChatPreview />
    </main>
  )
}
