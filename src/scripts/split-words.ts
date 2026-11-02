/** Wraps every word of `element` in a clipping mask so it can rise into view; `restore` undoes it. */
export function splitWords(element: HTMLElement) {
  const original = element.innerHTML;
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) {
    if (walker.currentNode.textContent?.trim()) nodes.push(walker.currentNode as Text);
  }
  for (const node of nodes) {
    const fragment = document.createDocumentFragment();
    for (const word of (node.textContent ?? "").split(/(\s+)/)) {
      if (!word.trim()) {
        fragment.append(document.createTextNode(word));
        continue;
      }
      const mask = document.createElement("span");
      mask.className = "motion-word-mask";
      const inner = document.createElement("span");
      inner.className = "motion-word";
      inner.textContent = word;
      mask.append(inner);
      fragment.append(mask);
    }
    node.replaceWith(fragment);
  }
  return {
    words: element.querySelectorAll<HTMLElement>(".motion-word"),
    restore: () => {
      element.innerHTML = original;
    },
  };
}
