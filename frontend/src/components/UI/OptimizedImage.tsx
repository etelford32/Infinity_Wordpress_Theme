import { useState, useEffect, useRef, memo, CSSProperties } from 'react';
import { getPerformanceConfig } from '@lib/performance/config';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  priority?: boolean; // Load immediately without lazy loading
  placeholder?: 'blur' | 'color' | 'none';
  blurDataURL?: string; // Base64 blur placeholder
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string; // Responsive sizes attribute
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
}

/**
 * Check if browser supports WebP
 */
const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src =
      'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

let webPSupported: boolean | null = null;

/**
 * Generate srcset for responsive images
 */
function generateSrcSet(src: string, breakpoints: number[]): string {
  // For WordPress, we'd typically use wp_get_attachment_image_srcset
  // For static assets or CDN, we can generate URLs
  return breakpoints
    .map((bp) => {
      // Check if this is a WordPress media URL
      if (src.includes('/wp-content/uploads/')) {
        // WordPress pattern: image-150x150.jpg
        const ext = src.split('.').pop();
        const base = src.replace(`.${ext}`, '');
        return `${base}-${bp}w.${ext} ${bp}w`;
      }
      // For CDN or image service, add width param
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}w=${bp} ${bp}w`;
    })
    .join(', ');
}

/**
 * Convert image URL to WebP if supported
 */
function getWebPUrl(src: string): string {
  if (!webPSupported) return src;

  // WordPress uploads
  if (src.includes('/wp-content/uploads/')) {
    return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  }

  // CDN with format param
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}format=webp`;
}

/**
 * Generate a tiny blur placeholder
 */
function generateBlurPlaceholder(color: string = '#1e2330'): string {
  // Simple SVG blur placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="1" />
      </filter>
      <rect fill="${color}" width="8" height="8" filter="url(#b)" />
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * OptimizedImage Component
 * Handles WebP conversion, lazy loading, blur-up effect, and responsive images
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  style,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  sizes,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const config = getPerformanceConfig();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check WebP support on mount
  useEffect(() => {
    if (webPSupported === null) {
      checkWebPSupport().then((supported) => {
        webPSupported = supported;
      });
    }
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !config.images.enableLazyLoading) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: config.images.lazyLoadThreshold,
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, config.images.enableLazyLoading, config.images.lazyLoadThreshold]);

  // Set the actual source when in view
  useEffect(() => {
    if (isInView && !currentSrc) {
      const finalSrc = config.images.enableWebP ? getWebPUrl(src) : src;
      setCurrentSrc(finalSrc);
    }
  }, [isInView, src, currentSrc, config.images.enableWebP]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    // Fallback to original src if WebP fails
    if (currentSrc !== src) {
      setCurrentSrc(src);
    } else {
      setError(true);
      onError?.();
    }
  };

  // Generate placeholder
  const placeholderSrc =
    placeholder === 'blur'
      ? blurDataURL || generateBlurPlaceholder(config.images.placeholderColor)
      : placeholder === 'color'
      ? generateBlurPlaceholder(config.images.placeholderColor)
      : undefined;

  // Generate srcset
  const srcSet =
    currentSrc && config.images.breakpoints.length > 0
      ? generateSrcSet(currentSrc, config.images.breakpoints)
      : undefined;

  // Calculate aspect ratio for layout stability
  const aspectRatio = width && height ? width / height : undefined;

  return (
    <div
      ref={containerRef}
      className={`optimized-image-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : aspectRatio ? 'auto' : '100%',
        aspectRatio: aspectRatio ? `${aspectRatio}` : undefined,
        backgroundColor: config.images.placeholderColor,
        ...style,
      }}
    >
      {/* Blur placeholder */}
      {placeholder !== 'none' && placeholderSrc && !isLoaded && !error && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit,
            filter: 'blur(20px)',
            transform: 'scale(1.1)',
            transition: 'opacity 0.3s ease-out',
            opacity: isLoaded ? 0 : 1,
          }}
        />
      )}

      {/* Main image */}
      {currentSrc && !error && (
        <img
          ref={imgRef}
          src={currentSrc}
          srcSet={srcSet}
          sizes={sizes || '100vw'}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit,
            transition: config.images.enableBlurUp ? 'opacity 0.5s ease-out' : undefined,
            opacity: isLoaded ? 1 : 0,
          }}
        />
      )}

      {/* Error fallback */}
      {error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: config.images.placeholderColor,
            color: '#666',
            fontSize: '14px',
          }}
        >
          Failed to load image
        </div>
      )}

      {/* Loading indicator for priority images */}
      {priority && !isLoaded && !error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="spinner w-6 h-6" />
        </div>
      )}
    </div>
  );
});

/**
 * Picture element for art direction with multiple sources
 */
interface OptimizedPictureProps extends Omit<OptimizedImageProps, 'src'> {
  sources: {
    src: string;
    media?: string; // e.g., "(min-width: 768px)"
    type?: string; // e.g., "image/webp"
  }[];
  fallbackSrc: string;
}

export const OptimizedPicture = memo(function OptimizedPicture({
  sources,
  fallbackSrc,
  alt,
  className,
  ...props
}: OptimizedPictureProps) {
  return (
    <picture className={className}>
      {sources.map((source, index) => (
        <source
          key={index}
          srcSet={source.src}
          media={source.media}
          type={source.type}
        />
      ))}
      <OptimizedImage
        src={fallbackSrc}
        alt={alt}
        {...props}
      />
    </picture>
  );
});

export default OptimizedImage;
