import { Brain } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-6 h-6', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-xl' },
    lg: { icon: 'w-12 h-12', text: 'text-3xl' }
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size].icon} bg-gradient-to-br from-blue-900 to-purple-700 rounded-xl flex items-center justify-center shadow-lg`}>
        <Brain className={`${size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
      </div>
      {showText && (
        <span className={`${sizes[size].text} font-bold bg-gradient-to-r from-blue-900 to-purple-700 bg-clip-text text-transparent`}>
          FocusMind
        </span>
      )}
    </div>
  );
}
