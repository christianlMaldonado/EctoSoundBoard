export function Header() {
  return (
    <header className="flex items-center justify-between bg-black/80 border-2 border-ecto p-3 rounded-xl neon-glow mb-3 z-30">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 rounded-full bg-ecto animate-ping" />
        <h1 className="text-2xl font-display tracking-widest text-ecto neon-text m-0">ECTO-WGN v3.5</h1>
      </div>
      <div className="text-right">
        <span className="text-xs bg-ecto/20 px-2 py-1 rounded text-ecto border border-ecto/40">BT READY</span>
      </div>
    </header>
  );
}