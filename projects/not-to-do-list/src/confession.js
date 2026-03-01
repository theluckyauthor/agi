export const playConfessionSequence = ({ mountPoint, onDone, intensityEnabled }) => {
  const layer = document.createElement("div");
  layer.className = `confession-overlay ${intensityEnabled ? "intense" : ""}`;
  layer.innerHTML = `<p class="confession-line" aria-live="polite"></p>`;
  mountPoint.append(layer);

  const target = layer.querySelector(".confession-line");
  const message = "...but you didn't.";
  let index = 0;

  const interval = window.setInterval(() => {
    target.textContent = message.slice(0, index + 1);
    index += 1;
    if (index >= message.length) {
      window.clearInterval(interval);
      window.setTimeout(() => {
        layer.classList.add("done");
        window.setTimeout(() => {
          layer.remove();
          onDone();
        }, 380);
      }, 1200);
    }
  }, 55);
};
