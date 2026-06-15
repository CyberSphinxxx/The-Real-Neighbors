import { useState, useEffect, useRef } from 'react';
import { GameShell } from '../../components/games/GameShell';
import { WordleBoard, type CellData, type CellState } from '../../components/games/wordle/WordleBoard';
import { WordleKeyboard, type LetterState } from '../../components/games/wordle/WordleKeyboard';
import { getDailyWord, getDailyWordNumber, VALID_GUESSES, WORDLE_ANSWERS } from '../../lib/wordleWords';
import { submitScore } from '../../lib/gameUtils';
import { ShareToFeedModal } from '../../components/games/ShareToFeedModal';
import toast from 'react-hot-toast';

type GameStatus = 'playing' | 'won' | 'lost';

const INITIAL_BOARD = Array(6).fill(null).map(() => 
  Array(5).fill({ letter: '', state: 'empty' as CellState })
);

export default function WordlePage() {
  const [guesses, setGuesses] = useState<CellData[][]>(INITIAL_BOARD);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({});
  const [invalidShake, setInvalidShake] = useState(false);
  
  const [dailyWord] = useState(() => getDailyWord());
  const [dailyNumber] = useState(() => getDailyWordNumber());
  
  const [nextWordTime, setNextWordTime] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const scoreSubmittedRef = useRef(false);

  // Load state from local storage on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedKey = `wordle_${today}`;
    const savedState = localStorage.getItem(savedKey);
    
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGuesses(parsed.guesses);
        setCurrentRow(parsed.currentRow);
        setGameStatus(parsed.gameStatus);
        setLetterStates(parsed.letterStates);
        
        // If already finished, ensure we don't submit score again
        if (parsed.gameStatus !== 'playing') {
          scoreSubmittedRef.current = true;
        }
      } catch (e) {
        console.error("Failed to parse saved Wordle state", e);
      }
    }
  }, []);

  // Save state to local storage when it changes
  useEffect(() => {
    if (currentRow === 0 && currentGuess.length === 0 && gameStatus === 'playing') return; // Skip saving initial empty state
    
    const today = new Date().toISOString().split('T')[0];
    const savedKey = `wordle_${today}`;
    const stateToSave = {
      guesses,
      currentRow,
      gameStatus,
      letterStates
    };
    localStorage.setItem(savedKey, JSON.stringify(stateToSave));
  }, [guesses, currentRow, gameStatus, letterStates]);

  // Handle score submission
  useEffect(() => {
    if (gameStatus !== 'playing' && !scoreSubmittedRef.current) {
      scoreSubmittedRef.current = true;
      const score = gameStatus === 'won' ? (7 - currentRow) * 100 : 0;
      
      if (gameStatus === 'won') {
        submitScore('wordle', score, {
          attempts: currentRow,
          word: dailyWord,
          won: true
        }, `scored ${currentRow}/6 in Wordle`);
      } else {
        submitScore('wordle', 0, {
          attempts: 6,
          word: dailyWord,
          won: false
        }, `didn't guess the Wordle`);
      }
    }
  }, [gameStatus, currentRow, dailyWord]);

  // Timer for next day
  useEffect(() => {
    if (gameStatus === 'playing') return;
    
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      
      setNextWordTime(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameStatus]);

  const onKeyPress = (key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'ENTER') {
      submitGuess();
    } else if (key === 'BACKSPACE') {
      if (currentGuess.length > 0) {
        const newGuess = [...currentGuess];
        newGuess.pop();
        setCurrentGuess(newGuess);
        updateBoard(newGuess);
      }
    } else if (currentGuess.length < 5) {
      const newGuess = [...currentGuess, key];
      setCurrentGuess(newGuess);
      updateBoard(newGuess);
    }
  };

  const updateBoard = (guess: string[]) => {
    setGuesses(prev => {
      const newGuesses = [...prev];
      const newRow = Array(5).fill(null).map((_, i) => ({
        letter: guess[i] || '',
        state: guess[i] ? ('filled' as CellState) : ('empty' as CellState)
      }));
      newGuesses[currentRow] = newRow;
      return newGuesses;
    });
  };

  const submitGuess = () => {
    if (currentGuess.length !== 5) {
      toast.error('Not enough letters');
      triggerShake();
      return;
    }

    const word = currentGuess.join('');
    if (!VALID_GUESSES.includes(word) && !WORDLE_ANSWERS.includes(word)) {
      toast.error('Not a valid word');
      triggerShake();
      return;
    }

    evaluateGuess(word);
  };

  const triggerShake = () => {
    setInvalidShake(true);
    setTimeout(() => setInvalidShake(false), 400);
  };

  const evaluateGuess = (guessWord: string) => {
    const answerArr = dailyWord.split('');
    const guessArr = guessWord.split('');
    const newRowState: CellData[] = Array(5).fill({ letter: '', state: 'absent' });
    const answerLetterCounts: Record<string, number> = {};

    // Count letters in answer
    answerArr.forEach(letter => {
      answerLetterCounts[letter] = (answerLetterCounts[letter] || 0) + 1;
    });

    // First pass: Correct letters
    guessArr.forEach((letter, i) => {
      if (answerArr[i] === letter) {
        newRowState[i] = { letter, state: 'correct' };
        answerLetterCounts[letter]--;
      }
    });

    // Second pass: Present letters
    guessArr.forEach((letter, i) => {
      if (newRowState[i].state !== 'correct') {
        if (answerLetterCounts[letter] > 0) {
          newRowState[i] = { letter, state: 'present' };
          answerLetterCounts[letter]--;
        } else {
          newRowState[i] = { letter, state: 'absent' };
        }
      }
    });

    // Update board
    setGuesses(prev => {
      const newGuesses = [...prev];
      newGuesses[currentRow] = newRowState;
      return newGuesses;
    });

    // Update keyboard letter states
    setLetterStates(prev => {
      const next = { ...prev };
      newRowState.forEach(({ letter, state }) => {
        const currentBest = next[letter];
        if (state === 'correct') {
          next[letter] = 'correct';
        } else if (state === 'present' && currentBest !== 'correct') {
          next[letter] = 'present';
        } else if (state === 'absent' && currentBest !== 'correct' && currentBest !== 'present') {
          next[letter] = 'absent';
        }
      });
      return next;
    });

    // Check win/loss
    if (guessWord === dailyWord) {
      setTimeout(() => setGameStatus('won'), 1500); // Wait for flip animation
      setCurrentRow(prev => prev + 1);
    } else if (currentRow === 5) {
      setTimeout(() => setGameStatus('lost'), 1500);
      setCurrentRow(prev => prev + 1);
    } else {
      setCurrentRow(prev => prev + 1);
      setCurrentGuess([]);
    }
  };

  const getEmojiGrid = () => {
    return guesses.slice(0, currentRow).map(row => {
      return row.map(cell => {
        if (cell.state === 'correct') return '🟩';
        if (cell.state === 'present') return '🟨';
        return '⬛';
      }).join('');
    }).join('\n');
  };

  const getShareText = () => {
    const attemptsStr = gameStatus === 'won' ? currentRow.toString() : 'X';
    return `📝 Wordle #${dailyNumber} ${attemptsStr}/6\n\n${getEmojiGrid()}\n\n— played on The Real Neighbors`;
  };

  return (
    <GameShell gameId="wordle">
      <div className="flex flex-col items-center h-full">
        
        <div className="flex-1 w-full max-w-md mx-auto flex flex-col justify-center my-4 overflow-y-auto min-h-0">
          <WordleBoard 
            guesses={guesses} 
            currentRowIndex={currentRow} 
            invalidShake={invalidShake} 
          />
        </div>

        {/* Keyboard or Result overlay */}
        {gameStatus === 'playing' ? (
          <div className="w-full pb-4 sm:pb-8 mt-auto z-20 shrink-0">
            <WordleKeyboard 
              onKeyPress={onKeyPress} 
              letterStates={letterStates} 
            />
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto p-6 bg-surface border border-border-subtle rounded-2xl shadow-lg mb-8 text-center animate-in slide-in-from-bottom-4 duration-300">
            <div className="text-5xl mb-4">{gameStatus === 'won' ? '🎉' : '😭'}</div>
            
            {gameStatus === 'won' ? (
              <>
                <h2 className="font-heading font-bold text-2xl text-main mb-2">
                  {['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][currentRow - 1]}
                </h2>
                <p className="text-main font-semibold">You got it in {currentRow}/6!</p>
              </>
            ) : (
              <>
                <h2 className="font-heading font-bold text-2xl text-main mb-2">Better luck tomorrow!</h2>
                <p className="text-main mb-1">The word was:</p>
                <p className="font-bold text-xl text-primary tracking-widest">{dailyWord}</p>
              </>
            )}

            <div className="bg-elevated p-4 rounded-xl my-6 whitespace-pre font-mono text-sm inline-block mx-auto">
              {getEmojiGrid()}
            </div>

            <div className="flex flex-col gap-3">
              <button 
                className="w-full bg-primary text-on-primary rounded-full py-3 font-medium hover:brightness-110 transition-colors flex justify-center items-center gap-2"
                onClick={() => setShowShareModal(true)}
              >
                Share Result 🎮
              </button>
              
              <div className="text-muted text-sm pt-4 border-t border-border-subtle">
                <p>Next word in</p>
                <p className="font-mono font-medium text-lg mt-1">{nextWordTime}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showShareModal && (
        <ShareToFeedModal
          gameId="wordle"
          scoreDisplay={`${gameStatus === 'won' ? currentRow : 'X'}/6`}
          resultCard={
            <div className="text-center font-mono text-sm leading-tight">
              <div className="mb-2 font-sans font-semibold">Wordle #{dailyNumber}</div>
              {getEmojiGrid()}
            </div>
          }
          shareText={getShareText()}
          onClose={() => setShowShareModal(false)}
          onShare={() => {}}
        />
      )}
    </GameShell>
  );
}
