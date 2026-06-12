window.addEventListener('DOMContentLoaded', function () {
  UI.bind();
  Sideview.init();
  Sideview.bindDrag();
  UI.subscribe(UI.updateOutputs);
  UI.subscribe(Sideview.update);
  UI.set({});
});
