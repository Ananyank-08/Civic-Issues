import React from 'react';

/**
 * VINTAGE SKETCH — MYSORE PALACE
 * Refined for a charcoal/pencil look with detailed facade and symmetrical domes.
 */
export const PalaceSketch = ({ className }) => (
  <svg viewBox="0 0 1200 400" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Textured Ground Lines */}
    <path d="M100 370 H1100" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <path d="M200 380 H1000" stroke="currentColor" strokeWidth="0.8" opacity="0.2"/>
    
    {/* Main Pavilion Structure */}
    <path d="M420 370 V120 H780 V370" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M420 120 Q600 -40 780 120" stroke="currentColor" strokeWidth="2"/> {/* Main Dome */}
    <path d="M600 20 V-15 M585 -5 H615" stroke="currentColor" strokeWidth="1.5"/> {/* High Spire */}
    
    {/* Detailed Arches - Central (9-arch style) */}
    <path d="M430 370 Q430 140 470 370 M470 370 Q510 140 550 370 M550 370 Q600 140 650 370 M650 370 Q690 140 730 370 M730 370 Q770 140 770 370" stroke="currentColor" strokeWidth="1.2" opacity="0.7"/>
    
    {/* Side Wings - Left */}
    <path d="M100 370 V180 H420" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M100 180 Q100 110 210 110 Q320 110 320 180" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M210 110 V80" stroke="currentColor" strokeWidth="1"/>
    {/* Left Arches */}
    <path d="M120 370 Q120 230 180 370 M180 370 Q240 230 300 370 M300 370 Q360 230 400 370" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    
    {/* Side Wings - Right */}
    <path d="M780 180 H1100 V370" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M880 180 Q880 110 990 110 Q1100 110 1100 180" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M990 110 V80" stroke="currentColor" strokeWidth="1"/>
    {/* Right Arches */}
    <path d="M800 370 Q800 230 860 370 M860 370 Q920 230 980 370 M980 370 Q1040 230 1080 370" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
    
    {/* Hatching / Texture Lines */}
    <path d="M430 150 H770 M430 170 H770" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
    <path d="M110 200 H410 M790 200 H1090" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
  </svg>
);

/**
 * VINTAGE SKETCH — ROYAL ELEPHANT
 * Enhanced with "pencil-edge" details and ornate royal decorations.
 */
export const ElephantSketch = ({ className }) => (
  <svg viewBox="0 0 600 600" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Body Contour (Sketchy variation) */}
    <path d="M60 480 C60 250 160 140 400 140 C560 140 580 300 580 420" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    
    {/* Head and Detailed Trunk */}
    <path d="M90 480 C60 480 0 400 0 250 C0 180 60 100 180 100" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    <path d="M20 250 Q10 250 0 280 T20 310" stroke="currentColor" strokeWidth="2.5" opacity="0.6"/>
    
    {/* Ear with Royal Patterns */}
    <path d="M180 120 Q100 150 130 300 Q180 360 240 280" stroke="currentColor" strokeWidth="2.5" fill="var(--primary-glow)"/>
    <path d="M150 160 Q160 170 175 160" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <circle cx="160" cy="200" r="12" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3"/>
    
    {/* Eye and Regal Markings */}
    <circle cx="165" cy="210" r="5" fill="currentColor"/>
    <path d="M140 190 Q165 170 190 190" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    
    {/* Jewelry / Caparison details */}
    <path d="M120 320 Q160 360 220 330" stroke="currentColor" strokeWidth="3"/>
    <circle cx="160" cy="340" r="10" fill="currentColor"/> {/* Central Bell */}
    <path d="M110 440 H180 M540 440 H590" stroke="currentColor" strokeWidth="2.5"/>
    
    {/* The Majestic Howdah (Ornate Sketch) */}
    <path d="M280 150 V50 H520 V150" stroke="currentColor" strokeWidth="3.5" fill="#fff" opacity="0.9"/>
    <path d="M280 50 Q280 -10 400 -10 Q520 -10 520 50" stroke="currentColor" strokeWidth="3.5"/>
    <path d="M400 -10 V-40 M380 -30 H420" stroke="currentColor" strokeWidth="2"/>
    <path d="M300 75 H500 M300 100 H500 M300 125 H500" stroke="currentColor" strokeWidth="0.8" opacity="0.2"/>
    
    {/* Tusk */}
    <path d="M110 320 Q50 320 30 360" stroke="currentColor" strokeWidth="3" opacity="0.5"/>
  </svg>
);
