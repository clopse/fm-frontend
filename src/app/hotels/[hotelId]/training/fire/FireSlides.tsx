'use client';

import Image from 'next/image';
import { useState } from 'react';

interface FireSlidesProps {
  onComplete: () => void;
}

const slides = [
  {
    title: 'Hotel Overview',
    bullets: [
      '198 rooms across 8 floors (-1 to 6)',
      '3 lifts total (2 guest, 1 staff)',
      'NEVER use lifts during a fire',
      'Two stairwells available:',
      '• Front stairwell: 6th floor to ground',
      '• Rear stairwell: 6th to 1st, then tunnel to Findlater Place'
    ],
    image: '/training/floor-plan.png',
  },
  {
    title: 'Manual Call Points',
    bullets: [
      'Use to trigger alarm if you see fire',
      'Activates bells immediately throughout building',
      'Break glass to activate',
      'Reset with red fire key only',
      'Located on every floor near stairwells'
    ],
    image: '/training/manual-call-point.png',
  },
  {
    title: 'Emergency Door Release',
    bullets: [
      'Press to open secure doors during fire',
      'Does NOT trigger the alarm system',
      'Used for escape route access',
      'Reset with black key',
      'Located near secure exit doors'
    ],
    image: '/training/emergency-door-release.png',
  },
  {
    title: 'Fire Extinguishers',
    bullets: [
      'Use ONLY if trained and fire is SMALL',
      'Water extinguishers: paper, wood, fabric',
      'CO₂ extinguishers: electrical equipment',
      'Wet Chemical: kitchen fires (oil/fat)',
      'If in doubt, evacuate immediately'
    ],
    image: '/training/extinguishers.png',
  },
  {
    title: 'Fire Alarm Panel (Gent Vigilon)',
    bullets: [
      'Located in back office',
      'Red light = FIRE detected',
      'Amber light = FAULT in system',
      'Silence button stops sounders',
      'Reset clears system after full check',
      'Do NOT reset unless properly trained'
    ],
    image: '/training/fire-panel.png',
  },
  {
    title: 'Fire Box & Essential Items',
    bullets: [
      'Fire box location: near reception',
      'Contains: floor plans, safety vests, torches',
      'Also includes: speaker and roof access fob',
      'Fire keys kept in separate key box',
      'Guest list: updated every shift (every 2 hours)',
      'PEEP form posted in back office'
    ],
    image: '/training/fire-keys.png',
  },
  {
    title: 'What Fire Brigade Will Ask For',
    bullets: [
      'Floor plans (from fire box)',
      'Fire keys (from key box)',
      'PEEP details (mobility assistance list)',
      'Roof access fob',
      'Current guest list',
      'Know exactly where fire box is located'
    ],
    image: '/training/assembly-point.png',
  },
  {
    title: 'Assembly Point & Evacuation',
    bullets: [
      'All guests and staff gather at designated assembly point',
      'Located outside the building (see image)',
      'Roll call conducted here',
      'Emergency services coordinate from this point',
      'NEVER re-enter building',
      'Wait for fire brigade all-clear'
    ],
    image: '/training/assembly-point.png',
  },
  {
    title: 'Evacuation Roles & Flexibility',
    bullets: [
      'Daily roles posted in back office',
      'ALL staff must know ALL roles',
      'If someone absent: everyone shifts up',
      'Example: Coordinator missing →',
      '• Locator becomes Coordinator',
      '• Exit Organiser becomes Locator, etc.'
    ],
    image: '/training/roles-printout.png',
  },
  {
    title: 'PEEPs – Guests with Mobility Needs',
    bullets: [
      'PEEP = Personal Emergency Evacuation Plan',
      'Completed by guests at check-in',
      'Identifies guests needing assistance',
      'Staff must know their locations',
      'Special procedures for evacuation',
      'Priority communication to emergency services'
    ],
    image: '/training/peep-form.png',
  },
  {
    title: 'Final Safety Reminders',
    bullets: [
      'Sweep or assist ONLY if trained',
      'Help guests only if safe to do so',
      'Step into roles when someone is absent',
      'Know the full evacuation chain',
      'NEVER ignore an alarm',
      'Confidence and preparation save lives'
    ],
    image: '/training/logo-jmk.png',
  },
];

export default function FireSlides({ onComplete }: FireSlidesProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header with logos */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <Image
          src="/training/logo-hiex.png"
          alt="Holiday Inn Express"
          width={120}
          height={60}
          className="h-12 w-auto"
        />
        <div className="text-center">
          <h1 className="text-lg font-bold text-blue-800">Fire Safety Training</h1>
          <p className="text-sm text-gray-600">Slide {index + 1} of {slides.length}</p>
        </div>
        <Image
          src="/training/logo-jmk.png"
          alt="JMK"
          width={80}
          height={40}
          className="h-10 w-auto"
        />
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
              {slide.image && (
                <div className="text-center">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    width={500}
                    height={350}
                    className="mx-auto rounded-lg shadow-md max-w-full h-auto"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
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
