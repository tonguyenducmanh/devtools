<template>
  <div
    class="td-datetime"
    :class="{
      'flex-col': isLabelTop,
      'td-datetime-no-margin': noMargin,
      'td-datetime-read-only': readOnly,
    }"
    v-click-outside="closePopup"
  >
    <div class="td-label" :class="{ 'td-label-top': isLabelTop }" v-if="label">
      {{ label }}
    </div>

    <div class="td-datetime-wrapper">
      <!-- Input Field -->
      <div class="td-datetime-input-container">
        <input
          ref="inputRef"
          type="text"
          class="td-datetime-input"
          :class="{ 'td-datetime-input-open': isOpen }"
          :value="inputValue"
          :readOnly="readOnly"
          :placeholder="placeholder"
          @input="handleInput"
          @keydown="handleKeydown"
        />
        <span class="td-datetime-icon" @click="togglePopup">
          <TDArrow :openProp="isOpen" />
        </span>
      </div>

      <!-- Popup -->
      <div v-if="isOpen && !readOnly" class="td-datetime-popup">
        <!-- Calendar Section -->
        <div class="td-datetime-calendar">
          <!-- Month/Year Header -->
          <div class="td-datetime-calendar-header">
            <div class="td-datetime-nav" @click="prevMonth">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </div>
            <div class="td-datetime-month-year">
              <span class="td-datetime-month" @click="openMonthPicker">{{
                monthName
              }}</span>
              <span class="td-datetime-year" @click="openYearPicker">{{
                currentYear
              }}</span>
            </div>
            <div class="td-datetime-nav" @click="nextMonth">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </div>

          <!-- Month Picker -->
          <div
            v-if="viewMonthPicker"
            ref="monthPicker"
            class="td-datetime-month-picker"
          >
            <div
              v-for="(m, index) in monthNames"
              :key="index"
              class="td-datetime-month-option"
              :class="{ selected: index + 1 === currentMonth }"
              @click="selectMonth(index + 1)"
            >
              {{ m }}
            </div>
          </div>

          <!-- Year Picker -->
          <div
            v-if="viewYearPicker"
            ref="yearPicker"
            class="td-datetime-year-picker"
          >
            <div
              v-for="y in years"
              :key="y"
              class="td-datetime-year-option"
              :class="{ selected: y === currentYear }"
              @click="selectYear(y)"
            >
              {{ y }}
            </div>
          </div>

          <!-- Day Grid -->
          <div
            v-if="!viewMonthPicker && !viewYearPicker"
            ref="dayGrid"
            class="td-datetime-days"
          >
            <div class="td-datetime-day-header">
              <span v-for="d in dayNames" :key="d">{{ d }}</span>
            </div>
            <div class="td-datetime-day-grid">
              <div
                v-for="(d, index) in calendarDays"
                :key="index"
                class="td-datetime-day"
                :class="{
                  'other-month': d.otherMonth,
                  selected: d.date === currentDay && !d.otherMonth,
                  today: d.isToday,
                }"
                @click="!d.otherMonth && selectDay(d.date)"
              >
                {{ d.day }}
              </div>
            </div>
          </div>
        </div>

        <!-- Time Section -->
        <div v-if="!dateOnly" class="td-datetime-time">
          <div class="td-datetime-time-header">{{ selectTimeText }}</div>
          <div class="td-datetime-time-picker">
            <!-- Hour -->
            <div class="td-datetime-time-column">
              <div class="td-datetime-time-nav" @click="incHour">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
              <div class="td-datetime-time-value">
                {{ String(currentHour).padStart(2, "0") }}
              </div>
              <div class="td-datetime-time-nav" @click="decHour">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <span class="td-datetime-time-separator">:</span>

            <!-- Minute -->
            <div class="td-datetime-time-column">
              <div class="td-datetime-time-nav" @click="incMinute">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
              <div class="td-datetime-time-value">
                {{ String(currentMinute).padStart(2, "0") }}
              </div>
              <div class="td-datetime-time-nav" @click="decMinute">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <span class="td-datetime-time-separator">:</span>

            <!-- Second -->
            <div class="td-datetime-time-column">
              <div class="td-datetime-time-nav" @click="incSecond">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </div>
              <div class="td-datetime-time-value">
                {{ String(currentSecond).padStart(2, "0") }}
              </div>
              <div class="td-datetime-time-nav" @click="decSecond">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex td-datetime-actions">
          <TDButton
            :label="cancelText"
            type="secondary"
            noMargin
            @click="cancelSelection"
          />
          <div class="flex td-datetime-actions-positive">
            <TDButton
              :label="todayText"
              type="secondary"
              noMargin
              @click="goToToday"
            />
            <TDButton :label="confirmText" noMargin @click="confirmSelection" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TDStylePremitiveMixin from "@/mixins/TDStylePremitiveMixin.js";
import TDArrow from "./TDArrow.vue";
import TDButton from "./TDButton.vue";

export default {
  name: "TDDateTime",
  components: { TDArrow, TDButton },
  mixins: [TDStylePremitiveMixin],

  props: {
    label: { type: String, default: null },
    modelValue: { type: Date, default: null },
    readOnly: { type: Boolean, default: false },
    isLabelTop: { type: Boolean, default: false },
    noMargin: { type: Boolean, default: false },
    dateOnly: { type: Boolean, default: false },
  },

  emits: ["update:modelValue"],

  data() {
    const now = new Date();
    return {
      inputValue: "",
      isOpen: false,
      viewMonthPicker: false,
      viewYearPicker: false,
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      currentDay: now.getDate(),
      currentHour: now.getHours(),
      currentMinute: now.getMinutes(),
      currentSecond: now.getSeconds(),
      // Snapshot lưu khi mở popup, rollback về đây khi hủy
      lastDateTime: null,
    };
  },

  computed: {
    i18nDateTime() {
      return this.$t("i18nCommon.dateTime");
    },
    monthNames() {
      return this.i18nDateTime.months || [];
    },
    dayNames() {
      return this.i18nDateTime.days || [];
    },
    placeholder() {
      if (this.dateOnly)
        return this.i18nDateTime.placeholderDateOnly || "dd/mm/yyyy";
      return this.i18nDateTime.placeholder || "dd/mm/yyyy hh:mm:ss";
    },
    selectTimeText() {
      return this.$t("i18nCommon.dateTime.selectTime");
    },
    cancelText() {
      return this.$t("i18nCommon.dateTime.cancel");
    },
    confirmText() {
      return this.$t("i18nCommon.dateTime.confirm");
    },
    todayText() {
      return this.$t("i18nCommon.dateTime.today");
    },
    years() {
      const years = [];
      for (let y = 1900; y <= 2100; y++) years.push(y);
      return years;
    },
    monthName() {
      return this.monthNames[this.currentMonth - 1];
    },
    calendarDays() {
      const days = [];
      const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1);
      const lastDay = new Date(this.currentYear, this.currentMonth, 0);
      const startDayOfWeek = firstDay.getDay();
      const totalDays = lastDay.getDate();

      const prevMonthLastDay = new Date(
        this.currentYear,
        this.currentMonth - 1,
        0,
      ).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        days.push({
          day: prevMonthLastDay - i,
          date: prevMonthLastDay - i,
          otherMonth: true,
          isToday: false,
        });
      }

      const today = new Date();
      for (let d = 1; d <= totalDays; d++) {
        const isToday =
          d === today.getDate() &&
          this.currentMonth === today.getMonth() + 1 &&
          this.currentYear === today.getFullYear();
        days.push({ day: d, date: d, otherMonth: false, isToday });
      }

      const remaining = 42 - days.length;
      for (let d = 1; d <= remaining; d++) {
        days.push({ day: d, date: d, otherMonth: true, isToday: false });
      }
      return days;
    },
  },

  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        if (val instanceof Date && !isNaN(val)) {
          this.currentDay = val.getDate();
          this.currentMonth = val.getMonth() + 1;
          this.currentYear = val.getFullYear();
          this.currentHour = this.dateOnly ? 0 : val.getHours();
          this.currentMinute = this.dateOnly ? 0 : val.getMinutes();
          this.currentSecond = this.dateOnly ? 0 : val.getSeconds();
          this.inputValue = this.formatValue();
        } else {
          this.resetValues();
          this.inputValue = "";
        }
      },
    },
  },

  methods: {
    // Tạo snapshot của state hiện tại
    saveSnapshot() {
      this.lastDateTime = {
        year: this.currentYear,
        month: this.currentMonth,
        day: this.currentDay,
        hour: this.currentHour,
        minute: this.currentMinute,
        second: this.currentSecond,
        inputValue: this.inputValue,
      };
    },

    // Khôi phục từ snapshot
    restoreSnapshot() {
      if (!this.lastDateTime) return;
      this.currentYear = this.lastDateTime.year;
      this.currentMonth = this.lastDateTime.month;
      this.currentDay = this.lastDateTime.day;
      this.currentHour = this.lastDateTime.hour;
      this.currentMinute = this.lastDateTime.minute;
      this.currentSecond = this.lastDateTime.second;
      this.inputValue = this.lastDateTime.inputValue;
    },

    buildDateObject() {
      return new Date(
        this.currentYear,
        this.currentMonth - 1,
        this.currentDay,
        this.dateOnly ? 0 : this.currentHour,
        this.dateOnly ? 0 : this.currentMinute,
        this.dateOnly ? 0 : this.currentSecond,
      );
    },

    emitValue() {
      const dateObj = this.buildDateObject();
      this.$emit("update:modelValue", isNaN(dateObj) ? null : dateObj);
    },

    formatValue() {
      const day = String(this.currentDay).padStart(2, "0");
      const month = String(this.currentMonth).padStart(2, "0");
      const year = this.currentYear;
      if (this.dateOnly) return `${day}/${month}/${year}`;
      const hour = String(this.currentHour).padStart(2, "0");
      const minute = String(this.currentMinute).padStart(2, "0");
      const second = String(this.currentSecond).padStart(2, "0");
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    },

    // Cập nhật inputValue preview ngay khi thay đổi trong popup
    refreshPreview() {
      this.inputValue = this.formatValue();
    },

    scrollToSelected() {
      this.$nextTick(() => {
        if (this.viewYearPicker) {
          const el = this.$refs.yearPicker?.querySelector(
            ".td-datetime-year-option.selected",
          );
          el?.scrollIntoView({ block: "center", inline: "nearest" });
        }
        if (this.viewMonthPicker) {
          const el = this.$refs.monthPicker?.querySelector(
            ".td-datetime-month-option.selected",
          );
          el?.scrollIntoView({ block: "center", inline: "nearest" });
        }
      });
    },

    handleInput(e) {
      const digits = e.target.value.replace(/\D/g, "");
      if (digits.length === 0) {
        this.inputValue = "";
        return;
      }

      let formatted = "";
      const len = digits.length;
      if (len >= 1) formatted += digits.substring(0, 2);
      if (len >= 2) formatted += "/";
      if (len >= 3) formatted += digits.substring(2, 4);
      if (len >= 4) formatted += "/";
      if (len >= 5) formatted += digits.substring(4, 8);

      if (this.dateOnly) {
        this.inputValue = formatted;
        this.parseInputToCurrentValues(formatted);
        return;
      }

      if (len >= 8) formatted += " ";
      if (len >= 9) formatted += digits.substring(8, 10);
      if (len >= 10) formatted += ":";
      if (len >= 11) formatted += digits.substring(10, 12);
      if (len >= 12) formatted += ":";
      if (len >= 13) formatted += digits.substring(12, 14);

      this.inputValue = formatted;
      this.parseInputToCurrentValues(formatted);
    },

    parseInputToCurrentValues(inputStr) {
      const parts = inputStr.split(/[\/\s:]/);
      if (this.dateOnly) {
        this.currentHour = 0;
        this.currentMinute = 0;
        this.currentSecond = 0;
      }

      if (parts[0]?.length >= 1) {
        const d = parseInt(parts[0], 10);
        if (d >= 1 && d <= 31) this.currentDay = d;
      }
      if (parts[1]?.length >= 1) {
        const m = parseInt(parts[1], 10);
        if (m >= 1 && m <= 12) this.currentMonth = m;
      }
      if (parts[2]?.length >= 1) {
        const y = parseInt(parts[2], 10);
        if (y >= 1900 && y <= 2100) this.currentYear = y;
      }
      if (this.dateOnly) return;
      if (parts[3]?.length >= 1) {
        const h = parseInt(parts[3], 10);
        if (h >= 0 && h <= 23) this.currentHour = h;
      }
      if (parts[4]?.length >= 1) {
        const m = parseInt(parts[4], 10);
        if (m >= 0 && m <= 59) this.currentMinute = m;
      }
      if (parts[5]?.length >= 1) {
        const s = parseInt(parts[5], 10);
        if (s >= 0 && s <= 59) this.currentSecond = s;
      }
    },

    handleKeydown(e) {
      if (
        [8, 46, 9, 27, 13].includes(e.keyCode) ||
        ((e.keyCode === 65 ||
          e.keyCode === 67 ||
          e.keyCode === 86 ||
          e.keyCode === 88) &&
          (e.ctrlKey || e.metaKey))
      )
        return;
      if (e.keyCode < 48 || e.keyCode > 57) e.preventDefault();
    },

    togglePopup() {
      if (this.readOnly) return;
      if (!this.isOpen) {
        // Lưu snapshot trước khi mở
        this.saveSnapshot();
        this.isOpen = true;
        this.$nextTick(() => this.scrollToSelectedDay());
      } else {
        this.cancelSelection();
      }
      this.viewMonthPicker = false;
      this.viewYearPicker = false;
    },

    scrollToSelectedDay() {
      this.$nextTick(() => {
        const el = this.$refs.dayGrid?.querySelector(
          ".td-datetime-day.selected",
        );
        el?.scrollIntoView({ block: "center", inline: "nearest" });
      });
    },

    // Hủy: rollback về lastDateTime rồi đóng
    cancelSelection() {
      this.restoreSnapshot();
      this.isOpen = false;
      this.viewMonthPicker = false;
      this.viewYearPicker = false;
    },

    // Giữ closePopup để v-click-outside vẫn rollback
    closePopup() {
      this.cancelSelection();
    },

    openMonthPicker() {
      this.viewMonthPicker = true;
      this.viewYearPicker = false;
      this.scrollToSelected();
    },

    openYearPicker() {
      this.viewYearPicker = true;
      this.viewMonthPicker = false;
      this.scrollToSelected();
    },

    selectMonth(m) {
      this.currentMonth = m;
      this.viewMonthPicker = false;
      this.refreshPreview();
    },

    selectYear(y) {
      this.currentYear = y;
      this.viewYearPicker = false;
      this.refreshPreview();
    },

    selectDay(d) {
      this.currentDay = d;
      this.refreshPreview();
    },

    prevMonth() {
      if (this.currentMonth === 1) {
        this.currentMonth = 12;
        this.currentYear--;
      } else this.currentMonth--;
    },

    nextMonth() {
      if (this.currentMonth === 12) {
        this.currentMonth = 1;
        this.currentYear++;
      } else this.currentMonth++;
    },

    incHour() {
      this.currentHour = (this.currentHour + 1) % 24;
      this.refreshPreview();
    },
    decHour() {
      this.currentHour = (this.currentHour - 1 + 24) % 24;
      this.refreshPreview();
    },
    incMinute() {
      this.currentMinute = (this.currentMinute + 1) % 60;
      this.refreshPreview();
    },
    decMinute() {
      this.currentMinute = (this.currentMinute - 1 + 60) % 60;
      this.refreshPreview();
    },
    incSecond() {
      this.currentSecond = (this.currentSecond + 1) % 60;
      this.refreshPreview();
    },
    decSecond() {
      this.currentSecond = (this.currentSecond - 1 + 60) % 60;
      this.refreshPreview();
    },

    // Confirm: cập nhật snapshot mới, emit và đóng
    confirmSelection() {
      this.saveSnapshot();
      this.emitValue();
      this.isOpen = false;
      this.viewMonthPicker = false;
      this.viewYearPicker = false;
    },

    // Today: set giá trị hôm nay, preview ngay, không tự confirm
    goToToday() {
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth() + 1;
      this.currentDay = now.getDate();
      this.currentHour = this.dateOnly ? 0 : now.getHours();
      this.currentMinute = this.dateOnly ? 0 : now.getMinutes();
      this.currentSecond = this.dateOnly ? 0 : now.getSeconds();
      this.refreshPreview();
      this.confirmSelection();
    },

    resetValues() {
      const now = new Date();
      this.currentYear = now.getFullYear();
      this.currentMonth = now.getMonth() + 1;
      this.currentDay = now.getDate();
      this.currentHour = this.dateOnly ? 0 : now.getHours();
      this.currentMinute = this.dateOnly ? 0 : now.getMinutes();
      this.currentSecond = this.dateOnly ? 0 : now.getSeconds();
    },
  },
};
</script>

<style lang="scss" scoped>
.td-datetime {
  position: relative;
  margin: var(--padding);

  .td-label {
    overflow-wrap: normal;
    word-break: keep-all;
    white-space: nowrap;
    padding-right: var(--padding);
    font-size: var(--font-size-l-medium);
  }

  .td-label-top {
    padding-bottom: var(--padding);
  }

  &.td-datetime-read-only {
    opacity: 0.6;
    .td-datetime-input {
      pointer-events: none;
    }
  }

  &.td-datetime-no-margin {
    margin: unset;
  }

  .td-datetime-wrapper {
    position: relative;
  }

  .td-datetime-input-container {
    display: flex;
    align-items: center;
    position: relative;
  }

  .td-datetime-input {
    flex: 1;
    padding: var(--padding);
    border: 1px solid var(--border-color);
    background: var(--bg-thirt-color);
    border-radius: var(--border-radius-component);
    font-size: var(--font-size-medium);
    color: var(--text-primary-color);
    outline: none;
    min-width: 200px;
    transition: all 0.2s ease;

    &::placeholder {
      color: var(--text-secondary-color);
      opacity: var(--placeholder-opacity);
    }
    &:hover {
      border-color: var(--btn-color);
    }
    &:focus {
      border-color: var(--btn-color);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    }
    &.td-datetime-input-open {
      border-color: var(--btn-color);
      box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
    }
  }

  .td-datetime-icon {
    position: absolute;
    right: 10px;
    color: var(--text-secondary-color);
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 4px;
    border-radius: 4px;

    &:hover {
      color: var(--btn-color);
      background: var(--bg-layer-color);
    }
  }

  .td-datetime-popup {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    z-index: 1000;
    background: var(--bg-main-color);
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 360px;
  }

  .td-datetime-calendar {
    .td-datetime-calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .td-datetime-nav {
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        color: var(--text-secondary-color);
        display: flex;
        align-items: center;
        justify-content: center;
        &:hover {
          background: var(--bg-layer-color);
          color: var(--text-primary-color);
        }
      }

      .td-datetime-month-year {
        display: flex;
        gap: 8px;
        font-size: var(--font-size-medium);
        font-weight: 500;

        .td-datetime-month,
        .td-datetime-year {
          cursor: pointer;
          color: var(--text-primary-color);
          &:hover {
            color: var(--btn-color);
          }
        }
      }
    }

    .td-datetime-month-picker,
    .td-datetime-year-picker {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
      max-height: 200px;
      overflow-y: auto;

      .td-datetime-month-option,
      .td-datetime-year-option {
        padding: 8px;
        text-align: center;
        cursor: pointer;
        border-radius: 4px;
        font-size: var(--font-size-medium-rare);
        &:hover {
          background: var(--bg-layer-color);
        }
        &.selected {
          background: var(--btn-color);
          color: var(--selected-item-text-color);
        }
      }
    }

    .td-datetime-days {
      .td-datetime-day-header {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        margin-bottom: 8px;
        span {
          text-align: center;
          font-size: var(--font-size-small);
          color: var(--text-secondary-color);
          font-weight: 500;
        }
      }

      .td-datetime-day-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;

        .td-datetime-day {
          text-align: center;
          padding: 8px 4px;
          cursor: pointer;
          border-radius: 4px;
          font-size: var(--font-size-medium-rare);

          &:hover:not(.other-month) {
            background: var(--bg-layer-color);
          }
          &.other-month {
            color: var(--text-secondary-color);
            opacity: 0.5;
            cursor: default;
          }
          &.selected {
            background: var(--btn-color);
            color: var(--selected-item-text-color);
          }
          &.today {
            border: 1px solid var(--btn-color);
          }
        }
      }
    }
  }

  .td-datetime-time {
    border-top: 1px solid var(--border-color);
    padding-top: 12px;

    .td-datetime-time-header {
      font-size: var(--font-size-medium-rare);
      color: var(--text-secondary-color);
      margin-bottom: 8px;
      text-align: center;
    }

    .td-datetime-time-picker {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;

      .td-datetime-time-column {
        display: flex;
        flex-direction: column;
        align-items: center;

        .td-datetime-time-nav {
          cursor: pointer;
          padding: 2px;
          color: var(--text-secondary-color);
          display: flex;
          align-items: center;
          &:hover {
            color: var(--btn-color);
          }
        }

        .td-datetime-time-value {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary-color);
          min-width: 36px;
          text-align: center;
        }
      }

      .td-datetime-time-separator {
        font-size: 20px;
        font-weight: 600;
        color: var(--text-secondary-color);
        margin: 0 2px;
      }
    }
  }

  .td-datetime-actions {
    display: flex;
    justify-content: space-between;
    border-top: 1px solid var(--border-color);
    padding-top: 12px;
    width: 100%;

    .td-datetime-actions-positive {
      gap: var(--padding);
    }
  }
}
</style>
