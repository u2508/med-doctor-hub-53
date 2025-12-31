// Performance monitoring utilities

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>();

// Debounce utility for frequent operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle utility for performance-critical operations
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Request deduplication wrapper
export const deduplicateRequest = async <T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> => {
  if (requestCache.has(key)) {
    return requestCache.get(key) as Promise<T>;
  }

  const promise = requestFn().finally(() => {
    // Clean up cache after request completes
    setTimeout(() => requestCache.delete(key), 1000);
  });

  requestCache.set(key, promise);
  return promise;
};

// Performance metrics
export const measurePerformance = (name: string, fn: () => void) => {
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    // @ts-ignore - performance.memory is experimental
    return performance.memory;
  }
  return null;
};

// Connection speed detection
export const getConnectionSpeed = (): string => {
  // @ts-ignore - navigator.connection is experimental
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    return connection.effectiveType || 'unknown';
  }
  return 'unknown';
};

// Preload critical resources
export const preloadResource = (url: string, as: string = 'fetch') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  link.as = as;
  document.head.appendChild(link);
};

// Image lazy loading utility
export const createImageObserver = (callback: (entries: IntersectionObserverEntry[]) => void) => {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1
  });
};