<template>
  <div class="td-shortcut-item">
    <span class="td-shortcut-keys">
      <span v-for="part in presentKey" :key="part" class="td-shortcut-key">
        {{ part }}
      </span>
    </span>
    <span class="text-nowrap td-shortcut-label">
      {{ label }}
    </span>
  </div>
</template>

<script>
/**
 * 1 item phím tắt hiển thị ở footer
 * Tách riêng để row hiển thị và row đo (footer) dùng chung markup + style,
 * nhờ vậy chiều rộng đo được luôn khớp với những gì thực sự hiển thị
 */
export default {
  name: "TDFooterShortcutItem",
  props: {
    presentKey: { type: Array, default: () => [] },
    label: { type: String, default: "" },
  },
};
</script>

<style lang="scss" scoped>
.td-shortcut-item {
  display: flex;
  flex-wrap: nowrap;
  /* Không co lại dưới bề rộng nội dung, nếu không row đo sẽ đo ra số liệu
     nhỏ hơn thực tế khi tổng các item vượt quá bề ngang container */
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--border-radius);
  /* Tránh co chữ đột ngột khi chuyển đổi layout */
  white-space: nowrap;
}

.td-shortcut-keys {
  display: flex;
  align-items: center;
  gap: 2px;
}

.td-shortcut-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  padding: 2px 6px;
  background-color: var(--bg-layer-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.td-shortcut-label {
  font-size: var(--font-size-medium-rare);
}
</style>
