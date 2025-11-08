// main.js
const canvas = document.getElementById("interactive-canvas");
const ctx = canvas.getContext("2d");
const coordLabel = document.getElementById("coord-label");
const container = document.getElementById("canvas-container");

// Grid settings
const fineSpacing = 10;    // px between fine lines
const coarseSpacing = 50;  // px between coarse lines (a multiple of fineSpacing)
const coarseEvery = Math.round(coarseSpacing / fineSpacing); // how many fine steps for one coarse

// handle HiDPI (retina) correctly
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = container.clientWidth;
  const height = container.clientHeight;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // scale drawing operations back to CSS pixels
  drawGrid(); // redraw grid at new size
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// draw both grids once (called on resize)
function drawGrid() {
  // clear once
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw fine grid (light, subtle)
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(124, 124, 124, 0.06)"; // subtle fine lines
  for (let x = 0; x <= canvas.width; x += fineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += fineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // draw coarse grid (darker/brighter and slightly thicker)
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(110, 110, 110, 0.12)";
  // draw every coarseSpacing, or equivalently every `coarseEvery` fine lines
  for (let i = 0; i <= Math.ceil(canvas.width / fineSpacing); i++) {
    if (i % coarseEvery === 0) {
      const x = i * fineSpacing;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
  }
  for (let j = 0; j <= Math.ceil(canvas.height / fineSpacing); j++) {
    if (j % coarseEvery === 0) {
      const y = j * fineSpacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  // optional: draw axes at center (if you want central axes)
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.strokeStyle = "rgba(87, 87, 87, 0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
}

// draw crosshair and dot (calls drawGrid only if you want grid refreshed each time — here we don't)
function drawCrosshair(x, y) {
  // We do NOT clear the grid here (grid drawn on resize). Instead we clear only the overlay area.
  // But simplest reliable approach: clear whole canvas and redraw grid + crosshair:
  // (this is fine for small projects; see note below on caching)
  drawGrid();

  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 1;

  // vertical
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();

  // horizontal
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();

//   // central dot
//   ctx.beginPath();
//   ctx.arc(x, y, 4, 0, Math.PI * 2);
//   ctx.fillStyle = "#0f0";
//   ctx.fill();

  // central "+"
  const size = 6; // length of each arm (half-length)
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.strokeStyle = "rgba(0, 0, 0, 1)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// mouse handling (coordinates relative to canvas)
canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  drawCrosshair(x, y);

  coordLabel.textContent = `(${Math.round(x)}, ${Math.round(y)})`;
  // offset label a bit so it doesn't sit on top of the cursor
  coordLabel.style.left = `${x - 4}px`;
  coordLabel.style.top  = `${y + 26}px`;
});

// Handle touch input
canvas.addEventListener("touchstart", handleTouch, { passive: true });
canvas.addEventListener("touchmove", handleTouch, { passive: true });

function handleTouch(e) {
//   e.preventDefault(); // optional: prevent scrolling
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  drawCrosshair(x, y);

  coordLabel.textContent = `(${Math.round(x)}, ${Math.round(y)})`;
  coordLabel.style.left = `${x + 12}px`;
  coordLabel.style.top = `${y - 18}px`;
}