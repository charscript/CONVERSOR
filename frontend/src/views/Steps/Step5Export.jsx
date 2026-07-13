import { Download, Play, Save } from 'lucide-react';

export default function Step5Export() {
  return (
    <div className="glass-panel">
      <div className="bg-black/20 -mx-6 -mt-6 mb-5 px-6 py-3 border-b border-white/5 rounded-t-[10px]">
        <div className="font-display font-medium text-white flex items-center gap-2">
          <Save size={18} className="text-fire" />
          Paso 5: Destino & Generación de Sesiones
        </div>
      </div>
      
      <div className="bg-fire/5 border-l-[3px] border-fire px-4 py-3 text-muted text-[13px] rounded-r-[4px] mb-5">
        Genera los archivos finales compatibles con tu DAW de destino o sincroniza directamente en vivo.
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Pro Tools Section */}
        <div className="bg-[#110a0f] border border-[#ff0099]/30 rounded-lg p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#ff0099] rounded-full blur-[80px] opacity-[0.15] -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex justify-between items-center w-full mb-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#ff0099] text-white text-[11px] font-bold px-2 py-0.5 rounded-[4px] tracking-wider">Pro Tools</span>
              <span className="text-[#ff5f57] border border-[#ff5f57] bg-[#ff5f57]/10 text-[9px] font-bold px-[5px] py-0.5 rounded-[3px] tracking-wide" title="Conexión en Vivo Pro Tools Scripting SDK (PTSL)">PTSL Desconectado</span>
            </div>
            <h3 className="text-[14px] font-medium m-0 text-white">Importar/Conformar</h3>
          </div>
          
          <p className="text-muted text-[12px] mb-4">
            Carga marcadores y automatizaciones. O utiliza la sincronización en vivo para montar la sesión en caliente.
          </p>
          
          <div className="mb-4 text-[13px] text-muted flex-grow">
            Sin datos detectados de Pro Tools.
          </div>
          
          <div className="flex flex-col gap-2 w-full mt-auto">
            <button className="btn-primary w-full justify-center" disabled>
              <Download size={16} />
              Generar MIDI de Tempo & Marcadores
            </button>
            <button className="btn-secondary w-full justify-center text-[#00ff66] border-[#00ff66]/20 bg-[#00ff66]/5" disabled>
              <Play size={16} />
              Construir Sesión en Pro Tools (Live)
            </button>
          </div>
        </div>

        {/* FL Studio / Reaper Section */}
        <div className="bg-[#110d05] border border-[#ff6a00]/30 rounded-lg p-5 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#ff6a00] rounded-full blur-[80px] opacity-[0.15] -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex justify-between items-center w-full mb-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="bg-[#ff6a00] text-white text-[11px] font-bold px-2 py-0.5 rounded-[4px] tracking-wider">FL Studio / Reaper</span>
            </div>
            <h3 className="text-[14px] font-medium m-0 text-white">Exportar Sesiones</h3>
          </div>
          
          <p className="text-muted text-[12px] mb-4">
            Genera proyectos formateados con colores, carpetas y mapeo de plugins equivalentes.
          </p>
          
          <div className="mb-4 text-[13px] text-muted flex-grow">
            Sin datos detectados de FL Studio.
          </div>
          
          <div className="flex flex-col gap-2 w-full mt-auto">
            <button className="btn-secondary w-full justify-center" disabled>
              <Save size={16} />
              Exportar Sesión a Reaper (.RPP)
            </button>
            <button className="btn-secondary w-full justify-center" disabled>
              Sincronizar Datos desde FLP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
