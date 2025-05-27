'use client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';
import { hotelNames } from '@/lib/hotels';
import FireSlides from './FireSlides';
import FireQuiz from './FireQuiz';

interface TrainingResult {
  hotel_id: string;
  name: string;
  email: string;
  score: number;
  passed: boolean;
  taken_at: string;
}

export default function FireTrainingPage() {
  const { hotelId } = useParams();
  const [step, setStep] = useState<'landing' | 'slides' | 'quiz' | 'result'>('landing');
  const [quizResult, setQuizResult] = useState<TrainingResult | null>(null);

  const handleTrainingComplete = () => setStep('quiz');
  const handleQuizComplete = (result: TrainingResult) => {
    setQuizResult(result);
    setStep('result');
  };
  const handleRestart = () => {
    setStep('landing');
    setQuizResult(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {step === 'landing' && (
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
            </div>
            <Image
              src="/training/logo-jmk.png"
              alt="JMK"
              width={80}
              height={40}
              className="h-10 w-auto"
            />
          </div>

          <div className="flex flex-col items-center justify-center px-6 py-16">
            <div className="max-w-2xl text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 0-4-.5-4.5 1 0 1 0 1 1.5s.5 1.5.5 1.5l1.12 1.12z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-blue-800 mb-4">Fire Safety Induction</h1>
                <p className="text-xl text-gray-600 mb-8">
                  Welcome to {hotelNames[hotelId as string]}. This comprehensive training will prepare you for fire safety procedures and your role in an emergency.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">What you'll learn:</h2>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Hotel Layout & Equipment</h3>
                      <p className="text-gray-600 text-sm">Fire extinguishers, alarms, and escape routes</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Emergency Procedures</h3>
                      <p className="text-gray-600 text-sm">Evacuation roles and guest assistance</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Assembly Points</h3>
                      <p className="text-gray-600 text-sm">Where to gather an
