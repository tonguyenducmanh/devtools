<template>
  <TDPopup :visible="true" :showHeader="false" @close="handleClose">
    <div class="td-search-modal">
      <div class="td-search-input-container">
        <div class="td-icon td-search-icon"></div>
        <input
          v-model="searchQuery"
          class="td-search-input"
          :placeholder="$t('i18nCommon.apiTesting.FindCollectionTitle')"
        />
      </div>

      <div class="td-search-results" v-if="filteredCollection.length > 0">
        <div class="td-search-section">
          <div
            v-for="(collection, index) in filteredCollection"
            :key="collection.name"
            class="td-search-item"
            @click="save(collection)"
          >
            <div class="td-search-item-content">
              <div class="td-search-item-title">
                {{ collection.name }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TDPopup>
</template>

<script>
export default {
  name: "TDAPISaveToCollectionPopup",

  props: {
    allCollection: {
      type: Array,
      default: () => [],
    },
    ownerForm: {
      type: Object,
      required: true,
    },
  },

  data() {
    return {
      searchQuery: "",
    };
  },

  computed: {
    filteredCollection() {
      let me = this;
      if (!this.searchQuery) return me.allCollection;
      let query = this.searchQuery.normalizeText();

      return me.allCollection
        .filter((collection) => {
          let collectionName = collection.name.normalizeText();

          return collectionName.includes(query);
        })
        .slice(0, 8); // Giới hạn 8 kết quả
    },
  },

  methods: {
    show(param) {
      let me = this;
    },
    handleClose() {
      this.$emit("close"); // popup chỉ emit
    },

    async save(collection) {
      // logic save giữ nguyên của bạn
      this.ownerForm.saveToCollection(collection);
      this.handleClose();
    },
  },
};
</script>
<style scoped lang="scss">
.td-search-modal {
  width: 100%;
  max-width: 600px;
  height: 50vh;
  background-color: var(--bg-main-color);
  border: 1px solid var(--border-color);
  border-radius: calc(var(--border-radius) * 1.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .td-search-input-container {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    .td-search-icon {
      margin-right: var(--padding);
    }
    .td-search-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 16px;
      color: var(--text-color);

      &::placeholder {
        color: var(--text-color-secondary);
      }
    }

    .td-search-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0.6;
      transition: all 0.2s ease;

      &:hover {
        opacity: 1;
        background-color: var(--bg-layer-color);
      }
    }
  }

  .td-search-results {
    max-height: 400px;
    overflow: auto;

    .td-search-section {
      padding: 8px 0;

      .td-search-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover,
        &.td-search-item-active {
          background-color: var(--bg-layer-color);
        }

        .td-icon {
          width: 24px;
          height: 24px;
          margin-right: 12px;
          opacity: 0.8;
        }

        .td-search-item-content {
          flex: 1;

          .td-search-item-title {
            font-weight: 500;
            color: var(--text-color);
            margin-bottom: 2px;
          }

          .td-search-item-description {
            font-size: 12px;
            color: var(--text-color-secondary);
          }
        }

        .td-search-item-shortcut {
          span {
            padding: 2px 6px;
            background-color: var(--bg-layer-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            color: var(--text-color-secondary);
          }
        }
      }
    }
  }

  .td-search-empty,
  .td-search-help {
    padding: 40px 16px;
    text-align: center;
    .td-search-empty-text,
    .td-search-help-text {
      color: var(--text-color-secondary);
      font-size: 14px;
    }
  }
}
</style>
