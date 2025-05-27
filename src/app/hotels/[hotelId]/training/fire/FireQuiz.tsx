'use client';

import { useState } from 'react';
import fireQuestions from './fireQuestions';
import Image from 'next/image';
import submitResult from './submitResult';

interface FireQuizProps {
  hotelId: string;
  onComplete: (result: any) => void;
}

export default function FireQuiz({ hotelId, onComplete }: FireQuizProps) {
  const [step, setStep] = useState<'form' | 'quiz'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQ, setCurrentQ] = useState(0);

  const handleSubmit = async () => {
    const now = new Date().toISOString();
    let score = 0;

    fireQuestions.forEach((q, i) => {
      const correctSet = new Set(q.correct);
      const given = answers[i];
      if (correctSet.has(given)) score++;
    });

    const passed = score >= 8;
    const result = { hotel_id: hotelId, name, email, score, passed, taken_at: now };

    await submitResult(hotelId, result);
    onComplete(result);
  };

  if (step === 'form') {
    return (
      <div className="max-w-xl mx-auto py-8">
        <h2 className="text-xl font-semibold mb-4">Enter your details to begin the quiz</h2>
        <input
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mb-4 w-full p-2 border rounded"
        />
        <input
          placeholder="Your Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full p-2 border rounded"
        />
        <button
          disabled={!name || !email}
          onClick={() => setStep('quiz')}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Start Quiz
        </button>
      </div>
    );
  }

  const q = fireQuestions[currentQ];
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-xl font-semibold mb-4">Question {currentQ + 1} of {fireQuestions.length}</h2>
      <p className="text-gray-700 mb-4">{q.question}</p>
      {q.image && <Image src={q.image} alt="" width={600} height={300} className="mb-4 rounded" />}
      <div className="space-y-2 mb-6">
        {q.options.map((opt, idx) => (
          <div key={idx} className="flex items-center">
            <input
              type="radio"
              name={`q-${currentQ}`}
              value={idx}
              checked={answers[currentQ] === idx}
              onChange={() => {
                const newAnswers = [...answers];
                newAnswers[currentQ] = idx;
                setAnswers(newAnswers);
              }}
              className="mr-2"
            />
            <label>{opt}</label>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQ(currentQ - 1)}
          disabled={currentQ === 0}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Back
        </button>
        {currentQ < fireQuestions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(currentQ + 1)}
            disabled={answers[currentQ] === undefined}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={answers.length !== fireQuestions.length}
            className="px-6 py-2 bg-green-600 text-white rounded"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
