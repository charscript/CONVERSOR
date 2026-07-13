export default function ExpertView() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2.2fr_1fr] gap-6 relative z-[1]">
      <div className="flex flex-col gap-6">
        <div className="glass-panel p-6 text-center">
          <h2 className="text-2xl text-ember font-display mb-4">Panel Principal en Construcción</h2>
          <p className="text-muted">La migración de la vista experta está en proceso...</p>
        </div>
      </div>
      <aside className="flex flex-col gap-6">
        <div className="glass-panel p-6 text-center h-[300px]">
          <h2 className="text-xl text-fire font-display mb-4">Sidebar en Construcción</h2>
          <p className="text-muted">Notas y escalas...</p>
        </div>
      </aside>
    </div>
  );
}
