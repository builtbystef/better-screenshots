export const schemeBootScript = `(function () {
  function schemeClass(prefers) {
    return prefers === "dark" ? "dark" : null;
  }
  function apply() {
    var prefers = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "no-preference";
    var next = schemeClass(prefers);
    document.documentElement.classList.toggle("dark", next === "dark");
  }
  apply();
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", apply);
})()`;
