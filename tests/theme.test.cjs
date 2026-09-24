const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync("assets/js/theme.js", "utf8");
function page(storage, dark = false) {
  const attributes = {};
  const classes = { add() {}, remove() {}, toggle() {} };
  const context = vm.createContext({
    localStorage: storage,
    document: {
      documentElement: {
        classList: classes,
        setAttribute(k, v) {
          attributes[k] = v;
        },
        getAttribute(k) {
          return attributes[k];
        },
      },
      getElementById() {
        return {};
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getElementsByTagName() {
        return [];
      },
      getElementsByClassName() {
        return [];
      },
      addEventListener() {},
    },
    window: {
      setTimeout() {},
      matchMedia() {
        return { matches: dark, addEventListener() {} };
      },
    },
  });
  vm.runInContext(source + "\ninitTheme();", context);
  return { attributes, run: (code) => vm.runInContext(code, context) };
}
test("dark mode and palette survive navigation and reload", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  page(storage).run('setThemeSetting("dark"); setThemeVariant("binary");');
  for (let i = 0; i < 3; i++) {
    const next = page(storage);
    assert.equal(next.attributes["data-theme"], "dark");
    assert.equal(next.attributes["data-theme-variant"], "binary");
  }
});
test("system preference resolves to the OS colour scheme", () => {
  const storage = { getItem: (key) => (key === "theme" ? "system" : null), setItem() {} };
  assert.equal(page(storage, true).attributes["data-theme"], "dark");
  assert.equal(page(storage, false).attributes["data-theme"], "light");
});
test("theme remains usable when storage is blocked", () => {
  const blocked = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("denied");
    },
  };
  const current = page(blocked);
  current.run('setThemeSetting("dark");');
  assert.equal(current.attributes["data-theme"], "dark");
});
