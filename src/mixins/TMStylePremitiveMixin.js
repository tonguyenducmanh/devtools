import tmEnum from "@/common/TMEnum.js";

export default {
  props: {
    borderRadiusPosition: {
      type: Array,
      default: null,
    },
    noSetBorderRadius: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    borderRadiusStyle() {
      let me = this;
      let style = me.getBorderRadius(me.borderRadiusPosition);
      return style;
    },
  },
  methods: {
    /**
     * set style động cho position absolute
     * @param {*} styleEnum loại postition absolute muốn cấu hình
     * @returns style absolute
     */
    getPositionAbsoluteStyle(styleEnum) {
      let me = this;
      let style = {};
      switch (styleEnum) {
        case tmEnum.AbsolutePositionStyle.TopLeft: {
          style = {
            postion: "absolute",
            top: 0,
            left: 0,
          };
          break;
        }
        case tmEnum.AbsolutePositionStyle.Top100Left: {
          style = {
            postion: "absolute",
            top: 100,
            left: 0,
          };
          break;
        }
        case tmEnum.AbsolutePositionStyle.TopRight: {
          style = {
            postion: "absolute",
            top: 0,
            right: 0,
          };
          break;
        }
        case tmEnum.AbsolutePositionStyle.Top100Right: {
          style = {
            postion: "absolute",
            top: 100,
            right: 0,
          };
          break;
        }
        case tmEnum.AbsolutePositionStyle.BottomLeft: {
          style = {
            postion: "absolute",
            bottom: 0,
            left: 0,
          };
          break;
        }
        case tmEnum.AbsolutePositionStyle.Bottom100Left: {
          style = {
            postion: "absolute",
            bottom: 100,
            left: 0,
          };
          break;
        }
        case tmEnum.AbsolutePositionStyle.BottomRight: {
          style = {
            postion: "absolute",
            bottom: 0,
            right: 0,
          };
          break;
        }
        case tmEnum.AbsolutePositionStyle.Bottom100Right: {
          style = {
            postion: "absolute",
            bottom: 100,
            right: 0,
          };
          break;
        }
      }
      return style;
    },
    /**
     * set style động cho border radius
     * @param {*} styleEnums các góc border muốn cấu hình
     * @returns style border radius
     */
    getBorderRadius(styleEnums) {
      let me = this;
      let styleBorder = "var(--border-radius-component)";
      let style = {
        "border-radius": styleBorder,
      };

      if (me.noSetBorderRadius) {
        style = {
          "border-radius": "unset",
        };
      } else {
        let allPostions = tmEnum.BorderRadiusPosition;
        if (styleEnums && styleEnums.length > 0 && allPostions) {
          let allStyles = [];
          me.setStyleForCurrentBorder(
            styleEnums,
            tmEnum.BorderRadiusPosition.TopLeft,
            allStyles,
          );
          me.setStyleForCurrentBorder(
            styleEnums,
            tmEnum.BorderRadiusPosition.TopRight,
            allStyles,
          );
          me.setStyleForCurrentBorder(
            styleEnums,
            tmEnum.BorderRadiusPosition.BottomRight,
            allStyles,
          );
          me.setStyleForCurrentBorder(
            styleEnums,
            tmEnum.BorderRadiusPosition.BottomLeft,
            allStyles,
          );

          if (allStyles && allStyles.length == 4) {
            style = {
              "border-radius": allStyles.join(" "),
            };
          }
        }
      }
      return style;
    },
    setStyleForCurrentBorder(styleEnums, currentBorder, allStyles) {
      let styleBorder = "var(--border-radius-component)";
      if (styleEnums.includes(currentBorder)) {
        allStyles.push(styleBorder);
      } else {
        allStyles.push("0");
      }
    },
  },
};
