import { useEffect, useState } from 'react';
import { Button } from './ui/button';

interface CacheToggleProps {
  onToggle: (enabled: boolean) => void;
}

const CACHE_STORAGE_KEY = 'mcp-tools-cache-enabled';

export function CacheToggle({ onToggle }: CacheToggleProps) {
  const [cacheEnabled, setCacheEnabled] = useState(() => {
    const stored = localStorage.getItem(CACHE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    onToggle(cacheEnabled);
  }, [cacheEnabled, onToggle]);

  const handleToggle = () => {
    const newValue = !cacheEnabled;
    setCacheEnabled(newValue);
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(newValue));
    onToggle(newValue);

    // Dispatch custom event to notify root component in same tab
    window.dispatchEvent(new CustomEvent('cache-toggle-change'));
  };

  return (
    <Button
      variant={cacheEnabled ? 'default' : 'outline'}
      size="sm"
      onClick={handleToggle}
      className="fixed top-4 right-4 z-50 shadow-lg"
    >
      {cacheEnabled ? '🟢 Cache Tools' : '🔴 Cache Tools'}
    </Button>
  );
}
