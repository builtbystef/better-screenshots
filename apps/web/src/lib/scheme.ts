export const schemeBootScript = `(function () {
  var dark = window.matchMedia("(prefers-color-scheme: dark)");
  function apply() {
    document.documentElement.classList.toggle("dark", dark.matches);
  }
  apply();
  dark.addEventListener("change", apply);
})()`;
