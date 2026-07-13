import { useAppStore } from '../../store/useAppStore';

export default function Header() {
  const viewMode = useAppStore(state => state.viewMode);
  const setViewMode = useAppStore(state => state.setViewMode);

  return (
    <header className="border-b border-fire/10 backdrop-blur-md bg-[#0a0a0a]/90 px-10 py-5 sticky top-[33px] z-[100] flex justify-between items-center">
      <div className="flex items-center gap-3">
        <img 
          src="/logo.png" 
          alt="FreePTX Logo" 
          className="max-h-[50px] w-auto object-contain scale-[2.2] origin-left ml-5" 
        />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted font-semibold whitespace-nowrap">Vista Experta</span>
          <label className="relative inline-block w-[44px] h-[22px]">
            <input 
              type="checkbox" 
              className="opacity-0 w-0 h-0 peer"
              checked={viewMode === 'expert'}
              onChange={(e) => setViewMode(e.target.checked ? 'expert' : 'wizard')}
            />
            <span className="absolute cursor-pointer inset-0 bg-white/5 border border-white/5 rounded-[22px] transition-all duration-300 peer-checked:bg-fire/10 peer-checked:border-fire/35 before:absolute before:content-[''] before:h-[14px] before:w-[14px] before:left-[3px] before:bottom-[3px] before:bg-muted before:rounded-full before:transition-all before:duration-300 peer-checked:before:translate-x-[22px] peer-checked:before:bg-fire peer-checked:before:shadow-[0_0_10px_rgba(255,45,45,0.5),0_0_20px_rgba(255,106,0,0.2)]"></span>
          </label>
        </div>
      </div>
    </header>
  );
}
