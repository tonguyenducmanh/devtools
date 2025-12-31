<template>
  <div class="td-search-modal" @click.stop>
    <div class="td-search-input-container">
      <div class="td-icon td-search-icon"></div>
      <input
        ref="searchInput"
        v-model="searchQuery"
        type="text"
        :placeholder="$t('i18nCommon.search.placeholder')"
        class="td-search-input"
      />
      <button class="td-search-close" @click="closeSearchModal">
        <div class="td-icon td-close-icon"></div>
      </button>
    </div>

    <div class="td-search-results" v-if="filteredCollection.length > 0">
      <div class="td-search-section">
        <div
          v-for="(collection, index) in filteredCollection"
          :key="collection.name"
          class="td-search-item"
          @click="saveToCollection(collection)"
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
</template>

<script>
export default {
  name: "TDAPISaveToCollectionPopup",

  data() {
    return {
      searchQuery: "",
    };
  },
  props: {
    allCollection: {
      type: Array,
      default: [],
    },
  },
  async created() {},
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
  beforeUnmount() {},
  methods: {
    closeSearchModal() {
      //todo: gọi hàm close
      this.searchQuery = "";
    },
    async saveToCollection(collection) {
      let me = this;
      let historyItem = me.buildHistoryItemForSave();
      let newRequestId = me.$tdUtility.newGuid();
      if (collection && historyItem) {
        if (!collection.requests) {
          collection.requests = [];
        }
        historyItem.requestId = newRequestId;
        collection.requests.push(historyItem);
        await me.saveCollectionToCache();
        me.currentRequestId = newRequestId;
        this.$tdToast.success(null, this.$t("i18nCommon.toastMessage.success"));
      }
      this.closeSearchModal();
    },
  },
};
</script>

<style scoped lang="scss">
@use "@/styles/icon.scss";
</style>
