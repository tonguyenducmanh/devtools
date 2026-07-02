// enum for event bus global events
// each event only emit from one place

export const TDEnumEventBus = {
  // Toast hiển thị trên header
  headerToastShow: "headerToastShow",

  // Zen mode (fullscreen tab content)
  zenModeToggle: "zenModeToggle",

  // Zen mode state change (broadcast current zen mode)
  zenModeState: "zenModeState",
};
