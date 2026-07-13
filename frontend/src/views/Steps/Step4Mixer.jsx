import { Sliders } from 'lucide-react';

export default function Step4Mixer() {
  return (
    <div className="glass-panel">
      <div className="bg-black/20 -mx-6 -mt-6 mb-5 px-6 py-3 border-b border-white/5 rounded-t-[10px]">
        <div className="font-display font-medium text-white flex items-center gap-2">
          <Sliders size={18} className="text-ember" />
          Paso 4: Mezcla Virtual & Gain Staging
        </div>
      </div>
      
      <div className="bg-fire/5 border-l-[3px] border-fire px-4 py-3 text-muted text-[13px] rounded-r-[4px] mb-5">
        Utiliza las recomendaciones de <strong>Gain Stage</strong> RMS calculadas en segundo plano para nivelar la sonoridad de los canales. Configura el balance (Pan) y el volumen antes de exportar.
      </div>
      
      <div className="flex bg-[#050505]/50 border border-white/5 rounded-lg p-5 min-h-[300px] overflow-x-auto custom-scrollbar gap-2">
        <div className="text-center text-muted text-[12px] m-auto">
          No hay pistas cargadas para mezclar.
        </div>
      </div>
    </div>
  );
}
