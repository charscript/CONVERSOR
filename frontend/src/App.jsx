import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore';
import TitleBar from './components/Layout/TitleBar';
import SplashScreen from './components/Layout/SplashScreen';
import Header from './components/Layout/Header';
import StatusBar from './components/Layout/StatusBar';

// Views
import WizardView from './views/WizardView';
import ExpertView from './views/ExpertView';

function App() {
  const [loading, setLoading] = useState(true);
  const viewMode = useAppStore(state => state.viewMode);

  useEffect(() => {
    // Simulate initial loading for splash screen
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {loading && <SplashScreen />}
      
      {/* Fire Particles Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`ember ember-${i+1}`}></div>
        ))}
      </div>

      <TitleBar />

      <div className="flex flex-col min-h-[calc(100vh-33px)] relative bg-transparent border-x border-b border-white/5">
        <Header />

        <main className={`flex-grow container mx-auto px-5 mt-8 mb-6 relative z-10 transition-all duration-500 ease-smooth ${
          viewMode === 'wizard' ? 'max-w-[900px]' : 'max-w-[1400px]'
        }`}>
          {viewMode === 'wizard' ? <WizardView /> : <ExpertView />}
        </main>

        <StatusBar />
      </div>
    </>
  );
}

export default App;
