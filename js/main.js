window.addEventListener('DOMContentLoaded', function () {
  UI.bind();
  Sideview.init();
  UI.subscribe(UI.updateOutputs);
  UI.subscribe(Sideview.update);
  UI.set({});
});
