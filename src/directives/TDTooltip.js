let activeTooltip = null;
let rafId = null;
let lastEvent = null;

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

// Đọc value từ el.__tdTooltipValue__ thay vì closure
function getText(el) {
  const v = el.__tdTooltipValue__;
  return typeof v === "string" ? v : v?.text;
}
function getOffset(el) {
  const v = el.__tdTooltipValue__;
  return typeof v === "object" && v?.offset != null ? v.offset : 12;
}
function getMaxWidth(el) {
  const v = el.__tdTooltipValue__;
  return typeof v === "object" && v?.maxWidth ? v.maxWidth : "300px";
}

export default {
  mounted(el, binding) {
    el.__tdTooltipValue__ = binding.value; // lưu value vào element

    const onEnter = (e) => {
      const text = getText(el);
      if (!text) return;

      if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
      }

      const tooltip = createTooltip(text, getMaxWidth(el));
      insertIntoBodyFirst(tooltip);
      updatePosition(tooltip, e, getOffset(el));
      activeTooltip = tooltip;
    };

    const onMove = (e) => {
      if (!activeTooltip) return;
      lastEvent = e;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        if (activeTooltip && lastEvent) {
          updatePosition(activeTooltip, lastEvent, getOffset(el));
        }
        rafId = null;
      });
    };

    const onLeave = () => {
      if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    el.__tdTooltip__ = { onEnter, onMove, onLeave };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  },

  // Hook này cập nhật value mới khi binding thay đổi
  updated(el, binding) {
    el.__tdTooltipValue__ = binding.value;

    // Nếu tooltip đang hiển thị, cập nhật text ngay lập tức
    if (activeTooltip) {
      const text = getText(el);
      if (text) {
        activeTooltip.textContent = text;
        activeTooltip.style.maxWidth = getMaxWidth(el);
      } else {
        activeTooltip.remove();
        activeTooltip = null;
      }
    }
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
    delete el.__tdTooltipValue__;
  },
};
