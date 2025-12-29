let activeTooltip = null;

function insertIntoBodyFirst(el) {
  const body = document.body;
  if (body.firstChild) {
    body.insertBefore(el, body.firstChild);
  } else {
    body.appendChild(el);
  }
}

function createTooltip(text, maxWidth) {
  const el = document.createElement("div");
  el.className = "td-tooltip";
  el.textContent = text;
  el.style.maxWidth = maxWidth || "300px";
  el.style.position = "fixed";
  el.style.pointerEvents = "none";
  return el;
}

function updatePosition(el, e, offset = 12) {
  const rect = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = e.clientX + offset;
  let top = e.clientY + offset;

  if (left + rect.width > vw) {
    left = e.clientX - rect.width - offset;
  }

  if (top + rect.height > vh) {
    top = e.clientY - rect.height - offset;
  }

  el.style.left = `${Math.max(left, 8)}px`;
  el.style.top = `${Math.max(top, 8)}px`;
}

export default {
  mounted(el, binding) {
    const getText = () =>
      typeof binding.value === "string"
        ? binding.value
        : binding.value?.text;

    const getOffset = () =>
      typeof binding.value === "object" && binding.value.offset != null
        ? binding.value.offset
        : 12;

    const getMaxWidth = () =>
      typeof binding.value === "object" && binding.value.maxWidth
        ? binding.value.maxWidth
        : "300px";

    const onEnter = (e) => {
      const text = getText();
      if (!text) return;

      if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
      }

      const tooltip = createTooltip(text, getMaxWidth());
      insertIntoBodyFirst(tooltip);
      updatePosition(tooltip, e, getOffset());

      activeTooltip = tooltip;
    };

    const onMove = (e) => {
      if (activeTooltip) {
        updatePosition(activeTooltip, e, getOffset());
      }
    };

    const onLeave = () => {
      if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
      }
    };

    el.__tdTooltip__ = { onEnter, onMove, onLeave };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  },

  beforeUnmount(el) {
    const h = el.__tdTooltip__;
    if (!h) return;

    el.removeEventListener("mouseenter", h.onEnter);
    el.removeEventListener("mousemove", h.onMove);
    el.removeEventListener("mouseleave", h.onLeave);

    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
    }

    delete el.__tdTooltip__;
  },
};
