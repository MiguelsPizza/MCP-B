import { useEffect, useState } from 'react';

interface StorageInfo {
  used: number;
  available: number;
}

export function useStorageInfo() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    const getStorageEstimate = async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setStorageInfo({
          used: estimate.usage || 0,
          available: estimate.quota || 0,
        });
      }
    };
    getStorageEstimate();
  }, []);

  return storageInfo;
}
