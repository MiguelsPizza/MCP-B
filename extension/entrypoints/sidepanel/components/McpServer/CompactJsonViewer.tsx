import { cn } from '../../lib/utils';
import type { JsonValue } from './types';

interface CompactJsonViewerProps {
  data: JsonValue;
  className?: string;
}

export const CompactJsonViewer: React.FC<CompactJsonViewerProps> = ({ data, className = '' }) => {
  const getValueColor = (value: JsonValue): string => {
    if (value === null) return 'text-gray-400';
    if (typeof value === 'string') return 'text-green-600 dark:text-green-400';
    if (typeof value === 'number') return 'text-blue-600 dark:text-blue-400';
    if (typeof value === 'boolean') return 'text-purple-600 dark:text-purple-400';
    if (Array.isArray(value)) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const formatValue = (value: JsonValue, depth = 0): React.ReactNode => {
    if (value === null) return <span className={getValueColor(value)}>null</span>;
    if (value === undefined) return <span className="text-gray-400">undefined</span>;

    if (typeof value === 'string') {
      const maxLength = 50;
      const displayValue = value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
      return <span className={getValueColor(value)}>"{displayValue}"</span>;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return <span className={getValueColor(value)}>{String(value)}</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className={getValueColor(value)}>[]</span>;
      if (depth > 0) return <span className={getValueColor(value)}>[{value.length} items]</span>;

      const itemsToShow = value.slice(0, 3);
      const hasMore = value.length > 3;

      return (
        <span className={getValueColor(value)}>
          [
          {itemsToShow.map((item, i) => (
            <span key={i}>
              {i > 0 && ', '}
              {formatValue(item, depth + 1)}
            </span>
          ))}
          {hasMore && <span className="text-gray-400">, ...{value.length - 3} more</span>}]
        </span>
      );
    }

    if (typeof value === 'object' && value !== null) {
      const entries = Object.entries(value);
      if (entries.length === 0) return <span className="text-gray-400">{'{}'}</span>;
      if (depth > 0) return <span className="text-gray-400">{`{${entries.length} props}`}</span>;

      const entriesToShow = entries.slice(0, 5);
      const hasMore = entries.length > 5;

      return (
        <div className="inline-block">
          <span className="text-gray-400">{'{ '}</span>
          {entriesToShow.map(([key, val], i) => (
            <span key={key}>
              {i > 0 && ', '}
              <span className="text-gray-600 dark:text-gray-400">{key}:</span>{' '}
              {formatValue(val, depth + 1)}
            </span>
          ))}
          {hasMore && <span className="text-gray-400">, ...{entries.length - 5} more</span>}
          <span className="text-gray-400">{' }'}</span>
        </div>
      );
    }

    return <span className="text-gray-600">{String(value)}</span>;
  };

  return (
    <div className={cn('font-mono text-[10px] leading-relaxed', className)}>
      {formatValue(data)}
    </div>
  );
};
