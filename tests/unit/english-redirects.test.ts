import { describe, expect, it } from "vitest";
import { englishRedirectPath } from "../../src/lib/redirects";

describe("legacy English URL redirects", () => {
  it.each([
    ["/en/blog", "/blog"],
    ["/en/blog/", "/blog/"],
    ["/en/blog/test-post/", "/blog/test-post/"],
    ["/en/about", "/ueber"],
    ["/en/cases/pfotenweb", "/cases/pfotenweb"],
    ["/en/rss.xml", "/rss.xml"],
  ])("redirects %s to %s", (oldPath, target) => {
    expect(englishRedirectPath(oldPath)).toBe(target);
  });

  it.each([
    "/",
    "/blog",
    "/energy",
    "/enough",
    "/api/contact",
    "/en",
    "/en/",
    "/en/contact",
    "/en/thanks",
    "/en/wordpress",
  ])("does not redirect real page or non-English path %s", (path) => {
    expect(englishRedirectPath(path)).toBeNull();
  });
});
