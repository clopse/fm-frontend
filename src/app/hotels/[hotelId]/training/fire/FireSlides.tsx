'use client';

import Image from 'next/image';
import { useState } from 'react';

interface FireSlidesProps {
  onComplete: () => void;
}

const slides = [
  {
    title: 'Hotel Overview',
    content: 'Holiday Inn Express Dublin City Centre has 198 rooms across 8 floors (-1 to 6), with 3 lifts (2 guest, 1 staff). Never use lifts in a fire. Know both stairwells: front (6th to ground) and rear (6th to 1st, then tunnel to Findlater Place).',
    image: '/training/floor-plan.png',
  },
  {
    title: 'Manual Call Points',
    content: 'Use to trigger alarm if you see fire. This activates bells immediately. Reset with red fire key.',
    image: '/training/manual-call-point.png',
  },
  {
    title: 'Emergency Door Release',
    content: 'Press to open secure doors during fire. Does not trigger alarm. Reset with black key.',
    image: '/training/emergency-door-release.png',
  },
  {
    title: 'Fire Extinguishers',
    content: 'Use ONLY if trained and fire is small. Water (paper/wood), CO₂ (electrical), Wet Chemical (kitchen).',
    image: '/training/extinguishers.png',
  },
  {
    title: 'Fire Alarm Panel (Gent Vigilon)',
    content: 'Located in back office. Red = FIRE, Amber = FAULT. Silence stops sounders, Reset clears system only after full check. Do NOT reset unless trained.',
    image: '/training/fire-panel.png',
  },
  {
    title: 'Fire Box & Plans',
    content: 'The fire box near reception contains floor plans, safety vests, torches, a speaker, and roof access fob. The fire keys are located in the key box. A printed guest list is hung in the back office and should be updated every shift (ideally every 2 hours). The PEEP form is also posted in the back office. Be ready to hand these to the fire brigade.',
    image: '/training/fire-keys.png',
  },
  {
    title: 'What the Fire Brigade Will Ask For',
    content: 'On arrival, they will ask for: Floor plans, Fire keys, PEEP details, Roof access, Guest list. Know where the fire box is.',
    image: '/training/assembly-point.png',
  },
  {
    title: 'Assembly Point & Evacuation',
    content: 'All guests and staff must gather at the designated assembly point outside the building. This is where the roll call takes place and where emergency services will coordinate operations. Never re-enter the building until given the all-clear by the fire brigade.',
    image: '/training/assembly-point.png',
  },
  {
    title: 'Evacuation Roles & Flexibility',
    content: 'Roles are posted daily in the back office. It is important that all staff know all roles. If someone is absent, everyone shifts up one position: e.g., if the Coordinator is missing, the Locator becomes Coordinator, the Exit Organiser becomes Locator, and so on.',
    image: '/training/roles-printout.png',
  },
  {
    title: 'PEEPs – Guests with Mobility Needs',
    content: 'Guests complete a PEEP (Personal Emergency Evacuation Plan) form at check-in. Staff should know how to notify emergency services and where those guests are located. These guests require special assistance during evacuation.',
    image: '/training/peep-form.png',
  },
  {
    title: 'Final Reminder',
    content: 'Sweep or assist only if trained. Help guests only if safe to do so. Step into roles when someone is absent. Know the full chain of evacuation roles. Never ignore an alarm. Confidence saves lives.',
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

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">{slide.title}</h2>
          
          {slide.image && (
            <div className="mb-6 text-center">
              <Image
                src={slide.image}
                alt={slide.title}
                width={640}
                height={360}
                className="mx-auto rounded-lg shadow-md max-w-full h-auto"
              />
            </div>
          )}
          
          <div className="text-gray-700 text-lg leading-relaxed mb-8 text-center max-w-3xl mx-auto">
            {slide.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4">{paragraph}</p>
            ))}
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
