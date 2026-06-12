window.addEventListener('DOMContentLoaded', function () {
  UI.bind();
  UI.subscribe(UI.updateOutputs);
  UI.set({});
});
