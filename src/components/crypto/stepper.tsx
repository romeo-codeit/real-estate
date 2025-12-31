import React from 'react';

interface StepperProps {
  currentStep: number;
  totalSteps: number;
}

const Stepper: React.FC<StepperProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="flex items-center space-x-2">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <div
            className={`flex items-center justify-center h-8 w-8 rounded-full font-semibold text-sm
              ${
                index + 1 === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-card/5 text-muted-foreground'
              }`}
          >
            {index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div
              className={`h-0.5 w-8 
                ${index + 1 < currentStep ? 'bg-blue-300' : 'bg-gray-200'}
              `}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;
