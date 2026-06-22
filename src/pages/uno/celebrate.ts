import { Dialog } from '@/shell/utils';
import { showErrorToast } from '@/shell/utils';
import { Player } from './models';

function playAudio(audioCtx: AudioContext): void {
  const now = audioCtx.currentTime;

  const freqs = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
    1046.5, // C6
    880.0, // A5
    783.99, // G5
    659.25, // E5
    523.25, // C5
    659.25, // E5
    783.99, // G5
    1046.5, // C6
    987.77, // B5
    783.99, // G5
    659.25, // E5
    523.25, // C5
    1046.5, // C6
    987.77, // B5
    880.0, // A5
    783.99, // G5
    659.25, // E5 (ends on a bright note)
  ];

  // Each note: 0.4s duration + 0.1s gap = 0.5s per note.
  // 20 notes × 0.5s = exactly 10 seconds.
  const noteDuration = 0.1;
  const gap = 0.1;
  const step = noteDuration + gap;

  // Volume: 0.9 – loud but still clean (max is 1.0)
  const volume = 0.9;

  freqs.forEach((freq, index) => {
    const startTime = now + index * step;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine'; // pure tone, pleasant
    osc.frequency.value = freq;

    // Envelope: quick attack, slight decay, then release
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(volume * 0.6, startTime + noteDuration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + noteDuration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });
}

export default function (winner: Player): void {
  const dialog = new Dialog('winner-announcement', '');
  dialog.resolvePromiseOnUnexpectedClose = true;
  dialog.dialog.style.backgroundColor = '#00FF7F';
  dialog.dialog.style.color = '#000';
  dialog.header.classList.add('hide');
  dialog.footer.classList.add('hide');
  dialog.body.classList.add('flex-col', 'center');

  dialog.body.innerHTML = `
          <div class="flex-col center">
              <span class="text middle bold" style="margin-bottom: 16px;">The Game Winner is</span>
              <span class="text middle center" style="font-size: 2.5em;font-weight: 700;margin-bottom: 24px;">${winner.name}</span>
              <span style="font-size: 1.5em;font-weight: 600;">Score: ${winner.score}</span>
              <span style="font-size: 1.5em;font-weight: 600;">Wins: ${winner.wins}</span>
          </div>`;

  dialog.open();

  try {
    // Create the audio context (must be done inside the user gesture)
    const audioCtx = new window.AudioContext();

    // Resume if suspended (important for Chrome autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => playAudio(audioCtx));
    } else {
      playAudio(audioCtx);
    }

    dialog.promise.then(() => {
      audioCtx.close();
    });
  } catch (err) {
    showErrorToast(`Web Audio couldn't play: ${err}`);
    // Fallback: if Web Audio fails, at least the vibration works.
  }
}
