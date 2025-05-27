'use client';
import { useState } from 'react';
import fireQuestions from './fireQuestions';
import Image from 'next/image';
import submitResult from './submitResult';

interface FireQuizProps {
  hotelId: string;
  onComplete: (result: any) => void;
  onBack: () => void;
}

export default function FireQuiz({ hotelId, onComplete, onBack }: FireQuizProps) {
  const [step, setStep] = useState<'form' | 'quiz'>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<number[][]>([]);
  const [currentQ, setCurrentQ] = useState(0);

  const handleSubmit = async () => {
    const now = new Date().toISOString();
    let score = 0;
    
    fireQuestions.forEach((q, i) => {
      const correctSet = new Set(q.correct);
      const givenSet = new Set(answers[i] || []);
      
      // For multiple choice questions, all correct answers must be selected
      // and no incorrect answers should be selected
      if (correctSet.size === givenSet.size) {
        let isCorrect = true;
        for (let correct of correctSet) {
          if (!givenSet.has(correct)) {
            isCorrect = false;
            break;
          }
        }
        if (isCorrect) score++;
      }
    });
    
    const passed = score >= 8;
    const result = { hotel_id: hotelId, name, email, score, passed, taken_at: now };
    await submitResult(hotelId, result);
    onComplete(result);
  };

  if (step === 'form') {
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
              <h1 className="text-xl font-bold text-blue-800">Fire Safety Quiz</h1>
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

        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-6 text-center">Ready for the Quiz?</h2>
            <p className="text-gray-600 mb-8 text-center">Please enter your details to begin the 10-question fire safety quiz. Some questions may have multiple correct answers.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  placeholder="Enter your email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={onBack}
                className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Training
              </button>
              <button
                disabled={!name.trim() || !email.trim()}
                onClick={() => setStep('quiz')}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Start Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = fireQuestions[currentQ];
  const progress = ((currentQ + 1) / fireQuestions.length) * 100;
  const isMultipleChoice = q.correct.length > 1;

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
            <h1 className="text-xl font-bold text-blue-800">Fire Safety Quiz</h1>
            <p className="text-sm text-gray-600">Question {currentQ + 1} of {fireQuestions.length}</p>
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

      {/* Progress bar */}
      <div className="w-full bg-gray-200 h-2">
        <div 
          className="bg-blue-600 h-2 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">{q.question}</h2>
            {isMultipleChoice && (
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Multiple answers
              </span>
            )}
          </div>
          
          {q.image && (
            <div className="mb-6 text-center">
              <Image 
                src={q.image} 
                alt="Question illustration" 
                width={500} 
                height={300} 
                className="mx-auto rounded-lg shadow-md max-w-full h-auto" 
              />
            </div>
          )}
          
          <div className="space-y-3 mb-8">
            {q.options.map((opt, idx) => (
              <label key={idx} className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                <input
                  type={isMultipleChoice ? "checkbox" : "radio"}
                  name={`q-${currentQ}`}
                  value={idx}
                  checked={isMultipleChoice 
                    ? (answers[currentQ] || []).includes(idx)
                    : (answers[currentQ] || [])[0] === idx
                  }
                  onChange={() => {
                    const newAnswers = [...answers];
                    if (isMultipleChoice) {
                      const currentAnswers = newAnswers[currentQ] || [];
                      if (currentAnswers.includes(idx)) {
                        newAnswers[currentQ] = currentAnswers.filter(a => a !== idx);
                      } else {
                        newAnswers[currentQ] = [...currentAnswers, idx];
                      }
                    } else {
                      newAnswers[currentQ] = [idx];
                    }
                    setAnswers(newAnswers);
                  }}
                  className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 flex-1">{opt}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQ(currentQ - 1)}
              disabled={currentQ === 0}
              className="flex items-center px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous Question
            </button>

            {currentQ < fireQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentQ(currentQ + 1)}
                disabled={!answers[currentQ] || answers[currentQ].length === 0}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next Question
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={answers.length !== fireQuestions.length || answers.some(a => !a || a.length === 0)}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
