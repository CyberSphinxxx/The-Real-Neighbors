import React, { useEffect, useState } from 'react';
import { type TriviaQuestion as QuestionType } from '../../../lib/triviaQuestions';

interface TriviaQuestionProps {
  question: QuestionType;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selectedIndex: number | null, timeLeft: number) => void;
}

export const TriviaQuestion: React.FC<TriviaQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer
}) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // Reset state when question changes
  useEffect(() => {
    setTimeLeft(15);
    setSelectedAnswer(null);
  }, [question.id]);

  // Timer logic
  useEffect(() => {
    if (selectedAnswer !== null) return; // Stop timer if answered

    if (timeLeft <= 0) {
      onAnswer(null, 0); // Auto-advance with null answer
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, selectedAnswer, onAnswer]);

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return; // Prevent changing answer
    setSelectedAnswer(index);
    setTimeout(() => {
      onAnswer(index, timeLeft);
    }, 1200); // 1.2s delay to show correct/wrong before advancing
  };

  const getTimerColor = () => {
    if (timeLeft > 10) return 'text-green-500';
    if (timeLeft > 5) return 'text-amber-500';
    return 'text-red-500';
  };

  const getOptionClass = (index: number) => {
    let baseClass = "w-full flex items-center bg-elevated border border-border-subtle rounded-xl px-5 py-3.5 text-left text-sm font-medium transition-all duration-150 relative overflow-hidden ";
    
    if (selectedAnswer === null) {
      baseClass += "cursor-pointer hover:border-primary hover:bg-primary/5 text-main";
      return baseClass;
    }

    // Answered state
    if (index === question.correctIndex) {
      baseClass += "bg-green-500/20 border-green-500 text-green-400";
    } else if (index === selectedAnswer) {
      baseClass += "bg-red-500/20 border-red-500 text-red-400";
    } else {
      baseClass += "opacity-50 text-main";
    }

    return baseClass;
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Top Bar: Progress & Timer */}
      <div className="flex justify-between items-center px-2">
        <div className="flex flex-col gap-1.5 w-1/2">
          <span className="text-faint text-xs font-medium uppercase tracking-wider">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="h-1.5 w-full bg-elevated rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 rounded-full" 
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }} 
            />
          </div>
        </div>
        
        <div className={`font-mono font-bold text-xl ${getTimerColor()} transition-colors`}>
          {timeLeft}s
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 min-h-[80px] flex items-center justify-center relative shadow-sm">
        <span className="absolute -top-3 right-4 bg-elevated border border-border-subtle text-faint text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {question.category}
        </span>
        <h3 className="font-semibold text-lg text-main text-center leading-snug">
          {question.question}
        </h3>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={getOptionClass(index)}
            onClick={() => handleSelect(index)}
            disabled={selectedAnswer !== null}
          >
            <div className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${
              selectedAnswer !== null && index === question.correctIndex ? 'bg-green-500/20 text-green-400' :
              selectedAnswer === index ? 'bg-red-500/20 text-red-400' :
              'bg-primary/15 text-primary'
            }`}>
              {['A', 'B', 'C', 'D'][index]}
            </div>
            <span className="flex-1 leading-snug">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
