export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#050505] z-[10000] flex items-center justify-center transition-all duration-500 animate-[splash-enter_0.6s_ease-out]">
      <div className="text-center">
        <div className="mb-5 drop-shadow-[0_0_20px_rgba(255,45,45,0.5)] animate-[splash-logo-pulse_1.5s_ease-in-out_infinite_alternate]">
          <img src="/logo.png" alt="FreePTX Logo" className="max-h-[280px] w-auto object-contain mx-auto" />
        </div>
        <div className="w-[200px] h-[3px] bg-white/5 rounded-[3px] overflow-hidden mx-auto mb-4 border border-white/5">
          <div className="h-full w-full bg-gradient-to-r from-fire via-ember to-fire bg-[length:200%_100%] rounded-[3px] animate-[splash-load_1.6s_ease-in-out_forwards,splash-shimmer_1s_linear_infinite]"></div>
        </div>
        <p className="font-display text-[11px] text-[#444] tracking-[0.5px]">Inicializando módulos...</p>
      </div>
    </div>
  );
}
