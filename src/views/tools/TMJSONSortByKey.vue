<template>
  <div class="flex container">
    <div class="flex flex-col main-area">
      <div class="flex io-section">
        <TMTextEditor
          isLabelTop
          :enableHighlight="true"
          language="json"
          :label="$t('i18nCommon.JSONSortByKey.inputLabel')"
          :placeHolder="$t('i18nCommon.JSONSortByKey.inputPlaceholder')"
          v-model="inputJSON"
          :wrapText="currentConfigLayout.wrapText"
        ></TMTextEditor>
      </div>
      <div class="flex">
        <TMButton
          :label="$t('i18nCommon.JSONSortByKey.sort')"
          @click="sortJSON"
        ></TMButton>
        <TMButton
          @click="applyMock"
          :type="$tmEnum.buttonType.secondary"
          :label="$t('i18nCommon.JSONSortByKey.example')"
        ></TMButton>
      </div>
    </div>

    <TMSubSidebar
      v-model="currentConfigLayout.isShowSidebar"
      @toggleSidebar="toggleSidebar"
    >
      <template v-slot:menu>
        <div class="tm-sidebar-menu">
          <TMSlideOption
            :showIcon="true"
            v-model="currentConfigLayout.currentSidebarOption"
            :options="sidebarOptions"
            :noMargin="true"
            @change="updateConfigLayout"
          />
        </div>
      </template>
      <template v-slot:main>
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Help
          "
        >
          <TMJSONSortByKeyHelp />
        </div>
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.History
          "
        >
          <TMHistorySidebar
            ref="history"
            :applyFunction="handleApplyHistory"
            titleKey="inputJSON"
            :noMargin="true"
            :cacheKey="$tmEnum.cacheConfig.JSONSortByKeyHistory"
          />
        </div>
        <div
          class="flex flex-col tm-sidebar-content"
          v-show="
            currentConfigLayout.currentSidebarOption ==
            $tmEnum.ToolSidebarOption.Setting
          "
        >
          <TMCheckbox
            :variant="$tmEnum.checkboxType.switch"
            v-model="currentConfigLayout.wrapText"
            :label="$t('i18nCommon.apiTesting.wrapText')"
            @change="updateConfigLayout"
          ></TMCheckbox>
        </div>
      </template>
    </TMSubSidebar>
  </div>
</template>

<script>
import TMSubSidebar from "@/components/TMSubSidebar.vue";
import TMToolBase from "@/views/tools/base/TMToolBase.vue";
import TMJSONSortByKeyHelp from "@/views/helps/TMJSONSortByKeyHelp.vue";
import TMHistorySidebar from "@/components/TMHistorySidebar.vue";
import { sortObjectByKey } from "@/monarch/TMMonacoActionConfig.js";

export default {
  extends: TMToolBase,
  name: "TMJSONSortByKey",
  components: { TMSubSidebar, TMJSONSortByKeyHelp, TMHistorySidebar },
  created() {},
  beforeUnmount() {},
  mounted() {},

  computed: {
    sidebarOptions() {
      let options = [];
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Help,
        label: this.$t("i18nCommon.sidebarOption.help"),
        icon: "tm-help-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.Setting,
        label: this.$t("i18nCommon.sidebarOption.setting"),
        icon: "tm-setting-icon",
      });
      options.push({
        value: this.$tmEnum.ToolSidebarOption.History,
        label: this.$t("i18nCommon.history.title"),
        icon: "tm-history-icon",
      });
      return options;
    },
  },

  methods: {
    sortJSON() {
      let me = this;
      try {
        if (!me.inputJSON || !me.inputJSON.trim()) {
          return;
        }
        const parsed = JSON.parse(me.inputJSON.trim());
        const sorted = sortObjectByKey(parsed);
        me.inputJSON = JSON.stringify(sorted, null, 2);
        me.saveToHistory();
        me.$tmToast.success(me.$t("i18nCommon.toastMessage.success"));
      } catch (error) {
        console.error("Error in sortJSON:", error);
        me.$tmToast.error(me.$t("i18nCommon.toastMessage.error"));
      }
    },

    async applyMock() {
      let me = this;
      me.inputJSON = JSON.stringify(
        {
          order_sn: "260226QHNM21PM",
          buyer_user_name: "nhiiley070",
          return_order_sn_list: [],
          order_income: {
            escrow_amount: 266363,
            buyer_total_amount: 298900,
            original_price: 360000,
            seller_discount: 11000,
            shopee_discount: 0,
            voucher_from_seller: 20480,
            voucher_from_shopee: 36120,
            coins: 0,
            buyer_paid_shipping_fee: 6500,
            buyer_transaction_fee: 0,
            cross_border_tax: 0,
            payment_promotion: 0,
            commission_fee: 42708,
            service_fee: 3000,
            seller_transaction_fee: 16449,
            seller_lost_compensation: 0,
            seller_coin_cash_back: 0,
            escrow_tax: 0,
            final_shipping_fee: -6500,
            actual_shipping_fee: 65100,
            order_chargeable_weight: 0,
            shopee_shipping_rebate: 58600,
            shipping_fee_discount_from_3pl: 0,
            seller_shipping_discount: 0,
            estimated_shipping_fee: 65100,
            seller_voucher_code: ["RWSDP260226GA"],
            drc_adjustable_refund: 0,
            cost_of_goods_sold: 349000,
            original_cost_of_goods_sold: 349000,
            original_shopee_discount: 0,
            seller_return_refund: 0,
            items: [
              {
                item_id: 20493775647,
                item_name:
                  "Thức Ăn Cho Mèo Dạng Hạt Vị Cá Ngừ Mọi Lứa Tuổi - Hello Cat Tuna 5kg",
                item_sku: "HCF5",
                model_id: 0,
                model_name: "",
                model_sku: "",
                original_price: 360000,
                discounted_price: 349000,
                discount_from_coin: 0,
                discount_from_voucher_shopee: 36120,
                discount_from_voucher_seller: 20480,
                seller_discount: 11000,
                activity_type: "",
                is_main_item: false,
                activity_id: 0,
                quantity_purchased: 1,
                ams_commission_fee: 0,
              },
            ],
            reverse_shipping_fee: 0,
            final_product_protection: 0,
            final_product_vat_tax: 0,
            credit_card_promotion: 0,
            credit_card_transaction_fee: 16449,
            order_ams_commission_fee: 0,
            escrow_amount_after_adjustment: 266363,
            shipping_seller_protection_fee_amount: 0,
          },
        },
        null,
        2,
      );
    },
    /**
     * Lưu input JSON hiện tại vào lịch sử
     */
    async saveToHistory() {
      let me = this;
      if (me.$refs.history && me.inputJSON) {
        let historyItem = {
          inputJSON: me.inputJSON,
        };
        await me.$refs.history.saveToHistory(historyItem);
      }
    },
    /**
     * Áp dụng input từ lịch sử
     * @param {Object} item - Item lịch sử
     */
    handleApplyHistory(item) {
      let me = this;
      if (item && item.inputJSON) {
        me.inputJSON = item.inputJSON;
        me.sortJSON();
      }
    },
  },

  data() {
    return {
      keyCacheLayout: this.$tmEnum.cacheConfig.JSONSortByKeyConfigLayout,
      currentConfigLayout: {
        isShowSidebar: true,
        currentSidebarOption: this.$tmEnum.ToolSidebarOption.Help,
        wrapText: true,
      },
      inputJSON: null,
    };
  },
};
</script>

<style scoped>
.container {
  width: 100%;
  height: 100%;
}
.io-section {
  flex: 1;
  gap: var(--padding);
  width: 100%;
}
.main-area {
  flex: 1;
  height: 100%;
}
.tm-sidebar-content {
  width: 100%;
  height: 100%;
  justify-content: flex-start;
  overflow: auto;
}
</style>
