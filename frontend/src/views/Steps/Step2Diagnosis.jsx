import { useState } from 'react';
import { Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../api/client';

export default function Step2Diagnosis() {
  const wavFiles = useAppStore(state => state.wavFiles);
  const workspacePath = useAppStore(state => state.workspacePath);
  const config = useAppStore(state => state.config);
  
  const [track1, setTrack1] = useState('');
  const [track2, setTrack2] = useState('');
  const [phaseValue, setPhaseValue] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isResampling, setIsResampling] = useState(false);
  
  const hasMismatches = wavFiles && wavFiles.some(f => f.samplerate !== config.sample_rate);
  
  const handleAnalyzePhase = async () => {
    if (!track1 || !track2 || !workspacePath) return;
    setIsAnalyzing(true);
    try {
      const data = await api.getPhaseCorrelation(workspacePath, track1, track2);
      if (data && data.correlation !== undefined) {
        setPhaseValue(data.correlation);
      }
    } catch (err) {
      console.error("Phase correlation failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleResample = async () => {
    if (!workspacePath) return;
    setIsResampling(true);
    try {
      await api.resampleBatch(workspacePath);
      // Ideally we would trigger a re-scan here
    } catch (err) {
      console.error("Resample failed", err);
    } finally {
      setIsResampling(false);
    }
  };

  const getPhasePosition = () => {
    if (phaseValue === null) return '50%';
    // Maps -1.0 -> 0%, 0.0 -> 50%, 1.0 -> 100%
    return `${((phaseValue + 1) / 2) * 100}%`;
  };

  return (
    <div className="glass-panel">
      <div className="bg-black/20 -mx-6 -mt-6 mb-5 px-6 py-3 border-b border-white/5 rounded-t-[10px] flex justify-between items-center">
        <div className="font-display font-medium text-white flex items-center gap-2">
          <Activity size={18} className="text-ember" />
          Paso 2: Diagnóstico & Consolidación de Stems
        </div>
        {hasMismatches && (
          <button 
            onClick={handleResample}
            disabled={isResampling}
            className={`btn-secondary text-[11px] px-[10px] py-1 border-orange/30 text-orange bg-orange/5 ${isResampling ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {isResampling ? '⏳ Remuestreando...' : '🔄 Remuestrear Mismatches'}
          </button>
        )}
      </div>
      
      <div className="bg-fire/5 border-l-[3px] border-fire px-4 py-3 text-muted text-[13px] rounded-r-[4px] mb-5">
        Revisa incompatibilidades de frecuencia de muestreo. Los stems Split-Mono (.L / .R) han sido consolidados automáticamente a estéreo interleaved [ST].
      </div>
      
      <div className="bg-black/30 border border-white/5 rounded-lg p-2 min-h-[150px] max-h-[300px] overflow-y-auto custom-scrollbar mb-5">
        {wavFiles && wavFiles.length > 0 ? (
          wavFiles.map((file, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 px-3 hover:bg-white/5 border-b border-white/5 last:border-0">
              <span className="text-[13px] font-medium text-white">{file.name}</span>
              <span className={`text-[11px] font-bold ${file.samplerate !== config.sample_rate ? 'text-orange' : 'text-cyan'}`}>
                {file.samplerate} Hz
              </span>
            </div>
          ))
        ) : (
          <div className="text-center text-muted text-[12px] py-[15px]">
            No se han escaneado archivos WAV.
          </div>
        )}
      </div>

      <div className="bg-black/20 border border-white/5 rounded-lg p-4">
        <span className="text-[13px] font-semibold text-cyan block mb-2">Diagnóstico de Correlación de Fase</span>
        <div className="flex gap-2 items-center mb-4">
          <select 
            className="input-glow flex-grow py-1.5 px-2 text-[12px] text-white"
            value={track1}
            onChange={e => setTrack1(e.target.value)}
          >
            <option value="">-- Pista 1 --</option>
            {wavFiles.map(f => <option key={`t1-${f.name}`} value={f.name}>{f.name}</option>)}
          </select>
          <span className="text-muted text-[12px]">y</span>
          <select 
            className="input-glow flex-grow py-1.5 px-2 text-[12px] text-white"
            value={track2}
            onChange={e => setTrack2(e.target.value)}
          >
            <option value="">-- Pista 2 --</option>
            {wavFiles.map(f => <option key={`t2-${f.name}`} value={f.name}>{f.name}</option>)}
          </select>
          <button 
            onClick={handleAnalyzePhase} 
            disabled={isAnalyzing || !track1 || !track2}
            className="btn-secondary py-1.5 px-3 text-[12px]">
            {isAnalyzing ? 'Analizando...' : 'Analizar'}
          </button>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-pink font-bold w-[80px] text-right">-1.0 (Cancelado)</span>
          <div className="flex-grow h-2 bg-gradient-to-r from-pink via-black to-cyan rounded-full relative overflow-hidden">
            <div 
              className="absolute top-0 w-[4px] h-full bg-white shadow-[0_0_5px_#fff] transition-all duration-500 ease-out"
              style={{ left: getPhasePosition(), transform: 'translateX(-50%)' }}
            ></div>
          </div>
          <span className="text-[10px] text-cyan font-bold w-[80px]">+1.0 (En Fase)</span>
        </div>
        
        <div className="text-[11px] text-center mt-2 text-muted font-display font-medium">
          {phaseValue !== null ? `Correlación calculada: ${phaseValue.toFixed(2)}` : 'Selecciona dos pistas para calcular la compatibilidad de fase.'}
        </div>
      </div>
    </div>
  );
}
