import { Activity, Music } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function ExpertView() {
  const config = useAppStore(state => state.config);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_1fr] gap-6 relative z-[1]">
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-6 min-h-[400px]">
          <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
            <Activity className="text-ember" size={20} />
            <h2 className="text-xl text-white font-display">Alineador de Stems & Mezclador</h2>
          </div>
          
          <div className="text-center text-muted text-[13px] py-10">
            Vista Experta unificada (En construcción)
          </div>
        </div>
      </div>
      
      <aside className="flex flex-col gap-6">
        <div className="glass-panel">
          <div className="bg-black/20 -mx-6 -mt-6 mb-5 px-6 py-3 border-b border-white/5 rounded-t-[10px]">
            <div className="font-display font-medium text-white flex items-center gap-2">
              <Music size={18} className="text-cyan" />
              Teoría Musical & Escalas
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-1 text-[13px]">
            <span className="font-medium">Escala del Proyecto:</span>
            <span className="font-bold text-cyan text-[14px]">{config.key || 'C Minor'}</span>
          </div>
          
          <div className="mb-4">
            <div className="text-muted text-[11px] mb-1">Notas en la escala:</div>
            <div className="flex flex-wrap gap-1">
              {['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'].map(note => (
                <span key={note} className="bg-black/30 border border-white/10 text-cyan px-2 py-0.5 rounded-[4px] text-[11px] font-bold font-display shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                  {note}
                </span>
              ))}
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-3">
            <div className="font-medium mb-2 text-[12px]">Calculadora de Transposición:</div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-muted text-[11px] w-[80px]">Tono Original:</span>
              <select className="input-glow flex-grow py-1 px-2 text-[11px]">
                <option value="C">C / Do</option>
                <option value="C#">C# / Do#</option>
                <option value="D">D / Re</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted text-[11px] w-[80px]">Tono Destino:</span>
              <select className="input-glow flex-grow py-1 px-2 text-[11px]">
                <option value="C">C / Do</option>
                <option value="C#">C# / Do#</option>
                <option value="D">D / Re</option>
              </select>
            </div>
            <div className="bg-black/20 border border-white/5 rounded p-2 text-center text-[12px] font-display">
              Ajuste de Pitch: <span className="font-bold text-white ml-1">0 Semitonos</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
