import { useEffect } from 'react';

/**
 * Cahaya yang mengikuti kursor di belakang halaman, diadaptasi dari LandingAura Tools from Eiklab.
 *
 * Koordinat ditulis sebagai custom property di <html>, bukan state React: pointermove
 * terlalu sering untuk re-render, dan layer ini cuma dekorasi. Layer hanya digeser
 * lewat `translate` + transition CSS, tanpa blur filter, jadi tetap di compositor.
 * Warna diambil dari token --primary/--accent, jadi otomatis ikut tema.
 */
export function Aura() {
  useEffect(() => {
    const root = document.documentElement;

    // Offset dari tengah viewport: layer diletakkan di tengah lalu digeser sebanyak ini.
    function paint(clientX: number, clientY: number) {
      root.style.setProperty('--aura-dx', `${Math.round(clientX - window.innerWidth / 2)}px`);
      root.style.setProperty('--aura-dy', `${Math.round(clientY - window.innerHeight / 2)}px`);
    }

    function onPointerMove(event: PointerEvent) {
      // Sentuhan bukan kursor; tanpa ini cahaya tertinggal di titik jari terangkat.
      if (event.pointerType === 'touch') return;
      paint(event.clientX, event.clientY);
    }

    function onResize() {
      paint(window.innerWidth / 2, window.innerHeight / 2);
    }

    onResize();
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      root.style.removeProperty('--aura-dx');
      root.style.removeProperty('--aura-dy');
    };
  }, []);

  return (
    <div className="aura" aria-hidden>
      <div className="aura__layer aura__tint" />
      <div className="aura__layer aura__gloss" />
    </div>
  );
}
