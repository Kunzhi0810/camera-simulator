window.addEventListener('DOMContentLoaded', function () {
  UI.bind();
  Sideview.init();
  Sideview.bindDrag();
  Miniframe.init();
  UI.subscribe(UI.updateOutputs);
  UI.subscribe(Sideview.update);
  UI.subscribe(Miniframe.update);
  UI.set({});
});
