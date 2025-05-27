'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { hotelNames } from '@/lib/hotels';
import FireSlides from './FireSlides';
import FireQuiz from './FireQuiz';

export default function FireTrainingPage() {
  const { hotelId } = useParams();
  const [step, setStep] = useState<'landing' | 'slides' | 'form' | 'quiz' | 'result'>('landing');
  const [quizResult, setQuizResult] = useState<any>(null);

  const handleTrainingComplete = () => setStep('form');
  const handleQuizComplete = (result: any) => {
    setQuizResult(result);
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-white text-center p-6">
      {step === 'landing' && (
        <div className="flex flex-col items-center justify-center">
          <Image src="/training/logo-hiex.png" alt="Logo" width={120} height={60} className="mb-4" />
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Fire Safety Induction</h1>
          <p className="text-gray-600 mb-6">Welcome to {hotelNames[hotelId as string]}. This short training will prepare you for fire safety procedures and your role in an emergency.</p>
          <button onClick={() => setStep('slides')} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Start Training</button>
        </div>
      )}

      {step === 'slides' && <FireSlides onComplete={handleTrainingComplete} />}

      {step === 'form' && (
        <FireQuiz hotelId={hotelId as string} onComplete={handleQuizComplete} />
      )}

      {step === 'result' && (
        <div className="max-w-xl mx-auto py-12">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Training Complete</h2>
          <p className="text-lg text-gray-700 mb-2">
            {quizResult.passed
              ? '✅ You passed the quiz. You may now return to work.'
              : '❌ You did not pass the quiz. Please retake the training.'}
          </p>
          <pre className="text-left text-sm bg-gray-100 p-4 rounded mt-4 overflow-x-auto">
            {JSON.stringify(quizResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
