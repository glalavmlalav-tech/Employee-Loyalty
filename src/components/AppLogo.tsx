import React from "react";

interface AppLogoProps {
  className?: string;
  color?: string;
}

export default function AppLogo({ className = "w-12 h-12", color = "#330a1c" }: AppLogoProps) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <g id="logo-arm">
          <path
            d="M 40,0 L 58,0 L 58,40 C 58,52 64,56 75,48 L 86,39 L 98,52 L 78,70 C 60,85 40,70 40,46 Z"
            fill={color}
          />
        </g>
      </defs>
      <use href="#logo-arm" />
      <use href="#logo-arm" transform="rotate(120 50 50)" />
      <use href="#logo-arm" transform="rotate(240 50 50)" />
    </svg>
  );
}
