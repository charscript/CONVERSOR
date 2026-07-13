import Stepper from '../components/Layout/Stepper';
import Step1Origin from './Steps/Step1Origin';
import { useAppStore } from '../store/useAppStore';

export default function WizardView() {
  const currentStep = useAppStore(state => state.currentStep);
  const setCurrentStep = useAppStore(state => state.setCurrentStep);
  const workspacePath = useAppStore(state => state.workspacePath);

  const nextStep = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="flex flex-col relative z-[1]">
      <Stepper />

      <div className="relative w-full">
        <div className={`transition-all duration-700 ease-smooth ${currentStep === 1 ? 'opacity-100 block animate-[wizard-slide-forward_0.7s_cubic-bezier(0.25,1,0.05,1)_forwards]' : 'hidden'}`}>
          <Step1Origin />
        </div>
        <div className={`transition-all duration-700 ease-smooth ${currentStep === 2 ? 'opacity-100 block animate-[wizard-slide-forward_0.7s_cubic-bezier(0.25,1,0.05,1)_forwards]' : 'hidden'}`}>
          <div className="glass-panel p-6 text-center h-[300px] flex items-center justify-center">
            <h2 className="text-xl text-ember font-display">Paso 2: Diagnóstico (En Construcción)</h2>
          </div>
        </div>
        <div className={`transition-all duration-700 ease-smooth ${currentStep === 3 ? 'opacity-100 block animate-[wizard-slide-forward_0.7s_cubic-bezier(0.25,1,0.05,1)_forwards]' : 'hidden'}`}>
          <div className="glass-panel p-6 text-center h-[300px] flex items-center justify-center">
            <h2 className="text-xl text-fire font-display">Paso 3: Alineación (En Construcción)</h2>
          </div>
        </div>
        <div className={`transition-all duration-700 ease-smooth ${currentStep === 4 ? 'opacity-100 block animate-[wizard-slide-forward_0.7s_cubic-bezier(0.25,1,0.05,1)_forwards]' : 'hidden'}`}>
          <div className="glass-panel p-6 text-center h-[300px] flex items-center justify-center">
            <h2 className="text-xl text-ember font-display">Paso 4: Mezcla (En Construcción)</h2>
          </div>
        </div>
        <div className={`transition-all duration-700 ease-smooth ${currentStep === 5 ? 'opacity-100 block animate-[wizard-slide-forward_0.7s_cubic-bezier(0.25,1,0.05,1)_forwards]' : 'hidden'}`}>
          <div className="glass-panel p-6 text-center h-[300px] flex items-center justify-center">
            <h2 className="text-xl text-fire font-display">Paso 5: Exportación (En Construcción)</h2>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-5 bg-[#0a0505]/20 border border-white/5 rounded-lg p-3">
        <button 
          className="btn-secondary"
          disabled={currentStep === 1}
          onClick={prevStep}
        >
          ⬅️ Anterior
        </button>
        <button 
          className="btn-primary"
          disabled={currentStep === 1 && !workspacePath}
          onClick={nextStep}
        >
          {currentStep === 5 ? '¡Flujo Completado! 🎉' : 'Siguiente ➡️'}
        </button>
      </div>
    </div>
  );
}
