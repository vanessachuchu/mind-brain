import React from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VoiceInputButtonProps {
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export default function VoiceInputButton({
  isRecording,
  onStartRecording,
  onStopRecording,
  disabled = false,
  className,
  size = 'default'
}: VoiceInputButtonProps) {
  const handleClick = () => {
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    default: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    default: 20,
    lg: 24
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'rounded-full transition-all duration-200',
        sizeClasses[size],
        isRecording 
          ? 'bg-destructive hover:bg-destructive/90 animate-pulse shadow-glow' 
          : 'bg-gradient-accent hover:shadow-soft',
        className
      )}
      size="sm"
    >
      {isRecording ? (
        <MicOff className={cn('text-white')} size={iconSizes[size]} />
      ) : (
        <Mic className={cn('text-white')} size={iconSizes[size]} />
      )}
    </Button>
  );
}