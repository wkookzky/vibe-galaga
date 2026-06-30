(function () {
  const MG = window.MiniGalaga;

  window.addEventListener("keydown", (event) => {
    MG.keys[event.code] = true;
    if (["ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
      event.preventDefault();
    }
  });

  window.addEventListener("keyup", (event) => {
    MG.keys[event.code] = false;
  });

  MG.dom.startButton.addEventListener("click", MG.resetGame);

  MG.game.achievements = MG.loadAchievements();
  MG.createStars();
  MG.updateHud();
  MG.draw();
})();
