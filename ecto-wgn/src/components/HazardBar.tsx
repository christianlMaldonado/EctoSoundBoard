export function HazardBar({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div className={`w-full h-4 hazard-stripes z-30 ${
      position === 'top' ? 'border-b-2 border-black' : 'border-t-2 border-black'
    }`} />
  );
}