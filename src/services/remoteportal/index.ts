import { navigateTo } from '../../utils';
import { getStatus } from './api';

export default async function (card: Element) {
  const btnContainer = card.querySelector('.button-container');
  if (!btnContainer) {
    console.error('cannot find button-container of remote-portal card');
    return;
  }
  try {
    const status = await getStatus();
    if (!status.logged_in) {
      const elem = document.createElement('span');
      elem.classList.add('error');
      elem.innerHTML = 'You are not logged in!';
      card.insertBefore(elem, btnContainer);
    }
    const monitorBtn = card.querySelector('#monitor-button');
    if (monitorBtn) {
      monitorBtn.classList.remove('hide');
      monitorBtn.addEventListener('click', () => {
        navigateTo('/rp/monitor');
      });
    }
  } catch (e) {
    console.log(`Error on checking remote-portal server: ${e}`);
    btnContainer.classList.add('hide');
    const elem = document.createElement('span');
    elem.classList.add('error');
    elem.innerHTML = 'This Service is not Avaiable Right now!';
    card.appendChild(elem);
  }
}
