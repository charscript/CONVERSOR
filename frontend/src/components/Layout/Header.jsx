import { useAppStore } from '../../store/useAppStore';
import { useState, useEffect } from 'react';
import { Bug, Download } from 'lucide-react';

export default function Header() {
  const setAppVersion = useAppStore(state => state.setAppVersion);
  const [updateInfo, setUpdateInfo] = useState({ update_available: false, url: '' });

  useEffect(() => {
    fetch('/api/check-update')
      .then(r => r.json())
      .then(data => {
        if (data.current_version) {
          setAppVersion(data.current_version);
        }
        if (data.update_available && data.url) {
          setUpdateInfo(data);
        }
      }).catch(err => console.error('Error fetching update:', err));
  }, []);

  return (
    <header className="border-b border-fire/10 backdrop-blur-md bg-[#0a0a0a]/90 px-10 py-5 sticky top-[33px] z-[100] flex justify-between items-center">
      <div className="flex items-center gap-3">
        <img 
          src="/logo.png" 
          alt="FreePTX Logo" 
          className="max-h-[50px] w-auto object-contain scale-[2.2] origin-left ml-5" 
        />
      </div>
      
      <div className="flex items-center gap-6">
        
        {updateInfo.update_available && (
          <a 
            href={updateInfo.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 bg-fire/20 border border-fire/50 rounded-full text-fire hover:bg-fire hover:text-white transition-all text-xs font-bold"
          >
            <Download size={14} />
            Actualización {updateInfo.latest_version}
          </a>
        )}

        <a 
          href="https://github.com/charscript/CONVERSOR/issues/new?title=Bug+Report" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-muted hover:text-white transition-colors text-xs font-semibold"
          title="Reportar Bug en GitHub"
        >
          <Bug size={14} />
          Reportar Bug
        </a>

      </div>
    </header>
  );
}
