chrome.action.onClicked.addListener((tab) => {
  if (tab.id && tab.url && tab.url.includes(".service-now.com/")) {
    chrome.tabs.sendMessage(tab.id, { type: "SNU_TOGGLE_MODAL" })
      .catch(err => console.log("SN QuickFill: Page not ready. Reload and try again.", err.message));
  }
});