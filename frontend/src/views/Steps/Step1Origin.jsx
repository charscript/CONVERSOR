import { Search, FolderOpen } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function Step1Origin() {
  const workspacePath = useAppStore(state => state.workspacePath);
  const setWorkspacePath = useAppStore(state => state.setWorkspacePath);
  const config = useAppStore(state => state.config);
  
  const handleScan = async () => {
    // API logic will be implemented here
    console.log("Scanning", workspacePath);
  };

  const chooseDir = async () => {
    try {
      const res = await fetch('/api/choose-directory');
      const data = await res.json();
      if (data && data.path) {
        setWorkspacePath(data.path);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="glass-panel p-[25px]">
      <h2 className="text-[20px] text-white mb-5 flex items-center gap-2 font-display font-semibold">
        <span>📁</span> Paso 1: Origen de la Sesión
      </h2>
      
      {!workspacePath ? (
        <div className="bg-black/25 border border-dashed border-white/5 rounded-lg p-[30px] text-center mb-5">
          <span className="text-[40px] block mb-3">🔍</span>
          <span className="text-muted text-[14px] block mb-5 max-w-[600px] mx-auto">
            Selecciona la carpeta local de tu proyecto utilizando el buscador. El sistema escaneará el directorio buscando stems de audio, archivos FLP de FL Studio y reportes de metadatos de Pro Tools.
          </span>
          
          <div className="flex items-center justify-center gap-[10px] mt-[15px]">
            <button onClick={chooseDir} className="btn-secondary px-3 py-2 text-[16px] min-w-[44px] h-[38px]" title="Buscar Carpeta en Finder">
              <FolderOpen size={18} />
            </button>
            <input 
              type="text" 
              className="input-glow min-w-[250px]" 
              placeholder="Ruta local del proyecto..." 
              value={workspacePath}
              onChange={(e) => setWorkspacePath(e.target.value)}
            />
            <button onClick={handleScan} className="btn-primary">
              <Search size={16} strokeWidth={2.5} />
              Escanear
            </button>
          </div>
        </div>
      ) : (
        <div className="animate-[fade-in_0.5s_ease-out]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="metric-card bg-[#0a0a0a]/50 border border-white/5 rounded-[10px] p-[14px] text-center">
              <div className="text-[12px] uppercase tracking-[1px] text-muted mb-[6px]">Tempo del Proyecto</div>
              <div className="font-display text-[20px] font-bold text-fire drop-shadow-[0_0_10px_rgba(255,45,45,0.35)]">{config.bpm} BPM</div>
            </div>
            <div className="metric-card bg-[#0a0a0a]/50 border border-white/5 rounded-[10px] p-[14px] text-center">
              <div className="text-[12px] uppercase tracking-[1px] text-muted mb-[6px]">Escala / Tonalidad</div>
              <div className="font-display text-[20px] font-bold text-white">{config.key}</div>
            </div>
            <div className="metric-card bg-[#0a0a0a]/50 border border-white/5 rounded-[10px] p-[14px] text-center">
              <div className="text-[12px] uppercase tracking-[1px] text-muted mb-[6px]">Métrica (Compás)</div>
              <div className="font-display text-[20px] font-bold text-ember drop-shadow-[0_0_10px_rgba(255,106,0,0.35)]">{config.time_sig}</div>
            </div>
            <div className="metric-card bg-[#0a0a0a]/50 border border-white/5 rounded-[10px] p-[14px] text-center">
              <div className="text-[12px] uppercase tracking-[1px] text-muted mb-[6px]">Marcadores</div>
              <div className="font-display text-[20px] font-bold text-white">{config.markers.length}</div>
            </div>
          </div>
          
          <div className="bg-[#00ff66]/5 border border-[#00ff66]/20 rounded-lg p-[15px] mt-[15px]">
            <span className="text-[#00ff66] font-bold text-[13px] block mb-1">✅ ¡Escanéo Exitoso!</span>
            <p className="text-[13px] m-0 text-muted">
              Hemos cargado los metadatos de la sesión de audio correctamente. Haz clic en Siguiente para analizar los archivos WAV.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
