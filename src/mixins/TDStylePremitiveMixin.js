import tdEnum from "@/common/TDEnum.js";

export default {
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
  },
};
