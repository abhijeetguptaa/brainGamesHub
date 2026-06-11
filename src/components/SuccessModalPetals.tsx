const SYMBOLS = [
  'petal',
  'heart',
  'star-symbol',
  'candy',
  'sym-sparkle',
  'sym-burst',
  'sym-dot',
  'sym-note',
  'sym-star-2',
  'sym-flower',
];

export default function SuccessModalPetals() {
  return (
    <div className="petal-container">
      {Array.from({ length: 60 }).map((_, index) => {
        const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        return <div key={index} className={symbol} />;
      })}
    </div>
  );
}
