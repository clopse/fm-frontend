'use client';

import Image from 'next/image';
import { useState } from 'react';

interface FireSlidesProps {
  onComplete: () => void;
}

interface Slide {
  title: string;
  bullets: string[];
  images: string[];
  smallImages?: boolean;
}

const slides = [
  {
    title: 'Hotel Overview',
    bullets: [
      '198 rooms with 3 conference rooms',
      '8 floors: -1, Ground Floor, and Floors 1-6',
      'Guest rooms located on Floors 1-6',
      '3 elevators: 2 for guests, 1 for staff',
      'NEVER use elevators during a fire alarm',
      'Two emergency stairwells for evacuation'
    ],
    images: ['/training/6floorplan.png'],
  },
  {
    title: 'Fire Escapes & Exit Routes',
    bullets: [
      'Hotel designed with two means of escape from every location',
      'You should know both escape routes from your work area',
      'Fire escape doors must be kept clear and closed',
      'Report any obstructions to maintenance immediately',
      'Green exit signs mark all escape routes',
      'Front stairwell: 6th floor to ground floor',
      'Rear stairwell: 6th to 1st, then tunnel to Findlater Place'
    ],
    images: ['/training/fire-exits.png'],
  },
  {
    title: 'Fire Escape Doors',
    bullets: [
      'Emergency exit doors with green signage',
      'Must be kept clear of obstructions at all times',
      'Push bar to open during emergency',
      'Never prop open or block these doors',
      'Lead to designated escape routes',
      'Check doors are functioning during shift'
    ],
    images: ['/training/fireescape.png'],
    smallImages: true,
  },
  {
    title: 'Manual Call Points',
    bullets: [
      'Manually trigger fire alarm when you detect fire',
      'Break glass to activate - sets alarm to full bells',
      'Does NOT show on fire panel display',
      'Located on every floor near stairwells',
      'Reset only with red fire key',
      'Use immediately if you discover a fire'
    ],
    images: ['/training/mcp.png'],
    smallImages: true,
  },
  {
    title: 'Emergency Door Release',
    bullets: [
      'Unlocks secure doors during fire emergency',
      'Allows manual and automatic door release',
      'Does NOT trigger the fire alarm',
      'Provides access through locked emergency exits',
      'Reset with black fire key',
      'Located near secure exit doors'
    ],
    images: ['/training/emergencydoorrelease.png'],
    smallImages: true,
  },
  {
    title: 'Fire Extinguishers',
    bullets: [
      'Use ONLY if trained and fire is small',
      'Water: for paper, wood, and fabric fires',
      'CO₂: for electrical equipment fires',
      'Wet Chemical: for kitchen oil and fat fires',
      'Never turn your back on a fire',
      'If in doubt, evacuate immediately'
    ],
    images: ['/training/extinguisher.png', '/training/extinguishertypes.png'],
    smallImages: true,
  },
  {
    title: 'Fire Alarm Panel (Gent Vigilon)',
    bullets: [
      'Located in back office - check at start of each shift',
      'Ensure "Network Healthy" shows in top left',
      'Red light = FIRE detected in building',
      'Amber light = FAULT in the system',
      'Shows exact location of activated detector',
      'Only trained staff should operate panel controls'
    ],
    images: ['/training/firepanel.png'],
    smallImages: true,
  },
  {
    title: 'Dry Riser System',
    bullets: [
      'Used by fire brigade to connect water hoses',
      'Located in lift lobby and rear stairs on each floor',
      'Marked on floor plans with special legend',
      'Fire brigade may ask for their locations',
      'Key to open dry risers is on fire key ring',
      'Critical for fire brigade operations'
    ],
    images: ['/training/dryriser.png'],
    smallImages: true,
  },
  {
    title: 'Fire Keys & Emergency Box',
    bullets: [
      'Fire keys located in key box (holder 34)',
      'Emergency box near reception contains:',
      '• Floor plans and evacuation cards',
      '• Hi-vis jackets and torches',
      '• Megaphone for communication',
      'Keys include: Master fob, roof access, dry risers'
    ],
    images: ['/training/fire-keys.png'],
  },
  {
    title: 'PEEPs – Personal Emergency Evacuation Plans',
    bullets: [
      'Completed by guests with mobility needs at check-in',
      'Details special assistance requirements',
      'Staff must know locations of PEEP guests',
      'Priority communication to emergency services',
      'Form posted in back office for reference',
      'Never attempt assistance beyond your training'
    ],
    images: ['/training/peeps.png'],
  },
  {
    title: 'Evacuation Roles Overview',
    bullets: [
      'Co-ordinator: Controls evacuation, calls emergency services',
      'Locator: Finds fire location, reports to co-ordinator',
      'Exit Organisers: Guide guests to assembly point',
      'Sweepers: Clear floors if safe to do so',
      'All staff must know all roles for flexibility',
      'Roles posted daily in back office'
    ],
    images: ['/training/locator.png'],
  },
  {
    title: 'Training Complete - Key Takeaways',
    bullets: [
      'Check fire panel at start of each shift',
      'Update guest list every 2 hours',
      'Know your evacuation role and backup roles',
      'Assist guests only if safe to do so',
      'Never ignore an alarm - treat all as real',
      'Confidence and preparation save lives'
    ],
    images: ['/training/jmk-logo.png'],
  },
];

export default function FireSlides({ onComplete }: FireSlidesProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
          {/* Left - JMK Logo */}
          <div className="flex items-center">
            <Image
              src="/training/jmk-logo.png"
              alt="JMK Group"
              width={80}
              height={50}
              className="h-12 w-auto"
            />
          </div>
          
          {/* Center - Title */}
          <div className="text-center">
            <h1 className="text-xl font-bold text-blue-800">Fire Safety Training</h1>
            <p className="text-sm text-gray-600">Slide {index + 1} of {slides.length}</p>
          </div>
          
          {/* Right - Holiday Inn Express Logo */}
          <div className="flex items-center">
            <div className="text-right mr-4">
              <p className="text-sm font-semibold text-blue-700">Holiday Inn Express</p>
              <p className="text-xs text-gray-600">Dublin City Centre</p>
            </div>
            <Image
              src="/training/hiex-icon.png"
              alt="Holiday Inn Express"
              width={120}
              height={60}
              className="h-12 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-8 text-center">{slide.title}</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Content side */}
            <div className="order-2 md:order-1">
              <ul className="space-y-3">
                {slide.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start">
                    {bullet.startsWith('•') ? (
                      <span className="text-gray-700 text-lg leading-relaxed ml-4">{bullet}</span>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-3 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-700 text-lg leading-relaxed">{bullet}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Image side */}
            <div className="order-1 md:order-2">
              {slide.images && (
                <div className="text-center space-y-4">
                  {slide.images.map((image, idx) => (
                    <div key={idx} className="mb-4">
                      <Image
                        src={image}
                        alt={`${slide.title} - Image ${idx + 1}`}
                        width={slide.smallImages ? 280 : 400}
                        height={slide.smallImages ? 210 : 300}
                        className="mx-auto rounded-lg shadow-md max-w-full h-auto"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <button
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
              className="flex items-center px-6 py-3 rounded-lg bg-gray-100 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {/* Progress indicator */}
            <div className="flex space-x-2">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    idx === index ? 'bg-blue-600' : idx < index ? 'bg-blue-300' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {index === slides.length - 1 ? (
              <button
                onClick={onComplete}
                className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                Start Quiz
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setIndex(index + 1)}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
