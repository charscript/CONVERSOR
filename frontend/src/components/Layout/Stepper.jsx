import { useAppStore } from '../../store/useAppStore';

export default function Stepper() {
  const currentStep = useAppStore(state => state.currentStep);
  const setCurrentStep = useAppStore(state => state.setCurrentStep);
  const workspacePath = useAppStore(state => state.workspacePath);

  const handleStepClick = (step) => {
    if (workspacePath) {
      setCurrentStep(step);
    }
  };

  const steps = [
    { num: 1, label: 'Origen' },
    { num: 2, label: 'Diagnóstico' },
    { num: 3, label: 'Alineación' },
    { num: 4, label: 'Mezcla' },
    { num: 5, label: 'Exportación' }
  ];

  return (
    <div className="flex justify-between items-center bg-[#0a0505]/30 border border-white/5 rounded-lg px-5 py-[14px] mb-5 backdrop-blur-[10px] w-full col-span-full">
      {steps.map((step, idx) => {
        const isActive = currentStep === step.num;
        const isCompleted = currentStep > step.num;
        
        return (
          <div key={step.num} className="flex items-center flex-grow last:flex-grow-0">
            <div 
              className={`flex items-center gap-2 cursor-pointer transition-all duration-300 ${
                isActive ? 'opacity-100' : isCompleted ? 'opacity-85' : 'opacity-40'
              }`}
              onClick={() => handleStepClick(step.num)}
            >
              <span className={`w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center text-[11px] font-bold font-display transition-all duration-300 ${
                isActive ? 'border-fire text-fire bg-fire/10 shadow-[0_0_12px_rgba(255,45,45,0.3),0_0_25px_rgba(255,106,0,0.1)]' :
                isCompleted ? 'border-ember text-ember bg-ember/10' :
                'border-muted'
              }`}>
                {step.num}
              </span>
              <span className={`text-[13px] font-semibold font-display transition-all duration-300 ${
                isActive ? 'text-white drop-shadow-[0_0_6px_rgba(255,45,45,0.2)]' : 'text-muted'
              }`}>
                {step.label}
              </span>
            </div>
            
            {idx < steps.length - 1 && (
              <div className={`flex-grow h-[1px] mx-3 transition-all duration-300 ${
                isCompleted ? 'bg-gradient-to-r from-fire to-ember shadow-[0_0_6px_rgba(255,45,45,0.15)]' : 'bg-white/5'
              }`}></div>
            )}
          </div>
        );
      })}
    </div>
  );
}
