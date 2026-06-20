import axios from 'axios';

export default async function (card: Element) {
  try {
    const response = await axios.get('https://wiki.ring.home/');
    if (response.status === 200) {
      const enterBtn = card.querySelector('#kiwix-button');
      if (enterBtn) {
        enterBtn.classList.remove('hide');
        enterBtn.addEventListener('click', async () => {
          window.location.href = 'https://wiki.ring.home/#lang=';
        });
      }
    }
  } catch (e) {
    console.log(`Error on checking kiwix server: ${e}`);
    const btnContainer = card.querySelector('.button-container');
    if (btnContainer) {
      btnContainer.classList.add('hide');
    }
    const elem = document.createElement('span');
    elem.classList.add('error');
    elem.innerHTML = 'This Service is not Avaiable Right now!';
    card.appendChild(elem);
  }
}
