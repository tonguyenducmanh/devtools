<template>
  <div class="tm-crossword">
    <div class="crossword-board">
      <div
        v-for="row in boardRows"
        :key="row.number"
        class="crossword-row"
        @mouseenter="onRowEnter(row)"
        @mouseleave="onRowLeave"
      >
        <Transition name="crossword-row" :duration="rowTransitionDuration">
          <div
            v-show="hoveredRow === row.number"
            class="crossword-row-content"
            :class="{
              'crossword-row-content--active': hoveredRow === row.number,
            }"
          >
            <span
              v-for="(cell, cellIndex) in row.cells"
              :key="`${row.number}-${cellIndex}`"
              class="crossword-cell"
              :class="{ 'crossword-cell--key': cell.isKey }"
              v-tooltip="{ text: row.hint }"
              @mouseenter="onCellEnter(row, cellIndex)"
              :style="{
                gridColumn: row.start + cellIndex + 1,
                '--cell-delay': cellDelay(row, cellIndex),
              }"
            >
              {{ cell.letter }}
            </span>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * Bảng chữ cho màn welcome: 6 hàng ngang và cột dọc TÔ MẠNH.
 * 2 hàng đầu thụt thêm 1 cột để cột dọc thẳng hàng.
 * Chữ thường có viền, chữ thuộc từ khóa dọc có nền màu.
 * Mặc định mọi hàng ẩn, rê chuột vào hàng nào thì <Transition> của Vue
 * cho hàng đó hiện lên: chữ tỏa dần ra 2 bên từ ô đang hover.
 */
const BOARD_ROWS = [
  {
    number: 1,
    start: 0,
    keyIndex: 5,
    letters: ["T", "H", "A", "N", "H", "T", "Â", "N"],
    hint: "Thanh tân như phút ban đầu",
  },
  {
    number: 2,
    start: 4,
    keyIndex: 1,
    letters: ["Đ", "Ô", "I", "M", "Ư", "Ơ", "I"],
    hint: "Em vẫn nhìn anh với nụ cười dịu dàng tinh khôi của ngày đôi mươi",
  },
  {
    number: 3,
    start: 1,
    keyIndex: 4,
    letters: ["M", "Ộ", "N", "G", "M", "Ơ"],
    hint: "Thì ra tháng năm chẳng thể làm phai phôi mộng mơ thiếu thời",
  },
  {
    number: 4,
    start: 4,
    keyIndex: 1,
    letters: ["D", "Ạ", "I", "K", "H", "Ờ"],
    hint: "Khiến anh được phép dại khờ, biết nhớ, biết chờ đợi, ngẩn ngơ vì",
  },
  {
    number: 5,
    start: 2,
    keyIndex: 3,
    letters: ["N", "H", "Â", "N", "T", "H", "Ế"],
    hint: "Huh, tóc em vương đầy gió bụi nhân thế",
  },
  {
    number: 6,
    start: 1,
    keyIndex: 4,
    letters: ["H", "A", "I", "C", "H", "Ú", "N", "G", "T", "A"],
    hint: "Hòa tiếng đàn tang tính giao duyên tình hai chúng ta",
  },
].map((row) => ({
  ...row,
  cells: row.letters.map((letter, index) => ({
    letter,
    isKey: index === row.keyIndex,
  })),
}));

/** Rời chuột thì giữ hàng sáng thêm chừng này (ms) rồi mới mờ dần. */
const LEAVE_LINGER = 280;

/** Mỗi bước xa ô đang hover thì ô hiện chậm thêm chừng này (ms). */
const CELL_REVEAL_STEP = 130;

export default {
  name: "TMWelcomeCrossword",
  data() {
    return {
      boardRows: BOARD_ROWS,
      hoveredRow: null,
      hoveredCell: null,
      leaveTimer: null,
    };
  },
  computed: {
    /**
     * Hiệu ứng nằm trên các ô con chứ không phải phần tử gốc của <Transition>
     * nên Vue không tự đo được thời lượng -> phải khai báo tường minh.
     * Enter: 1,5s = delay xa nhất (9 bước * 130ms = 1170ms) + fade 330ms.
     * Leave: tổng 2s kể từ lúc rời chuột = LEAVE_LINGER 280ms + fade 1720ms.
     */
    rowTransitionDuration() {
      const prefersReducedMotion =
        typeof window !== "undefined" && window.matchMedia
          ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
          : false;

      return prefersReducedMotion
        ? { enter: 0, leave: 0 }
        : { enter: 1560, leave: 1800 };
    },
  },
  beforeUnmount() {
    this.cancelLeaveTimer();
  },
  methods: {
    onRowEnter(row) {
      this.cancelLeaveTimer();
      this.hoveredRow = row.number;
    },
    /**
     * Rời chuột thì chưa mờ ngay: giữ hàng sáng thêm LEAVE_LINGER ms rồi mới
     * cho <Transition> fade out. Rê chuột lại trong khoảng đó thì hủy hẹn,
     * hàng vẫn sáng -> không bị "nháy" khi con trỏ lướt qua.
     */
    onRowLeave() {
      this.cancelLeaveTimer();
      this.leaveTimer = setTimeout(() => {
        this.leaveTimer = null;
        this.hoveredRow = null;
        this.hoveredCell = null;
      }, LEAVE_LINGER);
    },
    cancelLeaveTimer() {
      if (this.leaveTimer) {
        clearTimeout(this.leaveTimer);
        this.leaveTimer = null;
      }
    },
    onCellEnter(row, cellIndex) {
      this.cancelLeaveTimer();
      this.hoveredRow = row.number;
      this.hoveredCell = cellIndex;
    },
    /**
     * Ô càng xa ô đang hover thì hiện càng muộn -> chữ tỏa ra 2 bên từ ô hover.
     * Nếu con trỏ nằm ở khe/padding của hàng (chưa trúng ô nào) thì tỏa từ giữa hàng.
     */
    cellDelay(row, cellIndex) {
      const isHoveredRow =
        row.number === this.hoveredRow && this.hoveredCell !== null;
      const origin = isHoveredRow
        ? this.hoveredCell
        : Math.floor((row.cells.length - 1) / 2);

      return `${Math.abs(cellIndex - origin) * CELL_REVEAL_STEP}ms`;
    },
  },
};
</script>

<style lang="scss" scoped>
.tm-crossword {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--padding);
  overflow: auto;
  container-type: inline-size;
}

.crossword-board {
  --crossword-cell-size: min(7.5cqw, 11.5vh, 100px);
  --crossword-gap: clamp(2px, 0.6cqw, 6px);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
}

/**
 * Hàng là khung hover cố định, luôn có kích thước kể cả khi nội dung
 * đang bị v-show ẩn (display: none) -> không mất vùng rê chuột, không nhảy layout.
 * padding-block chiếm đúng khe hở giữa 2 hàng nên vùng hover của các hàng
 * chạm nhau, rê chuột từ hàng này sang hàng kia không có "điểm mù".
 */
.crossword-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: calc(12 * var(--crossword-cell-size) + 11 * var(--crossword-gap));
  height: calc(var(--crossword-cell-size) + var(--crossword-gap));
  padding-block: calc(var(--crossword-gap) / 2);
}

.crossword-row-content {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(12, var(--crossword-cell-size));
  grid-auto-rows: var(--crossword-cell-size);
  gap: var(--crossword-gap);
}

.crossword-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--crossword-cell-size) * 0.5);
  font-weight: 700;
  line-height: 1;
  border: var(--border-component-style);
  border-radius: var(--border-radius-component);
  color: var(--text-primary-color);
  cursor: pointer;
  opacity: 0;
  transform: scale(var(--cell-scale, 1));
  /* --cell-delay do component tính theo khoảng cách tới ô đang hover:
     ô càng xa càng hiện muộn -> chữ tỏa dần ra 2 bên (tổng cộng ~1,5s). */
  transition:
    opacity 0.33s ease,
    transform 0.15s ease;
  transition-delay: var(--cell-delay, 0ms), 0s;
}

.crossword-row-content--active .crossword-cell {
  opacity: 1;
}

/* --- <Transition name="crossword-row"> của Vue ---
   Vue bật display rồi mới gỡ enter-from ở frame kế tiếp; nhờ vậy transition
   opacity 0 -> 1 mới thực sự chạy (đổi display:none -> block cùng lúc thì
   trình duyệt bỏ qua transition). Leave: bỏ hết delay để cả hàng mờ đi cùng
   lúc; việc "giữ sáng thêm" sau khi rời chuột do LEAVE_LINGER bên script lo. */
.crossword-row-enter-from .crossword-cell {
  opacity: 0;
}

.crossword-row-leave-active .crossword-cell {
  /* Rời chuột: giữ sáng 280ms (LEAVE_LINGER) rồi mờ dần hết trong 1,72s -> tổng 2s. */
  transition-duration: 1.72s;
  transition-timing-function: linear, ease;
  transition-delay: 0s, 0s;
}

.crossword-cell:hover {
  --cell-scale: 1.08;

  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .crossword-cell,
  .crossword-row-leave-active .crossword-cell {
    transition: none;
  }

  .crossword-cell:hover {
    --cell-scale: 1;
  }
}

.crossword-cell--key {
  background-color: var(--text-color);
  color: var(--bg-main-color);
}
</style>
