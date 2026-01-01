<template>
  <TDPopup
    :visible="true"
    title="Lưu vào Collection"
    width="400px"
    @close="handleClose"
  >
    <div class="td-search-modal">
      <input
        v-model="searchQuery"
        class="td-search-input"
        :placeholder="$t('i18nCommon.search.placeholder')"
      />

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
    handleClose() {
      this.$emit("close"); // 👈 popup chỉ emit
    },

    async save(collection) {
      // logic save giữ nguyên của bạn
      this.close();
    },
  },
};
</script>
<style scoped lang="scss">
@use "@/styles/icon.scss";
</style>
