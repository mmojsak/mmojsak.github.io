/**
 * Animated dispersion-curve / band-structure background.
 * Draws faint, slowly-evolving lines that resemble electronic
 * band structure or phonon dispersion relations.
 */
(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Palette colours (RGB tuples for easy alpha blending)
  const COLORS = [
    [255, 176, 0],    // #ffb000
    [254, 97, 0],     // #fe6100
    [220, 38, 127],   // #dc267f
    [120, 94, 240],   // #785ef0
    [100, 143, 255],  // #648fff
    [76, 167, 48],    // #4ca730
  ];

  // Each curve is a "band" — a function of x with time-varying parameters
  const BANDS = [
    // Parabolic-like conduction band
    { colorIdx: 0, type: 'parabola',  a: 0.8,  b: 0.3,  c: 0.1,  phaseSpeed: 0.0015, amp: 0.15, offset: 0.0 },
    // Valence-like band (inverted parabola)
    { colorIdx: 1, type: 'parabola',  a: -0.6, b: 0.2,  c: 0.15, phaseSpeed: 0.0020, amp: 0.12, offset: 0.25 },
    // Linear Dirac-cone-like crossing
    { colorIdx: 2, type: 'linear',    slope: 0.5, intercept: 0.3, phaseSpeed: 0.0010, amp: 0.08, offset: 0.1 },
    // Another linear (negative slope) crossing
    { colorIdx: 3, type: 'linear',    slope: -0.4, intercept: 0.7, phaseSpeed: 0.0017, amp: 0.10, offset: 0.15 },
    // Wavy / folded band
    { colorIdx: 4, type: 'sine',      freq: 2.5,  amp: 0.12, mean: 0.5, phaseSpeed: 0.0025, offset: 0.05 },
    // Tight-binding-like cosine band
    { colorIdx: 5, type: 'cosine',    freq: 3.0,  amp: 0.10, mean: 0.75, phaseSpeed: 0.0020, offset: 0.2 },
    // Extra wavy band
    { colorIdx: 3, type: 'sine',      freq: 1.8,  amp: 0.08, mean: 0.2, phaseSpeed: 0.0012, offset: 0.3 },
    // Extra linear band
    { colorIdx: 5, type: 'linear',    slope: 0.3, intercept: 0.1, phaseSpeed: 0.0015, amp: 0.06, offset: 0.4 },
  ];

  // Parallax state
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  const parallaxStrength = 0.03; // fraction of viewport shifted

  // Sizing
  let W, H, dpr;

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener('resize', resize);
  resize();

  // Mouse / touch tracking
  const normalise = (v, min, max) => ((v - min) / (max - min) - 0.5) * 2;

  window.addEventListener('mousemove', (e) => {
    targetX = normalise(e.clientX, 0, W);
    targetY = normalise(e.clientY, 0, H);
  });

  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (t) {
      targetX = normalise(t.clientX, 0, W);
      targetY = normalise(t.clientY, 0, H);
    }
  }, { passive: true });

  // Evaluate a band at normalised x ∈ [0, 1] with time t
  function evalBand(band, x, t) {
    const phase = t * band.phaseSpeed + band.offset;
    let y;

    switch (band.type) {
      case 'parabola':
        y = band.a * (x - 0.5) * (x - 0.5) + band.b * (x - 0.5) + band.c;
        break;
      case 'linear':
        y = band.slope * (x - 0.5) + band.intercept;
        break;
      case 'sine':
        y = band.mean + band.amp * Math.sin(band.freq * Math.PI * x + phase * 2);
        break;
      case 'cosine':
        y = band.mean + band.amp * Math.cos(band.freq * Math.PI * x + phase * 2);
        break;
      default:
        y = 0.5;
    }

    // Add a slow time-varying wiggle
    y += band.amp * 0.3 * Math.sin(x * 4 + phase * 3);

    return y;
  }

  // Draw a single band as a smooth curve
  function drawBand(band, t, px, py) {
    const color = COLORS[band.colorIdx % COLORS.length];
    // Higher alpha on white background to remain visible but still subtle
    const alpha = 0.12 + 0.08 * Math.sin(t * 0.002 + band.offset * 2);
    ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const steps = Math.max(W, 200);
    const margin = 0.05;
    const xMin = margin;
    const xMax = 1 - margin;

    for (let i = 0; i <= steps; i++) {
      const nx = xMin + (xMax - xMin) * (i / steps);
      const ny = evalBand(band, nx, t);

      // Map to screen coords with parallax offset
      const sx = nx * W + px;
      const sy = (1 - ny) * H + py;

      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }

    ctx.stroke();
  }

  let time = 0;

  function tick() {
    // Smooth parallax interpolation
    currentX += (targetX - currentX) * 0.06;
    currentY += (targetY - currentY) * 0.06;

    const px = currentX * parallaxStrength * W;
    const py = currentY * parallaxStrength * H;

    // Clear to white (no trail — clean on white bg)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    // Draw bands
    BANDS.forEach((band) => drawBand(band, time, px, py));

    time += 1;
    requestAnimationFrame(tick);
  }

  tick();
})();