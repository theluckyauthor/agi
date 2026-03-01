const SEED_HISTORY = [
  { text: "didn't open that doomscroll tab", type: "survived" },
  { text: "avoided an unnecessary argument", type: "survived" },
  { text: "left that message on read", type: "close_call" },
  { text: "did not become a productivity machine", type: "survived" },
  { text: "skipped spiraling at 2AM", type: "survived" },
];

const sanitize = (value) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const makeTickerRow = (history) =>
  history
    .map((entry) => {
      const marker = entry.type === "close_call" ? "⚡" : "✓";
      return `${marker} ${sanitize(entry.text)}`;
    })
    .join(" · ");

export const getSeedHistory = () => [...SEED_HISTORY];

export const renderSurvivalLog = (container, history) => {
  const source = history.length ? history : SEED_HISTORY;
  const row = makeTickerRow(source);

  container.innerHTML = `
    <div class="survival-log-track">
      <span>${row}</span>
      <span aria-hidden="true">${row}</span>
    </div>
  `;
};
