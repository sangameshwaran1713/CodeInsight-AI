import { useEffect, useRef } from 'react';

export function Starfield({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationId;
    let width, height;

    // Star config
    const STAR_COUNT = 280;
    const NEBULA_COUNT = 6;

    const stars = [];
    const nebulas = [];

    function resize() {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }

    function randomBetween(a, b) {
      return a + Math.random() * (b - a);
    }

    function initStars() {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * width,           // depth
          size: randomBetween(0.4, 2.2),
          speed: randomBetween(0.3, 1.8),     // flow speed
          opacity: randomBetween(0.4, 1),
          twinkleOffset: Math.random() * Math.PI * 2,
          twinkleSpeed: randomBetween(0.5, 2),
          // color tint: mostly white, some blue/cyan
          hue: Math.random() < 0.3 ? randomBetween(190, 220) : 0,
          saturation: Math.random() < 0.3 ? randomBetween(60, 100) : 0,
        });
      }
    }

    function initNebulas() {
      nebulas.length = 0;
      const colors = [
        'rgba(14,165,233,0.04)',   // primary blue
        'rgba(99,102,241,0.03)',   // indigo
        'rgba(6,182,212,0.03)',    // cyan
        'rgba(139,92,246,0.025)', // purple
        'rgba(14,165,233,0.025)',
        'rgba(59,130,246,0.03)',
      ];
      for (let i = 0; i < NEBULA_COUNT; i++) {
        nebulas.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: randomBetween(120, 320),
          color: colors[i % colors.length],
        });
      }
    }

    function drawNebulas() {
      nebulas.forEach((n) => {
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        grad.addColorStop(0, n.color);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });
    }

    let tick = 0;

    function draw() {
      tick++;

      // Deep space background
      ctx.clearRect(0, 0, width, height);
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#020408');
      bg.addColorStop(0.5, '#050d18');
      bg.addColorStop(1, '#020408');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      drawNebulas();

      // Draw & move stars
      stars.forEach((s) => {
        // Flow to the right (like warp / gentle drift)
        s.x += s.speed * 0.4;
        s.y += s.speed * 0.08; // slight downward drift

        // Wrap around
        if (s.x > width) { s.x = 0; s.y = Math.random() * height; }
        if (s.y > height) { s.y = 0; }

        // Twinkle
        const twinkle = 0.5 + 0.5 * Math.sin(tick * s.twinkleSpeed * 0.04 + s.twinkleOffset);
        const alpha = s.opacity * (0.5 + 0.5 * twinkle);

        // Draw star
        if (s.hue > 0) {
          ctx.fillStyle = `hsla(${s.hue},${s.saturation}%,85%,${alpha})`;
        } else {
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        }

        // Larger stars get a soft glow
        if (s.size > 1.5) {
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size * 3);
          glow.addColorStop(0, `rgba(150,210,255,${alpha * 0.6})`);
          glow.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        if (s.hue > 0) {
          ctx.fillStyle = `hsla(${s.hue},${s.saturation}%,85%,${alpha})`;
        } else {
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        }
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    }

    const ro = new ResizeObserver(() => {
      resize();
      initNebulas();
    });
    ro.observe(canvas);

    resize();
    initStars();
    initNebulas();
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  );
}
