import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

export default function StatusBar() {
  const [cpuVal, setCpuVal] = useState(12);
  const config = useAppStore(state => state.config);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuVal(Math.floor(8 + Math.random() * 18));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-gradient-to-b from-[#0f0909] to-[#0a0606] border-t border-fire/10 px-5 py-[5px] flex justify-between items-center font-display text-[11px] text-[#666] sticky bottom-0 z-[150] backdrop-blur-md mt-auto">
      <div className="flex items-center gap-[10px]">
        <span className="text-[#666] tracking-[0.2px]">
          <kbd className="bg-white/5 border border-white/10 rounded-[3px] px-1 font-display text-[10px] text-[#888] mx-[1px] shadow-[0_1px_0_rgba(0,0,0,0.3)]">⌘</kbd>+<kbd className="bg-white/5 border border-white/10 rounded-[3px] px-1 font-display text-[10px] text-[#888] mx-[1px] shadow-[0_1px_0_rgba(0,0,0,0.3)]">S</kbd> Escanear
        </span>
        <span className="w-[1px] h-[14px] bg-white/5"></span>
        <span className="text-[#666] tracking-[0.2px]">
          <kbd className="bg-white/5 border border-white/10 rounded-[3px] px-1 font-display text-[10px] text-[#888] mx-[1px] shadow-[0_1px_0_rgba(0,0,0,0.3)]">⌘</kbd>+<kbd className="bg-white/5 border border-white/10 rounded-[3px] px-1 font-display text-[10px] text-[#888] mx-[1px] shadow-[0_1px_0_rgba(0,0,0,0.3)]">E</kbd> Exportar
        </span>
      </div>
      
      <div className="flex items-center gap-[10px]">
        <span className="bg-fire/5 border border-fire/10 py-[2px] px-2 rounded-[4px] text-[#999] text-[10px] font-medium tracking-[0.3px]">
          {(config.sample_rate / 1000).toFixed(1)}kHz / {config.bit_depth}
        </span>
        <span className="w-[1px] h-[14px] bg-white/5"></span>
        <span className="bg-fire/5 border border-fire/10 py-[2px] px-2 rounded-[4px] text-[#999] text-[10px] font-medium tracking-[0.3px]">
          Buffer: 512
        </span>
        <span className="w-[1px] h-[14px] bg-white/5"></span>
        
        <span className="flex items-center gap-[6px]">
          <span className="text-[#666] font-semibold text-[10px]">CPU</span>
          <span className="w-[50px] h-[6px] bg-white/5 rounded-[3px] overflow-hidden border border-white/5">
            <span 
              className="block h-full bg-gradient-to-r from-[#28c840] to-[#ffbd2e] rounded-[3px] transition-all duration-1000 ease-in-out" 
              style={{ width: `${cpuVal}%` }}
            ></span>
          </span>
          <span className="text-[#888] text-[10px] font-display min-w-[28px]">{cpuVal}%</span>
        </span>
        
        <span className="w-[1px] h-[14px] bg-white/5"></span>
        <span className="text-fire/40 text-[10px] font-semibold">v2.3.0</span>
      </div>
    </footer>
  );
}
