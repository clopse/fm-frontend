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
        <div 
          className="min-h-screen bg-cover bg-center bg-no-repeat relative"
          style={{
            backgroundImage: 'url(/training/hotel-building.jpg)',
          }}
        >
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          
          {/* Header */}
          <div className="relative z-10 bg-white shadow-sm border-b">
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

          <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16 min-h-screen">
            <div className="max-w-2xl text-center">
              <div className="mb-8">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 0-4-.5-4.5 1 0 1 0 1 1.5s.5 1.5.5 1.5l1.12 1.12z" clipRule="evenodd" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Fire Safety Induction</h1>
                <p className="text-xl text-white mb-8 drop-shadow-md">
                  Welcome to {hotelNames[hotelId as string]}. This comprehensive training will prepare you for fire safety procedures and your role in an emergency.
                </p>
              </div>

              <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg p-8 mb-8">
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
                      <p className="text-gray-600 text-sm">Where to gather and coordinate with fire brigade</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-blue-600 text-sm font-bold">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Special Needs (PEEPs)</h3>
                      <p className="text-gray-600 text-sm">Assisting guests with mobility requirements</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep('slides')} 
                className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Start Training
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'slides' && <FireSlides onComplete={handleTrainingComplete} />}
      
      {step === 'quiz' && (
        <FireQuiz 
          hotelId={hotelId as string} 
          onComplete={handleQuizComplete}
          onBack={() => setStep('slides')}
        />
      )}
      
      {step === 'result' && quizResult && (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
          {/* Header */}
          <div className="bg-white shadow-sm border-b">
            <div className="flex justify-between items-center p-4 max-w-7xl mx-auto">
              {/* Left - JMK Logo */}
              <div className="flex items-center">
                <Image
                  src="/training/logo-jmk.png"
                  alt="JMK Group"
                  width={80}
                  height={50}
                  className="h-12 w-auto"
                />
              </div>
              
              {/* Center - Title */}
              <div className="text-center">
                <h1 className="text-xl font-bold text-blue-800">Training Complete</h1>
              </div>
              
              {/* Right - Holiday Inn Express Logo */}
              <div className="flex items-center">
                <div className="text-right mr-4">
                  <p className="text-sm font-semibold text-blue-700">Holiday Inn Express</p>
                  <p className="text-xs text-gray-600">Dublin City Centre</p>
                </div>
                <Image
                  src="/training/logo-hiex.png"
                  alt="Holiday Inn Express"
                  width={120}
                  height={60}
                  className="h-12 w-auto"
                />
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-6 py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              {quizResult.passed ? (
                <div className="text-green-600 mb-6">
                  <svg className="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-3xl font-bold text-gray-800">Congratulations!</h2>
                </div>
              ) : (
                <div className="text-orange-600 mb-6">
                  <svg className="w-20 h-20 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <h2 className="text-3xl font-bold text-gray-800">Almost There!</h2>
                </div>
              )}

              <div className="mb-8">
                <p className="text-xl text-gray-700 mb-2">
                  Hello <span className="font-semibold text-blue-800">{quizResult.name}</span>
                </p>
                <div className="text-4xl font-bold text-gray-800 mb-2">
                  {Math.round((quizResult.score / 10) * 100)}%
                </div>
                <p className="text-gray-600">
                  You scored {quizResult.score} out of 10 questions correctly
                </p>
              </div>

              {quizResult.passed ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <p className="text-green-800 font-medium">
                    ✅ You have successfully completed the fire safety training. 
                    Your certificate has been recorded and you&apos;re ready to work.
                  </p>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                  <p className="text-orange-800 font-medium">
                    ⚠️ You need at least 80% (8/10) to pass. 
                    Please review the training materials and try again.
                  </p>
                </div>
              )}

              <div className="flex justify-center space-x-4 mb-8">
                {!quizResult.passed && (
                  <button
                    onClick={handleRestart}
                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Review & Try Again
                  </button>
                )}
                {quizResult.passed && (
                  <div className="text-center">
                    <p className="text-green-600 font-semibold mb-4">Training completed successfully!</p>
                    <button
                      onClick={() => window.close()}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      Close Window
                    </button>
                  </div>
                )}
              </div>

              {/* Additional Learning Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Additional Learning: Fire Panel Functions
                </h3>
                <p className="text-blue-700 mb-4 text-sm">
                  Want to learn more about fire panel operations? Watch this additional video for deeper insights into fire alarm system functions and troubleshooting.
                </p>
                
                <div className="relative w-full max-w-2xl mx-auto bg-white rounded-lg overflow-hidden shadow-md">
                  <div className="relative" style={{paddingBottom: '56.25%', height: 0}}>
                    <iframe
                      src="https://www.youtube.com/embed/Yr5jSqiycQ8"
                      title="Fire Panel Functions - Additional Learning"
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
                
                <p className="text-xs text-blue-600 mt-3 text-center">
                  This video provides additional context beyond your hotel-specific training
                </p>
              </div>

              {/* Debug info - you can remove this in production */}
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-gray-500 text-sm">Debug Information</summary>
                <pre className="text-left text-xs bg-gray-100 p-4 rounded mt-2 overflow-x-auto">
                  {JSON.stringify(quizResult, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
