import tdEnum from "@/common/TDEnum.js";

export default {
  props: {
    borderRadiusPosition: {
      type: Array,
      default: null,
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
        case tdEnum.AbsolutePositionStyle.TopLeft: {
          style = {
            postion: "absolute",
            top: 0,
            left: 0,
          };
          break;
        }
        case tdEnum.AbsolutePositionStyle.Top100Left: {
          style = {
            postion: "absolute",
            top: 100,
            left: 0,
          };
          break;
        }
        case tdEnum.AbsolutePositionStyle.TopRight: {
          style = {
            postion: "absolute",
            top: 0,
            right: 0,
          };
          break;
        }
        case tdEnum.AbsolutePositionStyle.Top100Right: {
          style = {
            postion: "absolute",
            top: 100,
            right: 0,
          };
          break;
        }
        case tdEnum.AbsolutePositionStyle.BottomLeft: {
          style = {
            postion: "absolute",
            bottom: 0,
            left: 0,
          };
          break;
        }
        case tdEnum.AbsolutePositionStyle.Bottom100Left: {
          style = {
            postion: "absolute",
            bottom: 100,
            left: 0,
          };
          break;
        }
        case tdEnum.AbsolutePositionStyle.BottomRight: {
          style = {
            postion: "absolute",
            bottom: 0,
            right: 0,
          };
          break;
        }
        case tdEnum.AbsolutePositionStyle.Bottom100Right: {
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
      let styleBorder = "var(--border-radius)";
      let style = {
        "border-radius": styleBorder,
      };

      let allPostions = tdEnum.BorderRadiusPosition;
      if (styleEnums && styleEnums.length > 0 && allPostions) {
        let allStyles = [];
        me.setStyleForCurrentBorder(
          styleEnums,
          tdEnum.BorderRadiusPosition.TopLeft,
          allStyles
        );
        me.setStyleForCurrentBorder(
          styleEnums,
          tdEnum.BorderRadiusPosition.TopRight,
          allStyles
        );
        me.setStyleForCurrentBorder(
          styleEnums,
          tdEnum.BorderRadiusPosition.BottomRight,
          allStyles
        );
        me.setStyleForCurrentBorder(
          styleEnums,
          tdEnum.BorderRadiusPosition.BottomLeft,
          allStyles
        );

        if (allStyles && allStyles.length == 4) {
          style = {
            "border-radius": allStyles.join(" "),
          };
        }
      }
      return style;
    },
    setStyleForCurrentBorder(styleEnums, currentBorder, allStyles) {
      let styleBorder = "var(--border-radius)";
      if (styleEnums.includes(currentBorder)) {
        allStyles.push(styleBorder);
      } else {
        allStyles.push("0");
      }
    },
  },
};
