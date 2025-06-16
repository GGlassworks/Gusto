import "./globals.css";
import PortalChatWidget from "@/components/PortalChatWidget";

export const metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Portal Chat Widget - always visible */}
        <PortalChatWidget />
      </body>
    </html>
  );
}
