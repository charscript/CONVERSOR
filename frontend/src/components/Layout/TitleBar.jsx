import { Minus, Square, X, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function TitleBar() {
  const appVersion = useAppStore(state => state.appVersion);

  const handleClose = () => {
    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.close_window();
    }
  };

  const handleMinimize = () => {
    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.minimize_window();
    }
  };

  const handleMaximize = () => {
    if (window.pywebview && window.pywebview.api) {
      window.pywebview.api.maximize_window();
    }
  };

  return (
    <div 
      className="h-[33px] bg-[#000] border-b border-white/10 flex items-center px-3 justify-between pywebview-drag-region sticky top-0 z-[999]"
      style={{ WebkitAppRegion: 'drag' }}
    >
      <div className="flex gap-2 items-center w-[52px]">
        {/* macOS Traffic Lights Style */}
        <button onClick={handleClose} className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center group" style={{ WebkitAppRegion: 'no-drag' }}>
          <X size={8} className="opacity-0 group-hover:opacity-100 text-[#4c0000]" />
        </button>
        <button onClick={handleMinimize} className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center group" style={{ WebkitAppRegion: 'no-drag' }}>
          <Minus size={8} className="opacity-0 group-hover:opacity-100 text-[#5a3000]" />
        </button>
        <button onClick={handleMaximize} className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center group" style={{ WebkitAppRegion: 'no-drag' }}>
          <Square size={6} className="opacity-0 group-hover:opacity-100 text-[#004d09]" />
        </button>
      </div>
      
      <div className="flex-grow text-center font-display text-[12px] font-medium text-[#777] tracking-wider flex items-center justify-center gap-2">
        <Activity size={12} className="text-fire" />
        FreePTX {appVersion || '...'} — Professional DAW Interoperability
      </div>
      
      <div className="w-[52px]"></div> {/* Spacer for centering */}
    </div>
  );
}
