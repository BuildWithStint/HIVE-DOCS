/**
 * Brand logos for the docs portal, backed by image assets in `public/`.
 * - <HiveMark/>  : the HIVE icon (public/hive.png) used in the header brand.
 * - <MintLogo/>  : the MINT logo (public/mint.png) used on the MINT pages.
 *   Clicking the MINT logo opens it large in a lightbox overlay.
 */
import { useEffect, useState } from 'react';

export function HiveMark({ size = 26 }: { size?: number }) {
  return (
    <img
      src="/hive.png"
      width={size}
      height={size}
      alt="HIVE"
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}

/** Fullscreen overlay that shows an image large; closes on click or Escape. */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} (enlarged)`}
      onClick={onClose}
    >
      <button className="lightbox-close" aria-label="Close" onClick={onClose}>
        ✕
      </button>
      <img className="lightbox-img" src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export function MintLogo({
  size = 132,
  showWordmark = true,
}: {
  size?: number;
  showWordmark?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="mint-logo"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 14 }}
    >
      <img
        src="/mint.png"
        width={size * 0.42}
        height={size * 0.42}
        alt="MINT"
        title="Click to enlarge"
        onClick={() => setOpen(true)}
        style={{ objectFit: 'contain', cursor: 'zoom-in' }}
      />
      {showWordmark && (
        <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <strong style={{ fontSize: size * 0.2, letterSpacing: '1px', color: 'var(--text)' }}>
            MINT
          </strong>
          <span style={{ fontSize: size * 0.085, color: 'var(--text-soft)', letterSpacing: '0.5px' }}>
            Module Isolation from Nx Toolkit
          </span>
        </span>
      )}
      {open && <Lightbox src="/mint.png" alt="MINT logo" onClose={() => setOpen(false)} />}
    </span>
  );
}
