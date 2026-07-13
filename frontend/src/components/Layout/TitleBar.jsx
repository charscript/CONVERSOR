import { X, Minus, Maximize2, Activity } from 'lucide-react';

export default function TitleBar() {
  return (
    <div className="bg-gradient-to-b from-[#1a1010] to-[#110a0a] border-b border-fire/10 px-4 py-2 flex items-center sticky top-0 z-[200] select-none" style={{ WebkitAppRegion: 'drag' }}>
      <div className="flex gap-2 items-center" style={{ WebkitAppRegion: 'no-drag' }}>
        <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] hover:brightness-110 hover:scale-110 transition-all cursor-pointer"></div>
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] hover:brightness-110 hover:scale-110 transition-all cursor-pointer"></div>
        <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] hover:brightness-110 hover:scale-110 transition-all cursor-pointer"></div>
      </div>
      
      <div className="flex-grow text-center font-display text-[12px] font-medium text-[#777] tracking-wider flex items-center justify-center gap-2">
        <Activity size={12} className="text-fire" />
        FreePTX v2.1.0 — Professional DAW Interoperability
      </div>
      
      <div className="w-[52px]"></div> {/* Spacer for centering */}
    </div>
  );
}
