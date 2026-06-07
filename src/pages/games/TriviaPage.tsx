import { useState } from 'react';
import { GameShell } from '../../components/games/GameShell';
import { TriviaQuestion as TriviaQuestionComponent } from '../../components/games/trivia/TriviaQuestion';
import { TriviaResult } from '../../components/games/trivia/TriviaResult';
import { TRIVIA_QUESTIONS, type TriviaCategory, type TriviaQuestion } from '../../lib/triviaQuestions';
import { submitScore } from '../../lib/gameUtils';

type GameStatus = 'selecting' | 'playing' | 'finished';

const CATEGORIES = [
  { id: 'anime', name: 'Anime', icon: '🎌', count: TRIVIA_QUESTIONS.filter(q => q.category === 'anime').length },
  { id: 'gaming', name: 'Gaming', icon: '🎮', count: TRIVIA_QUESTIONS.filter(q => q.category === 'gaming').length },
  { id: 'filipino', name: 'Filipino', icon: '🇵🇭', count: TRIVIA_QUESTIONS.filter(q => q.category === 'filipino').length },
  { id: 'general', name: 'General', icon: '🌍', count: TRIVIA_QUESTIONS.filter(q => q.category === 'general').length }
];

export default function TriviaPage() {
  const [gameStatus, setGameStatus] = useState<GameStatus>('selecting');
  const [selectedCategory, setSelectedCategory] = useState<TriviaCategory | 'mixed' | null>(null);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [score, setScore] = useState(0);

  const startGame = (category: TriviaCategory | 'mixed') => {
    setSelectedCategory(category);
    
    // Select questions based on category
    let availableQuestions = category === 'mixed' 
      ? [...TRIVIA_QUESTIONS] 
      : TRIVIA_QUESTIONS.filter(q => q.category === category);
    
    // Shuffle and pick 10
    const shuffledQuestions = availableQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
    
    // Shuffle options within each question
    const processedQuestions = shuffledQuestions.map(q => {
      const optionsWithIndex = q.options.map((opt, i) => ({ text: opt, isCorrect: i === q.correctIndex }));
      const shuffledOptions = optionsWithIndex.sort(() => 0.5 - Math.random());
      const newCorrectIndex = shuffledOptions.findIndex(o => o.isCorrect);
      
      return {
        ...q,
        options: shuffledOptions.map(o => o.text),
        correctIndex: newCorrectIndex
      };
    });

    setQuestions(processedQuestions);
    setCurrentIndex(0);
    setAnswers([]);
    setScore(0);
    setGameStatus('playing');
  };

  const handleAnswer = (selectedIndex: number | null, _timeLeft: number) => {
    const currentQuestion = questions[currentIndex];
    let newScore = score;
    
    if (selectedIndex === currentQuestion.correctIndex) {
      newScore += 1;
      // Bonus point logic can go here if needed, keeping simple +1 for score as requested
    }
    
    setScore(newScore);
    const newAnswers = [...answers, selectedIndex];
    setAnswers(newAnswers);

    if (currentIndex < 9) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameStatus('finished');
      
      // Submit score
      const finalScore = newScore * 10; // Convert 10 points to 0-100 scale for leaderboard
      submitScore('trivia', finalScore, {
        correct: newScore,
        total: 10,
        category: selectedCategory
      }, `scored ${newScore}/10 in Trivia`);
    }
  };

  const resetGame = () => {
    setGameStatus('selecting');
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setScore(0);
  };

  return (
    <GameShell gameId="trivia">
      <div className="flex flex-col min-h-[calc(100vh-48px)] p-4 sm:p-6 max-w-4xl mx-auto w-full">
        
        {gameStatus === 'selecting' && (
          <div className="flex flex-col items-center justify-center flex-1 animate-in slide-in-from-bottom-4 duration-300 py-8">
            <h1 className="font-heading font-bold text-2xl text-main text-center mb-8">Choose your category</h1>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-lg mb-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  className="bg-surface rounded-2xl border border-border-subtle p-6 text-center cursor-pointer hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all flex flex-col items-center shadow-sm"
                  onClick={() => startGame(cat.id as TriviaCategory)}
                >
                  <span className="text-4xl mb-2">{cat.icon}</span>
                  <h3 className="font-semibold text-base text-main">{cat.name}</h3>
                  <span className="text-faint text-xs mt-1">{cat.count} questions</span>
                </button>
              ))}
            </div>

            <button
              className="w-full max-w-lg bg-surface rounded-2xl border border-border-subtle p-5 text-center cursor-pointer hover:border-[#8b5cf6] hover:bg-[#8b5cf6]/5 transition-all flex items-center justify-center gap-3 shadow-sm"
              onClick={() => startGame('mixed')}
            >
              <span className="text-3xl">🎲</span>
              <div className="text-left">
                <h3 className="font-semibold text-base text-main">Mixed (All)</h3>
                <span className="text-faint text-xs">10 random questions</span>
              </div>
            </button>
          </div>
        )}

        {gameStatus === 'playing' && questions.length > 0 && (
          <div className="flex flex-col flex-1 py-4">
            <TriviaQuestionComponent
              question={questions[currentIndex]}
              questionNumber={currentIndex + 1}
              totalQuestions={10}
              onAnswer={handleAnswer}
            />
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="flex flex-col flex-1 py-4">
            <TriviaResult
              score={score}
              questions={questions}
              answers={answers}
              categoryName={selectedCategory || 'Mixed'}
              onPlayAgain={resetGame}
            />
          </div>
        )}

      </div>
    </GameShell>
  );
}
