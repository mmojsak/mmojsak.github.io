const bgCanvas = document.getElementById("bg-canvas");
const bgCtx = bgCanvas.getContext("2d");

const canvas = document.getElementById("interactive-canvas");
const ctx = canvas.getContext("2d");

const coordLabel = document.getElementById("coord-label");
const container = document.getElementById("canvas-container");

const width = bgCanvas.clientWidth;   // CSS pixels
const height = bgCanvas.clientHeight; // CSS pixels

// grid settings
const fineSpacing = 10;
const coarseSpacing = 50;
const coarseEvery = Math.round(coarseSpacing / fineSpacing);

// resize both canvases
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const width = container.clientWidth;
  const height = container.clientHeight;

  [bgCanvas, canvas].forEach(c => {
    c.style.width = width + "px";
    c.style.height = height + "px";
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
  });
    document.fonts.load("64px Ovo").then(() => {
      drawStaticBackground(); // draw grid + name now
    });
//   drawStaticBackground(); // grid + name
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function getFontSizeForWidth(ctx, text, targetWidth, fontFamily = 'Ovo') {
  let fontSize = 10; // starting point
  ctx.font = `${fontSize}px '${fontFamily}'`;

  // increase font size until text width reaches target
  while (ctx.measureText(text).width < targetWidth) {
    fontSize += 1;
    ctx.font = `${fontSize}px '${fontFamily}'`;
  }

  // optionally, reduce by 1 to not exceed target width
  return fontSize - 1;
}

// ---------------------
// STATIC BACKGROUND
// ---------------------
function drawStaticBackground() {
  const ctx = bgCtx;
  ctx.clearRect(0, 0, width, height);

  // fine grid
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(124, 124, 124, 0.06)";
  for (let x = 0; x <= width; x += fineSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += fineSpacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // coarse grid
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = "rgba(110, 110, 110, 0.12)";
  for (let i = 0; i <= Math.ceil(width / fineSpacing); i++) {
    if (i % coarseEvery === 0) {
      const x = i * fineSpacing;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }
  for (let j = 0; j <= Math.ceil(height / fineSpacing); j++) {
    if (j % coarseEvery === 0) {
      const y = j * fineSpacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

//   // central axes
//   const cx = width / 2;
//   const cy = height / 2;
//   ctx.strokeStyle = "rgba(255, 0, 0, 1)";
//   ctx.lineWidth = 1.5;
//   ctx.beginPath();
//   ctx.moveTo(cx, 0);
//   ctx.lineTo(cx, bgCanvas.height);
//   ctx.stroke();
//   ctx.beginPath();
//   ctx.moveTo(0, cy);
//   ctx.lineTo(bgCanvas.width, cy);
//   ctx.stroke();

  // your name
  const name = "Mateusz Mojsak"
  const targetWidth = width * 0.6
  const fontSize = getFontSizeForWidth(ctx, name, targetWidth, 'Ovo');
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `${fontSize}px 'Ovo', serif`;
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.fillText(name, width / 2, 50);
  ctx.restore();
}

// ---------------------
// DYNAMIC CROSSHAIR
// ---------------------
function drawCrosshair(x, y) {
  ctx.clearRect(0, 0, width, height);

  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 1;

  // vertical
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.stroke();

  // horizontal
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();

  // central "+"
  const size = 6;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.strokeStyle = "rgba(0, 0, 0, 1)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ---------------------
// MOUSE & TOUCH
// ---------------------
function updateCursorPosition(x, y) {
  drawCrosshair(x, y);

  coordLabel.textContent = `(${Math.round(x)}, ${Math.round(y)})`;
  coordLabel.style.left = `${x}px`;
  coordLabel.style.top = `${y}px`;
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  updateCursorPosition(e.clientX - rect.left, e.clientY - rect.top);
});

canvas.addEventListener("touchstart", handleTouch, { passive: true });
canvas.addEventListener("touchmove", handleTouch, { passive: false });

function handleTouch(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  updateCursorPosition(touch.clientX - rect.left, touch.clientY - rect.top);
}