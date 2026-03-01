const random = (min, max) => min + Math.random() * (max - min);

export const burstParticles = (anchorElement, variant = "normal") => {
  const rect = anchorElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const burst = document.createElement("div");
  burst.className = `particle-burst ${variant === "close_call" ? "close-call" : ""}`;
  burst.style.left = `${centerX}px`;
  burst.style.top = `${centerY}px`;

  for (let i = 0; i < 24; i += 1) {
    const piece = document.createElement("span");
    piece.className = "particle";
    piece.style.setProperty("--dx", `${random(-160, 160).toFixed(1)}px`);
    piece.style.setProperty("--dy", `${random(-220, 80).toFixed(1)}px`);
    piece.style.setProperty("--rot", `${random(-260, 260).toFixed(1)}deg`);
    piece.style.setProperty("--delay", `${random(0, 90).toFixed(0)}ms`);
    piece.style.setProperty("--dur", `${random(600, 1050).toFixed(0)}ms`);
    burst.append(piece);
  }

  document.body.append(burst);
  window.setTimeout(() => burst.remove(), 1300);
};
