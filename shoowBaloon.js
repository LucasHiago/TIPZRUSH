export const showBalloon = (value) => {
  return new Promise((resolve) => {
    const balloonContainer = document.querySelector('.balloon-container');

    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    balloon.textContent = `+ R$ ${value.toFixed(2)}`;

    balloonContainer.appendChild(balloon);

    balloon.addEventListener('animationend', () => {
      balloonContainer.removeChild(balloon);
      resolve();
    });
  });
};