import browser from "webextension-polyfill";

export function pageTitleI18n(): void {
  const titleNode = document.querySelector("title");
  if (titleNode) {
    let key = titleNode.innerHTML;
    if (key.startsWith("__MSG_") && key.endsWith("__")) {
      titleNode.innerHTML = i18n(key.substring(6, key.length - 2));
      return;
    }
  }
  console.log("Could not replace Page-Title with i18n-Message.");
}

export function i18n(
  messageName: string,
  substitutions?: string | string[]
): string {
  return browser.i18n.getMessage(messageName, substitutions);
}
