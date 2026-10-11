import { describe, expect, it } from "vitest";
import { englishRedirectPath } from "../../src/lib/redirects";

describe("legacy English URL redirects", () => {
  it.each([
    ["/en", "/"],
    ["/en/", "/"],
    ["/en/blog", "/blog"],
    ["/en/blog/", "/blog/"],
    ["/en/blog/test-post/", "/blog/test-post/"],
    ["/en/about", "/ueber"],
    ["/en/contact/", "/kontakt/"],
    ["/en/thanks", "/danke"],
    ["/en/cases/pfotenweb", "/cases/pfotenweb"],
    ["/en/rss.xml", "/rss.xml"],
  ])("redirects %s to %s", (oldPath, target) => {
    expect(englishRedirectPath(oldPath)).toBe(target);
  });

  it.each(["/", "/blog", "/energy", "/enough", "/api/contact"])("does not redirect %s", (path) => {
    expect(englishRedirectPath(path)).toBeNull();
  });
});
