import { useState } from 'react';
import { Clock, Play, Square } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../api/client';
import WaveformCanvas from '../../components/Audio/WaveformCanvas';

export default function Step3Alignment() {
  const config = useAppStore(state => state.config);
  const wavFiles = useAppStore(state => state.wavFiles);
  const workspacePath = useAppStore(state => state.workspacePath);
  
  const [selectedWav, setSelectedWav] = useState('');
  const [offset, setOffset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioEl, setAudioEl] = useState(null);
  
  const [isAligning, setIsAligning] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  
  const handlePlayToggle = () => {
    if (isPlaying && audioEl) {
      audioEl.pause();
      setIsPlaying(false);
    } else if (selectedWav && workspacePath) {
      const url = api.getAudioStreamUrl(workspacePath, selectedWav);
      const audio = new Audio(url);
      audio.play();
      setAudioEl(audio);
      setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
    }
  };
  
  const handleAlign = async () => {
    if (!workspacePath) return;
    setIsAligning(true);
    try {
      // Stubbing selected_files and offsets for simplicity in this demo view
      const selected = wavFiles.map(f => f.name);
      const offsets = {};
      selected.forEach(s => offsets[s] = 0); // Everything to 0 except the manually tweaked one
      if (selectedWav) offsets[selectedWav] = offset;
      
      await api.alignStems(workspacePath, selected, offsets);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAligning(false);
    }
  };
  
  const handleZip = async () => {
    if (!workspacePath) return;
    setIsZipping(true);
    try {
      await api.zipStems(workspacePath);
    } catch (err) {
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="glass-panel">
      <div className="bg-black/20 -mx-6 -mt-6 mb-5 px-6 py-3 border-b border-white/5 rounded-t-[10px]">
        <div className="font-display font-medium text-white flex items-center gap-2">
          <Clock size={18} className="text-cyan" />
          Paso 3: Alineación Temporal (Línea de Tiempo)
        </div>
      </div>
      
      <div className="bg-[#050202] border border-white/5 rounded-lg p-4 mb-5 relative min-h-[150px]">
        <div className="flex justify-between text-[10px] text-muted border-b border-white/10 pb-2 mb-2 font-display">
          <span>Inicio (Barra 1)</span>
          <span>20s</span>
          <span>40s</span>
          <span>60s</span>
          <span>80s</span>
          <span>Fin</span>
        </div>
        
        {wavFiles && wavFiles.length > 0 ? (
          <div className="flex flex-col gap-2 pt-2">
            {wavFiles.map((f, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedWav(f.name)}
                className={`h-[24px] rounded-[4px] border px-2 flex items-center text-[10px] cursor-pointer font-bold transition-all ${selectedWav === f.name ? 'border-cyan bg-cyan/20 text-cyan' : 'border-white/10 bg-white/5 text-muted hover:bg-white/10'}`}
              >
                {f.name}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted py-5 text-[13px]">
            Ingresa una ruta de directorio y escanea para visualizar la línea de tiempo.
          </div>
        )}
      </div>
      
      <div className="bg-black/20 border border-white/5 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePlayToggle}
              disabled={!selectedWav}
              className="w-6 h-6 rounded-full bg-cyan/20 border border-cyan/50 text-cyan flex items-center justify-center hover:bg-cyan/40 disabled:opacity-50"
            >
              {isPlaying ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" className="ml-0.5" />}
            </button>
            <span className="text-cyan text-[13px] font-semibold">{selectedWav || 'Visualizador de Onda'}</span>
          </div>
          <span className="text-muted text-[13px] font-display">0.00s</span>
        </div>
        <div className="h-[90px] bg-black/50 border border-white/10 rounded mb-3 overflow-hidden">
          <WaveformCanvas workspacePath={workspacePath} filename={selectedWav} audioEl={audioEl} isPlaying={isPlaying} />
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <span className="min-w-[90px] text-muted">Desfase Manual:</span>
          <input 
            type="range" 
            className="flex-grow accent-fire" 
            min="0" max="30" step="0.001" 
            value={offset}
            onChange={e => setOffset(parseFloat(e.target.value))}
            disabled={!selectedWav}
          />
          <span className="font-mono min-w-[60px] text-right text-white">{offset.toFixed(3)}s</span>
        </div>
      </div>
      
      <div className="flex gap-3 mb-6">
        <button 
          onClick={handleAlign}
          disabled={!workspacePath || isAligning}
          className="btn-primary flex-grow-[2] justify-center">
          {isAligning ? 'Alineando...' : 'Alinear Stems Seleccionados'}
        </button>
        <button 
          onClick={handleZip}
          disabled={!workspacePath || isZipping}
          className="btn-secondary flex-grow justify-center">
          {isZipping ? 'Empaquetando...' : 'Empaquetar Stems (ZIP)'}
        </button>
      </div>
      
      <div className="border-t border-white/5 pt-5">
        <h3 className="text-[14px] mb-3 text-cyan font-semibold">Marcadores Temporales de la Sesión</h3>
        <div className="w-full overflow-hidden border border-white/5 rounded-lg bg-black/20">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-black/30">
                <th className="py-2 px-3 text-[11px] uppercase tracking-wider text-[#555] font-semibold">#</th>
                <th className="py-2 px-3 text-[11px] uppercase tracking-wider text-[#555] font-semibold">Posición</th>
                <th className="py-2 px-3 text-[11px] uppercase tracking-wider text-[#555] font-semibold">Tiempo (s)</th>
                <th className="py-2 px-3 text-[11px] uppercase tracking-wider text-[#555] font-semibold">Nombre</th>
              </tr>
            </thead>
            <tbody>
              {config.markers && config.markers.length > 0 ? (
                config.markers.map((m, idx) => (
                  <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                    <td className="py-2 px-3 text-[12px] font-display text-cyan font-semibold">{idx+1}</td>
                    <td className="py-2 px-3 text-[12px] font-display">{m.location_raw}</td>
                    <td className="py-2 px-3 text-[12px] font-display">{m.location_seconds}s</td>
                    <td className="py-2 px-3 text-[12px] font-display text-white font-medium">{m.name}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-5 text-center text-muted text-[12px]">No hay marcadores cargados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
