interface Props {
  active: boolean;
  onToggle: () => void;
}

export function AlarmButton({ active, onToggle }: Props) {
  const base = 'w-full py-4 font-display font-bold text-2xl rounded-2xl border-2 border-white flex items-center justify-center space-x-3 transition-all duration-200';
  const idle = 'bg-gradient-to-r from-red-600 via-yellow-500 to-ecto text-black shadow-xl active:scale-95';
  const running = 'bg-red-600 text-white shadow-2xl animate-pulse';

  return (
    <button onClick={onToggle} className={`${base} ${active ? running : idle}`}>
      <i className="fa-solid fa-lightbulb text-3xl animate-bounce" />
      <span>{active ? 'ALARM ACTIVE // STOP' : 'FULL ALARM PARTY MODE'}</span>
    </button>
  );
}