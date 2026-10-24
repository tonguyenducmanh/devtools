<template>
  <div class="tm-crossword">
    <div class="crossword-board">
      <template v-for="(row, rowIndex) in boardRows" :key="row.number">
        <span
          v-for="(cell, cellIndex) in row.cells"
          :key="`${row.number}-${cellIndex}`"
          class="crossword-cell"
          :class="{ 'crossword-cell--key': cell.isKey }"
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
  },
  {
    number: 2,
    start: 4,
    keyIndex: 1,
    letters: ["Đ", "Ô", "I", "M", "Ư", "Ơ", "I"],
  },
  { number: 3, start: 1, keyIndex: 4, letters: ["M", "Ộ", "N", "G", "M", "Ơ"] },
  { number: 4, start: 4, keyIndex: 1, letters: ["D", "Ạ", "I", "K", "H", "Ờ"] },
  {
    number: 5,
    start: 2,
    keyIndex: 3,
    letters: ["N", "H", "Â", "N", "T", "H", "Ế"],
  },
  {
    number: 6,
    start: 1,
    keyIndex: 4,
    letters: ["H", "A", "I", "C", "H", "Ú", "N", "G", "T", "A"],
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
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: calc(var(--crossword-cell-size) * 0.5);
  font-weight: 700;
  line-height: 1;
  border: var(--border-component-style);
  border-radius: var(--border-radius-component);
  color: var(--text-primary-color);
}

.crossword-cell--key {
  background-color: var(--text-color);
  color: var(--bg-main-color);
}
</style>
