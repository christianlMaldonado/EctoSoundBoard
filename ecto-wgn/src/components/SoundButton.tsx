import { useRef } from 'react';
import type { SoundSlot } from '../hooks/useSoundboard';

const COLORS: Record<SoundSlot['color'], { border: string; text: string; glow: string }> = {
  red:     { border: 'border-red-500',       text: 'text-red-400',      glow: 'neon-glow-red' },
  blue:    { border: 'border-proton-blue',   text: 'text-proton-blue',  glow: 'neon-glow-blue' },
  purple:  { border: 'border-purple-500',    text: 'text-purple-300',   glow: '' },
  yellow:  { border: 'border-yellow-400',    text: 'text-yellow-300',   glow: '' },
  green:   { border: 'border-ecto',          text: 'text-ecto',         glow: 'neon-glow' },
  emerald: { border: 'border-emerald-400',   text: 'text-emerald-300',  glow: '' },
};

interface Props {
  slot: SoundSlot;
  isCustom: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onReplace: (file: File) => void;
  onReset: () => void;
}

export function SoundButton({ slot, isCustom, isPlaying, onPlay, onReplace, onReset }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const c = COLORS[slot.color];

  return (
    <div
      className={`group relative flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-black border-2 ${
        isPlaying ? 'border-white neon-glow' : `${c.border} ${c.glow}`
      } rounded-2xl transition-all duration-150`}
    >
      {isCustom && (
        <div className="absolute top-1.5 left-1.5 text-[8px] bg-ecto/20 text-ecto px-1.5 py-0.5 rounded border border-ecto/40 font-bold z-10">
          CUSTOM
        </div>
      )}

      <div className="absolute top-1.5 right-1.5 flex gap-1 z-10">
        <button
          onClick={(e) => { e.stopPropagation(); fileInput.current?.click(); }}
          className="w-6 h-6 flex items-center justify-center bg-black/60 border border-gray-600 hover:border-ecto rounded-full text-gray-400 hover:text-ecto text-[10px]"
          title="Upload your own sound"
        >
          <i className="fa-solid fa-folder-open" />
        </button>
        {isCustom && (
          <button
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            className="w-6 h-6 flex items-center justify-center bg-black/60 border border-red-800 hover:border-red-500 rounded-full text-red-400 text-[10px]"
            title="Reset to default sound"
          >
            <i className="fa-solid fa-rotate-left" />
          </button>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onReplace(f);
          e.target.value = '';
        }}
      />

      <button
        onClick={onPlay}
        className="w-full h-full flex flex-col items-center justify-center active:scale-95 transition-transform touch-manipulation"
      >
        <i className={`fa-solid ${isPlaying ? 'fa-stop' : slot.icon} text-3xl ${isPlaying ? 'text-white' : c.text} mb-2 group-hover:scale-110 transition-transform`} />
        <span className={`font-display text-xl ${isPlaying ? 'text-white' : c.text} tracking-wider`}>{slot.label}</span>
        <span className="text-[10px] text-gray-400">{isPlaying ? 'TAP TO STOP' : slot.subtitle}</span>
      </button>
    </div>
  );
}