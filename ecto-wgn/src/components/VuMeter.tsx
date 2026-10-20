import { useEffect, useState } from 'react';

export function VuMeter({ analyser }: { analyser: AnalyserNode | null }) {
  const [levels, setLevels] = useState<number[]>(Array(12).fill(0));

  useEffect(() => {
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    const loop = () => {
      analyser.getByteFrequencyData(data);
      const bars = Array(12).fill(0) as number[];
      const perBar = Math.floor(data.length / 12);
      for (let i = 0; i < 12; i++) {
        let sum = 0;
        for (let j = i * perBar; j < (i + 1) * perBar; j++) sum += data[j];
        bars[i] = sum / perBar / 255;
      }
      setLevels(bars);
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [analyser]);

  return (
    <div className="grid grid-cols-12 gap-1 h-8 items-end bg-black p-1 rounded border border-ecto/30">
      {levels.map((level, i) => {
        const active = level > 0.05;
        const color =
          i > 9 ? 'bg-red-500 shadow-[0_0_8px_red]'
          : i > 6 ? 'bg-yellow-400 shadow-[0_0_8px_yellow]'
          : 'bg-ecto shadow-[0_0_8px_#00FF66]';
        return (
          <div
            key={i}
            className={`rounded-[2px] transition-all duration-75 ${active ? color : 'bg-gray-800'}`}
            style={{ height: `${Math.max(6, level * 100)}%` }}
          />
        );
      })}
    </div>
  );
}