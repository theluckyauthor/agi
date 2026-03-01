import { getAgingStage } from "./aging.js";
import { attachScratch } from "./scratch.js";

const createEmptySlot = ({ index, onAdd, isDraft }) => {
  const slot = document.createElement("article");
  slot.className = `slot empty ${isDraft ? "drafting" : ""}`;

  if (!isDraft) {
    const button = document.createElement("button");
    button.className = "empty-slot-button";
    button.type = "button";
    button.textContent = "+ add not-to-do";
    button.addEventListener("click", () => onAdd(index, ""));
    slot.append(button);
    return slot;
  }

  const form = document.createElement("form");
  form.className = "slot-form";
  form.innerHTML = `
    <label>
      <span class="sr-only">Not-to-do text</span>
      <input
        name="notTodo"
        maxlength="80"
        autocomplete="off"
        placeholder="what are you NOT doing today..."
      />
    </label>
    <button type="submit">lock it in</button>
  `;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const value = String(formData.get("notTodo") ?? "").trim();
    onAdd(index, value);
  });

  slot.append(form);
  window.setTimeout(() => form.querySelector("input")?.focus(), 20);
  return slot;
};

const createFilledSlot = ({
  item,
  index,
  onConfess,
  intensityEnabled,
}) => {
  const slot = document.createElement("article");
  const stage = getAgingStage(item.createdAt);
  const motionClass = intensityEnabled ? "intense" : "calm";

  slot.className = `slot filled ${motionClass} stage-${stage} ${
    item.completedAt ? "completed" : ""
  }`;

  slot.innerHTML = `
    <p class="slot-text">${item.text}</p>
    <span class="survived-stamp">${item.closeCall ? "CLOSE CALL" : "SURVIVED"}</span>
  `;

  if (item.completedAt) {
    return slot;
  }

  const confessionButton = document.createElement("button");
  confessionButton.className = "almost-button";
  confessionButton.type = "button";
  confessionButton.textContent = "⚡ almost...";
  confessionButton.addEventListener("click", () => onConfess(index, slot));

  const scratchLayer = document.createElement("canvas");
  scratchLayer.className = "scratch-layer";
  scratchLayer.setAttribute("aria-label", "Scratch to survive");

  slot.append(confessionButton, scratchLayer);

  return slot;
};

export const renderSlots = ({
  container,
  items,
  draftIndex,
  onAdd,
  onScratch,
  onConfess,
  intensityEnabled,
  audio,
}) => {
  container.innerHTML = "";

  items.forEach((item, index) => {
    const node = item
      ? createFilledSlot({
          item,
          index,
          onConfess,
          intensityEnabled,
        })
      : createEmptySlot({
          index,
          onAdd,
          isDraft: draftIndex === index,
        });

    container.append(node);

    if (item && !item.completedAt) {
      const scratchLayer = node.querySelector(".scratch-layer");
      if (scratchLayer) {
        attachScratch({
          canvas: scratchLayer,
          audio,
          onReveal: () => onScratch(index, node),
        });
      }
    }
  });
};
