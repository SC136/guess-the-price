"use client";

import { useState } from "react";

/**
 * Product photo. Photos can come from any web address, so next/image (which needs every host
 * allow-listed) isn't used. Falls back to a neutral placeholder if the image fails to load.
 */
export function ProductImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) {
    return (
      <div className={`image-fallback ${className ?? ""}`} role="img" aria-label={alt}>
        Photo unavailable
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
    />
  );
}
