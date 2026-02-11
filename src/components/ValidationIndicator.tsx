'use client';

interface ValidationIndicatorProps {
  isValid: boolean;
}

export default function ValidationIndicator({ isValid }: ValidationIndicatorProps) {
  return (
    <div className="mb-8">
      <div className={`p-6 border-4 flex items-center justify-center gap-3 ${
        isValid
          ? 'bg-white text-black border-black'
          : 'bg-white text-black border-red-600'
      }`}>
        <span className={`text-2xl font-bold uppercase ${
          isValid ? 'text-green-600' : 'text-red-600'
        }`}>
          {isValid ? '✓ Chain Valid' : '✗ Chain Invalid'}
        </span>
      </div>
    </div>
  );
}
