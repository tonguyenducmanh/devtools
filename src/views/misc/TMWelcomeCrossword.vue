<template>
  <div class="tm-crossword">
    <div class="crossword-board">
      <template v-for="(row, rowIndex) in boardRows" :key="row.number">
        <span
          v-for="(cell, cellIndex) in row.cells"
          :key="`${row.number}-${cellIndex}`"
          class="crossword-cell"
          :class="{ 'crossword-cell--key': cell.isKey }"
          v-tooltip="{ text: row.hint }"
          :style="{
            gridColumn: row.start + cellIndex + 1,
            gridRow: rowIndex + 1,
          }"
        >
          {{ cell.letter }}
        </span>
      </template>
    </div>
  </div>
</template>

<script>
/**
 * Bảng chữ cho màn welcome: 6 hàng ngang và cột dọc TÔ MẠNH.
 * 2 hàng đầu thụt thêm 1 cột để cột dọc thẳng hàng.
 * Chữ thường có viền, chữ thuộc từ khóa dọc có nền màu.
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

export default {
  name: "TMWelcomeCrossword",
  data() {
    return {
      boardRows: BOARD_ROWS,
    };
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

  display: grid;
  grid-template-columns: repeat(12, var(--crossword-cell-size));
  grid-auto-rows: var(--crossword-cell-size);
  gap: var(--crossword-gap);
  justify-content: center;
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
  transition: transform 0.15s ease;
}

.crossword-cell:hover {
  transform: scale(1.08);
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .crossword-cell {
    transition: none;
  }

  .crossword-cell:hover {
    transform: none;
  }
}

.crossword-cell--key {
  background-color: var(--text-color);
  color: var(--bg-main-color);
}
</style>
