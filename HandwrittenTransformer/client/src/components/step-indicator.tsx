interface StepIndicatorProps {
  currentStep: "template" | "notes" | "export";
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { id: "template", label: "Setup Template", number: 1 },
    { id: "notes", label: "Create Notes", number: 2 },
    { id: "export", label: "Export & Share", number: 3 },
  ];

  return (
    <div className="mb-12">
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep === step.id
                    ? "bg-primary text-white"
                    : steps.findIndex(s => s.id === currentStep) > index
                    ? "bg-accent text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {step.number}
              </div>
              <span
                className={`ml-3 text-sm font-medium ${
                  currentStep === step.id
                    ? "text-primary"
                    : steps.findIndex(s => s.id === currentStep) > index
                    ? "text-accent"
                    : "text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-1 rounded ml-4 ${
                  steps.findIndex(s => s.id === currentStep) > index
                    ? "bg-accent"
                    : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
