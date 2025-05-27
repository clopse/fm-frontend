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
    content: 'The fire box near reception contains fire keys, floor plans, roof access fob, guest list (if printed). Be ready to hand to fire brigade.',
    image: '/training/fire-keys.png',
  },
  {
    title: 'What the Fire Brigade Will Ask For',
    content: 'On arrival, they will ask for: Floor plans, Fire keys, PEEP details, Roof access, Guest list. Know where the fire box is.',
    image: '/training/assembly-point.png',
  },
  {
    title: 'Evacuation Roles & Flexibility',
    content: 'Roles are posted daily in the back office. If Coordinator or other staff are absent, others should step in. Guests may assist if needed.',
    image: '/training/roles-printout.png',
  },
  {
    title: 'PEEPs – Guests with Mobility Needs',
    content: 'Guests complete a PEEP form at check-in. Staff should know how to notify emergency services and where those guests are located.',
    image: '',
  },
  {
    title: 'Final Reminder',
    content: 'Sweep or assist only if trained. Help guests only if safe to do so. Step into roles if needed. Never ignore an alarm. Confidence saves lives.',
    image: '/training/logo-jmk.png',
  },
];

export default function FireSlides({ onComplete }: FireSlidesProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  return (
    <div className="max-w-3xl mx-auto text-center py-8 px-4">
      <h2 className="text-xl font-bold text-blue-800 mb-4">{slide.title}</h2>
      {slide.image && (
        <Image
          src={slide.image}
          alt={slide.title}
          width={640}
          height={360}
          className="mx-auto mb-6 rounded shadow"
        />
      )}
      <p className="text-gray-700 text-base mb-6 whitespace-pre-line">{slide.content}</p>

      <div className="flex justify-between">
        <button
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className="px-4 py-2 rounded bg-gray-200 text-gray-800 disabled:opacity-50"
        >
          Back
        </button>
        {index === slides.length - 1 ? (
          <button
            onClick={onComplete}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Quiz
          </button>
        ) : (
          <button
            onClick={() => setIndex(index + 1)}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
