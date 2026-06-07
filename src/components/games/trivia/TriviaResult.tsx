import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { type TriviaQuestion as QuestionType } from '../../../lib/triviaQuestions';
import { ShareToFeedModal } from '../../games/ShareToFeedModal';

interface TriviaResultProps {
  score: number; // 0-10
  questions: QuestionType[];
  answers: (number | null)[];
  categoryName: string;
  onPlayAgain: () => void;
}

export const TriviaResult: React.FC<TriviaResultProps> = ({
  score,
  questions,
  answers,
  categoryName,
  onPlayAgain
}) => {
  const [showReview, setShowReview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const getGradeMessage = (s: number) => {
    if (s === 10) return "Perfect! Lodi! 🏆";
    if (s >= 8) return "Grabe, ang galing mo! 🔥";
    if (s >= 6) return "Solid! Not bad pre 👍";
    if (s >= 4) return "Pwede na... 😅";
    return "Kabisado mo ba talaga ito? 💀";
  };

  const getShareText = () => {
    const grade = score >= 8 ? 'Try to beat me! 👀' : 'At least I tried 😭';
    return `🧠 I scored ${score}/10 in Trivia!\nCategory: ${categoryName}\n\n${grade}\n\n— played on The Real Neighbors`;
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center animate-in slide-in-from-bottom-4 duration-300 pb-16">
      
      {/* Score Display */}
      <div className="w-32 h-32 rounded-full border-4 border-[#8b5cf6] flex flex-col items-center justify-center bg-surface shadow-lg mb-6">
        <div className="font-heading font-bold text-5xl text-main leading-none mt-2">
          {score}
        </div>
        <div className="text-muted text-lg font-medium">/10</div>
      </div>

      <h2 className="font-heading font-bold text-2xl text-main mb-1 text-center">
        {getGradeMessage(score)}
      </h2>
      <p className="text-muted text-sm mb-8 text-center">
        Category: <span className="capitalize font-medium text-main">{categoryName}</span>
      </p>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3 mb-8">
        <button 
          className="w-full bg-[#8b5cf6] text-white rounded-full py-3.5 font-medium hover:brightness-110 transition-colors flex justify-center items-center gap-2 shadow-sm"
          onClick={() => setShowShareModal(true)}
        >
          Share Result 🎮
        </button>
        <button 
          className="w-full bg-elevated text-main border border-border-subtle rounded-full py-3.5 font-medium hover:bg-surface-hover transition-colors"
          onClick={onPlayAgain}
        >
          Play Again
        </button>
      </div>

      {/* Answer Review */}
      <div className="w-full bg-surface border border-border-subtle rounded-2xl overflow-hidden shadow-sm">
        <button 
          className="w-full p-4 flex justify-between items-center hover:bg-elevated transition-colors"
          onClick={() => setShowReview(!showReview)}
        >
          <span className="font-medium text-main text-sm">Review answers</span>
          {showReview ? <ChevronUp className="w-5 h-5 text-muted" /> : <ChevronDown className="w-5 h-5 text-muted" />}
        </button>

        {showReview && (
          <div className="border-t border-border-subtle divide-y divide-subtle">
            {questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const isCorrect = userAnswer === q.correctIndex;
              const isTimeout = userAnswer === null;

              return (
                <div key={idx} className="p-4 flex gap-3 bg-elevated/30">
                  <div className="mt-0.5">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-main mb-2 leading-snug">{q.question}</p>
                    
                    <div className="text-xs space-y-1.5">
                      {isCorrect ? (
                        <div className="text-green-500">
                          <span className="text-green-500/70 mr-1">Your answer:</span>
                          {q.options[userAnswer as number]}
                        </div>
                      ) : (
                        <>
                          <div className="text-red-500">
                            <span className="text-red-500/70 mr-1">Your answer:</span>
                            {isTimeout ? "Time's up! (No answer)" : q.options[userAnswer as number]}
                          </div>
                          <div className="text-green-500">
                            <span className="text-green-500/70 mr-1">Correct answer:</span>
                            {q.options[q.correctIndex]}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showShareModal && (
        <ShareToFeedModal
          gameId="trivia"
          scoreDisplay={`${score}/10`}
          resultCard={
            <div className="text-center">
              <div className="font-heading font-bold text-4xl text-[#8b5cf6] leading-none mb-1">{score}/10</div>
              <div className="text-sm font-medium text-main capitalize">{categoryName} Trivia</div>
            </div>
          }
          shareText={getShareText()}
          onClose={() => setShowShareModal(false)}
          onShare={() => {}}
        />
      )}
    </div>
  );
};
