import React from "react";
import { motion } from "framer-motion";
import GlazeChat from "./GlazeChat";

// Portal animation using SVG and framer-motion
export default function PortalChatWidget() {
  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-center">
      {/* Animated Portal */}
      <motion.div
        className="relative flex items-center justify-center"
        initial={{ scale: 0.9, rotate: 0 }}
        animate={{ scale: [0.9, 1.05, 0.95, 1], rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        style={{ width: 420, height: 420 }}
      >
        <svg width="420" height="420" viewBox="0 0 420 420" className="absolute">
          <defs>
            <radialGradient id="portalGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#aee9f7" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.2" />
            </radialGradient>
          </defs>
          <ellipse
            cx="210"
            cy="210"
            rx="200"
            ry="200"
            fill="url(#portalGlow)"
            filter="url(#blur)"
          />
        </svg>
        {/* Swirling effect */}
        <motion.div
          className="absolute w-[340px] h-[340px] rounded-full border-8 border-blue-300/40 border-dashed"
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
        />
        {/* Chat inside portal */}
        <div className="relative z-10 w-[340px] h-[340px] flex items-center justify-center bg-white/90 rounded-full shadow-2xl overflow-hidden">
          <GlazeChat />
        </div>
      </motion.div>
      <div className="mt-4 text-center text-blue-900 font-bold text-lg drop-shadow-lg">
        Need help? Step into the portal!
      </div>
    </div>
  );
}
