import React from 'react';

export type CellState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';

export interface CellData {
  letter: string;
  state: CellState;
}

interface WordleBoardProps {
  guesses: CellData[][];
  currentRowIndex: number;
  invalidShake: boolean;
}

export const WordleBoard: React.FC<WordleBoardProps> = ({ guesses, currentRowIndex, invalidShake }) => {
  return (
    <div className="grid grid-rows-6 gap-1.5 sm:gap-2 mb-8 mx-auto w-fit p-4">
      {guesses.map((row, i) => (
        <div 
          key={i} 
          className={`grid grid-cols-5 gap-1.5 sm:gap-2 ${
            i === currentRowIndex && invalidShake ? 'animate-[shake_400ms_ease-in-out]' : ''
          }`}
        >
          {row.map((cell, j) => {
            let cellClasses = "w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-md flex items-center justify-center font-heading font-bold text-lg sm:text-xl uppercase select-none ";
            
            // Cell styling based on state
            if (cell.state === 'empty') {
              cellClasses += "bg-transparent border-border-subtle text-main";
            } else if (cell.state === 'filled') {
              cellClasses += "bg-elevated border-primary text-main animate-[pop_80ms_ease-in-out]";
            } else if (cell.state === 'correct') {
              cellClasses += "bg-[#6aaa64] border-[#6aaa64] text-white";
            } else if (cell.state === 'present') {
              cellClasses += "bg-[#c9b458] border-[#c9b458] text-white";
            } else if (cell.state === 'absent') {
              cellClasses += "bg-[#787c7e] border-[#787c7e] text-white";
            }

            // If it's a submitted row (past currentRow), add flip animation
            const isSubmitted = i < currentRowIndex || (i === 5 && cell.state !== 'filled' && cell.state !== 'empty');
            
            return (
              <div 
                key={j} 
                className={`transition-colors duration-150 ${cellClasses}`}
                style={{
                  animation: isSubmitted ? `flip 300ms ease-in forwards ${j * 100}ms` : undefined,
                  transformStyle: 'preserve-3d'
                }}
              >
                {cell.letter}
              </div>
            );
          })}
        </div>
      ))}
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes flip {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(90deg); }
          100% { transform: rotateX(0deg); }
        }
      `}</style>
    </div>
  );
};
