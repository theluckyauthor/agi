const COVERAGE_THRESHOLD = 0.65;

const resizeCanvas = (canvas) => {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
};

const paintNoise = (ctx, width, height) => {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 800; i += 1) {
    const alpha = Math.random() * 0.18;
    ctx.fillStyle = `rgba(255, 248, 190, ${alpha.toFixed(3)})`;
    ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
  }
};

const percentCleared = (canvas, ctx) => {
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  let transparentPixels = 0;

  for (let i = 3; i < data.length; i += 16) {
    if (data[i] < 8) {
      transparentPixels += 1;
    }
  }

  return transparentPixels / (data.length / 16);
};

export const attachScratch = ({ canvas, onReveal, audio }) => {
  const ctx = resizeCanvas(canvas);
  const width = canvas.getBoundingClientRect().width;
  const height = canvas.getBoundingClientRect().height;
  paintNoise(ctx, width, height);

  let scratched = false;
  let active = false;
  let checks = 0;

  const scratchAt = (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    checks += 1;
  };

  const maybeReveal = () => {
    if (scratched) return;

    const coverage = percentCleared(canvas, ctx);
    if (coverage >= COVERAGE_THRESHOLD) {
      scratched = true;
      canvas.classList.add("scratch-cleared");
      audio?.stopScratch();
      onReveal();
    }
  };

  const onPointerDown = (event) => {
    if (scratched) return;
    active = true;
    canvas.setPointerCapture(event.pointerId);
    scratchAt(event);
    audio?.startScratch();
  };

  const onPointerMove = (event) => {
    if (!active || scratched) return;
    scratchAt(event);
    if (checks % 7 === 0) {
      maybeReveal();
    }
  };

  const endPointer = () => {
    if (!active) return;
    active = false;
    audio?.stopScratch();
    maybeReveal();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointerleave", endPointer);
};
