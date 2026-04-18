import MindMap from "simple-mind-map";
import MiniMap from "simple-mind-map/src/plugins/MiniMap.js";
import Drag from "simple-mind-map/src/plugins/Drag.js";
import Select from "simple-mind-map/src/plugins/Select.js";
import RichText from "simple-mind-map/src/plugins/RichText.js";
import AssociativeLine from "simple-mind-map/src/plugins/AssociativeLine.js";
import Export from "simple-mind-map/src/plugins/Export.js";
import ExportPDF from "simple-mind-map/src/plugins/ExportPDF.js";
import ExportXMind from "simple-mind-map/src/plugins/ExportXMind.js";
import KeyboardNavigation from "simple-mind-map/src/plugins/KeyboardNavigation.js";
import NodeImgAdjust from "simple-mind-map/src/plugins/NodeImgAdjust.js";
import TouchEvent from "simple-mind-map/src/plugins/TouchEvent.js";
import SearchPlugin from "simple-mind-map/src/plugins/Search.js";
import RainbowLines from "simple-mind-map/src/plugins/RainbowLines.js";
import OuterFrame from "simple-mind-map/src/plugins/OuterFrame.js";
import MindMapLayoutPro from "simple-mind-map/src/plugins/MindMapLayoutPro.js";
import NodeBase64ImageStorage from "simple-mind-map/src/plugins/NodeBase64ImageStorage.js";

let pluginsRegistered = false;
import Themes from "simple-mind-map-plugin-themes";

export function registerPlugins() {
  if (pluginsRegistered) return;
  pluginsRegistered = true;
  Themes.init(MindMap);
  MindMap.usePlugin(MiniMap)
    .usePlugin(Drag)
    .usePlugin(Select)
    .usePlugin(RichText)
    .usePlugin(AssociativeLine)
    .usePlugin(Export)
    .usePlugin(ExportPDF)
    .usePlugin(ExportXMind)
    .usePlugin(KeyboardNavigation)
    .usePlugin(NodeImgAdjust)
    .usePlugin(TouchEvent)
    .usePlugin(SearchPlugin)
    .usePlugin(RainbowLines)
    .usePlugin(OuterFrame)
    .usePlugin(MindMapLayoutPro)
    .usePlugin(NodeBase64ImageStorage);
}

export { MindMap };

export const defaultMindMapData = {
  root: {
    data: { text: "Central Topic" },
    children: [
      {
        data: { text: "Branch 1" },
        children: [
          { data: { text: "Topic 1.1" }, children: [] },
          { data: { text: "Topic 1.2" }, children: [] },
        ],
      },
      {
        data: { text: "Branch 2" },
        children: [{ data: { text: "Topic 2.1" }, children: [] }],
      },
      {
        data: { text: "Branch 3" },
        children: [],
      },
    ],
  },
  theme: { template: "dark2", config: {} },
  layout: "logicalStructure",
};

export const themeOptions = [
  { value: "default", label: "Default" },
  { value: "classic", label: "Classic" },
  { value: "classic2", label: "Classic 2" },
  { value: "classic3", label: "Classic 3" },
  { value: "classic4", label: "Classic 4" },
  { value: "classicGreen", label: "Classic Green" },
  { value: "classicBlue", label: "Classic Blue" },
  { value: "dark", label: "Dark" },
  { value: "dark2", label: "Dark 2" },
  { value: "freshGreen", label: "Fresh Green" },
  { value: "freshRed", label: "Fresh Red" },
  { value: "romanticPurple", label: "Romantic Purple" },
  { value: "pinkGrape", label: "Pink Grape" },
  { value: "mint", label: "Mint" },
  { value: "gold", label: "Gold" },
  { value: "vitalityOrange", label: "Vitality Orange" },
  { value: "greenLeaf", label: "Green Leaf" },
  { value: "skyGreen", label: "Sky Green" },
  { value: "earthYellow", label: "Earth Yellow" },
  { value: "blueSky", label: "Blue Sky" },
  { value: "brainImpairedPink", label: "Brain Impaired Pink" },
  { value: "minions", label: "Minions" },
];

export const layoutOptions = [
  { value: "logicalStructure", label: "Logical Structure" },
  { value: "mindMap", label: "Mind Map" },
  { value: "catalogOrganization", label: "Catalog" },
  { value: "organizationStructure", label: "Organization" },
  { value: "timeline", label: "Timeline" },
  { value: "verticalTimeline", label: "Vertical Timeline" },
  { value: "fishbone", label: "Fishbone" },
];

export const exportFormats = [
  { value: "smm", label: ".smm (JSON)", ext: "smm" },
  { value: "json", label: ".json", ext: "json" },
  { value: "xmind", label: ".xmind", ext: "xmind" },
  { value: "png", label: ".png", ext: "png" },
  { value: "svg", label: ".svg", ext: "svg" },
  { value: "pdf", label: ".pdf", ext: "pdf" },
  { value: "md", label: ".md (Markdown)", ext: "md" },
];
