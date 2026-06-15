import React from 'react';

interface ChoiceButtonsProps {
  choices: string[];
  correctAnswer: string;
  alternates: string[];
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
  disabled: boolean;
}

export const ChoiceButtons: React.FC<ChoiceButtonsProps> = ({
  choices,
  correctAnswer,
  alternates,
  selectedAnswer,
  onSelect,
  disabled
}) => {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  const isCorrect = (choice: string) => {
    return choice === correctAnswer || alternates.includes(choice);
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto mt-6 px-4 md:px-0">
      {choices.map((choice, index) => {
        const correct = isCorrect(choice);
        const selected = selectedAnswer === choice;
        
        let buttonClass = "bg-elevated border-border text-main";
        
        if (disabled) {
          if (correct) {
            buttonClass = "bg-green-500/15 border-green-500 text-green-400 scale-[1.02] z-10";
          } else if (selected) {
            buttonClass = "bg-red-500/15 border-red-500 text-red-400 animate-[shake_0.3s_ease-in-out]";
          } else {
            buttonClass = "bg-elevated border-border text-main opacity-40";
          }
        } else {
          buttonClass += " hover:border-primary hover:bg-primary/5 hover:scale-[1.02]";
        }

        return (
          <button
            key={index}
            disabled={disabled}
            onClick={() => onSelect(choice)}
            className={`relative min-h-[56px] py-4 px-3 rounded-xl border-2 text-center font-semibold text-base md:text-lg transition-all duration-150 cursor-pointer disabled:cursor-default select-none ${buttonClass}`}
          >
            {!disabled && (
              <span className="absolute top-2 left-3 text-faint text-xs font-normal">
                {letters[index]}
              </span>
            )}
            {choice}
          </button>
        );
      })}
    </div>
  );
};
