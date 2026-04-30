"use client";
import React from "react";
import { motion } from "framer-motion";

export const SpiderLoader = ({
  size = 60,
  speed = 1,
  variant = 'left'
}: {
  size?: number;
  speed?: number;
  variant?: 'left' | 'right'
}) => {
  // Purple theme for 'left' (Extraction), Blue/Cyan theme for 'right' (Analysis)
  const purple = "#9b6dff";
  const lightPurple = "#c4a7ff";
  const darkPurple = "#6e4bb3";

  const cyan = "#86d9ff";
  const lightCyan = "#bdeaff";
  const darkCyan = "#4a8bb3";

  const mainColor = variant === 'left' ? purple : cyan;
  const secondaryColor = variant === 'left' ? lightPurple : lightCyan;
  const bodyColor = variant === 'left' ? darkPurple : darkCyan;
  const eyeColor = "#1a1a1a";

  // Extraction animation (crawling/fetching)
  const bounceY = variant === 'left' ? [0, -6, 0] : [0, -3, 0];
  const scale = variant === 'right' ? [1, 1.05, 1] : [1, 1.02, 1]; // Right spider "thinks" (pulses more)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Spider Web Circle */}
      <motion.svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full opacity-20"
        animate={{ rotate: variant === 'left' ? 360 : -360 }}
        transition={{ duration: 10 / speed, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" strokeDasharray="4 4" />
        {[0, 45, 90, 135].map((angle) => (
          <line
            key={angle}
            x1="50"
            y1="5"
            x2="50"
            y2="95"
            stroke="currentColor"
            strokeWidth="0.5"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </motion.svg>

      {/* The Spider */}
      <motion.svg
        viewBox="0 0 100 100"
        width={size * 0.8}
        height={size * 0.8}
        animate={{ y: bounceY, rotate: variant === 'right' ? [0, 2, -2, 0] : 0 }}
        transition={{ duration: 2 / speed, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Legs - Left */}
        {[
          { id: "l1", d: "M 35 45 Q 20 30 15 50", delay: 0 },
          { id: "l2", d: "M 35 55 Q 15 55 10 70", delay: 0.2 },
          { id: "l3", d: "M 38 65 Q 20 75 25 85", delay: 0.4 },
        ].map((leg) => (
          <motion.path
            key={leg.id}
            d={leg.d}
            stroke={mainColor}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: variant === 'left'
                ? [leg.d, leg.d.replace(/(\d+)\s+(\d+)$/, (_, x, y) => `${parseInt(x) - 5} ${parseInt(y) - 5}`), leg.d]
                : [leg.d, leg.d.replace(/(\d+)\s+(\d+)$/, (_, x, y) => `${parseInt(x) - 2} ${parseInt(y) - 2}`), leg.d]
            }}
            transition={{ duration: 1 / speed, repeat: Infinity, ease: "easeInOut", delay: leg.delay }}
          />
        ))}

        {/* Legs - Right */}
        {[
          { id: "r1", d: "M 65 45 Q 80 30 85 50", delay: 0.1 },
          { id: "r2", d: "M 65 55 Q 85 55 90 70", delay: 0.3 },
          { id: "r3", d: "M 62 65 Q 80 75 75 85", delay: 0.5 },
        ].map((leg) => (
          <motion.path
            key={leg.id}
            d={leg.d}
            stroke={mainColor}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            animate={{
              d: variant === 'left'
                ? [leg.d, leg.d.replace(/(\d+)\s+(\d+)$/, (_, x, y) => `${parseInt(x) + 5} ${parseInt(y) - 5}`), leg.d]
                : [leg.d, leg.d.replace(/(\d+)\s+(\d+)$/, (_, x, y) => `${parseInt(x) + 2} ${parseInt(y) - 2}`), leg.d]
            }}
            transition={{ duration: 1 / speed, repeat: Infinity, ease: "easeInOut", delay: leg.delay }}
          />
        ))}

        {/* Body (Back) */}
        <ellipse cx="50" cy="70" rx="22" ry="18" fill={bodyColor} />

        {/* Head */}
        <motion.ellipse
          cx="50"
          cy="50"
          rx="20"
          ry="18"
          fill={mainColor}
          animate={{ scale: scale }}
          transition={{ duration: 2 / speed, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Eyes */}
        <g>
          {/* Main big eyes */}
          <circle cx="42" cy="48" r="5" fill={eyeColor} />
          <circle cx="58" cy="48" r="5" fill={eyeColor} />
          {/* Tiny side eyes */}
          <circle cx="35" cy="45" r="2" fill={eyeColor} />
          <circle cx="65" cy="45" r="2" fill={eyeColor} />

          {/* Highlights */}
          <circle cx="43" cy="46" r="1.5" fill="white" opacity="0.8" />
          <circle cx="59" cy="46" r="1.5" fill="white" opacity="0.8" />
        </g>

        {/* Cheeks */}
        <circle cx="38" cy="58" r="3" fill={secondaryColor} opacity="0.4" />
        <circle cx="62" cy="58" r="3" fill={secondaryColor} opacity="0.4" />

        {/* Little Fangs/Mandibles */}
        <motion.path
          d="M 45 62 Q 45 68 42 70"
          stroke={secondaryColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 1.5 / speed, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M 55 62 Q 55 68 58 70"
          stroke={secondaryColor}
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          animate={{ rotate: [5, -5, 5] }}
          transition={{ duration: 1.5 / speed, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
};
