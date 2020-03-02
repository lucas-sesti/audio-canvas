import { Square } from "./square";

// Elements
const $file: HTMLInputElement = document.getElementById('file') as HTMLInputElement;
const $canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement;
const $canvas2: HTMLCanvasElement = document.getElementById('canvas2') as HTMLCanvasElement;

const calibration = 440;

const notes = {
  'C': semitons(calibration, -9),
  'C#': semitons(calibration, -8),
  'D': semitons(calibration, -7),
  'D#': semitons(calibration, -6),
  'E': semitons(calibration, -5),
  'F': semitons(calibration, -4),
  'F#': semitons(calibration, -3),
  'G': semitons(calibration, -2),
  'G#': semitons(calibration, -1),
  'A': semitons(calibration, 0),
  'A#': semitons(440, 1),
  'B': semitons(440, 2),
};

const ctx: CanvasRenderingContext2D = $canvas.getContext('2d');
const ctx2: CanvasRenderingContext2D = $canvas2.getContext('2d');
const colors = ['white', 'red', 'blue', 'green'];
let frequencyBytes: Uint8Array;
let audioCtx: AudioContext;
let analyser: AnalyserNode;
let audioSrc: AudioBufferSourceNode;
let osc: OscillatorNode;


$canvas.width = screen.width;
$canvas.height = 300;
$canvas2.width = screen.width;
$canvas2.height = 128;

function semitons(hz, notes) {
  const p = Math.pow(2, 1/12);
  return hz * Math.pow(p, notes);
}


function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => resolve(reader.result as ArrayBuffer));
    reader.addEventListener('error', reject);

    reader.readAsArrayBuffer(file);
  });
}

$file.addEventListener('change', async () => {
  const buffer = await readFile($file.files[0]);
  initAudio(buffer);
});

async function initAudio(buffer: ArrayBuffer) {
  if (audioCtx) {
    audioSrc.disconnect(analyser);
    analyser.disconnect(audioCtx.destination);
    audioSrc.stop();
    audioCtx.close();
  }

  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  audioSrc = audioCtx.createBufferSource();
  audioSrc.buffer = await audioCtx.decodeAudioData(buffer);
  frequencyBytes = new Uint8Array(analyser.frequencyBinCount);
  audioSrc.connect(analyser).connect(audioCtx.destination);
  // osc = audioCtx.createOscillator();
  audioSrc.start();
}

function waveMap(buffer: AudioBuffer) {
  ctx2.clearRect(0, 0, $canvas2.width, $canvas2.height);

  if (buffer) {
    const p = audioCtx.currentTime / buffer.duration;
    const steps = $canvas2.width;
    const maxH = $canvas2.height / buffer.numberOfChannels;

    for (let i = 0; i < buffer.numberOfChannels; i++) {
      const bytes = buffer.getChannelData(i);
      const pv = p * $canvas2.width;

      const width = $canvas2.width / steps;
      for (let d = 0; d < bytes.length; d += steps) {
        const x = (width * d) / steps;
        const h = bytes[d] * maxH;
        const y = ((maxH / 2) - (h / 2)) + maxH * i;

        const color = x <= pv ? 'white' : 'rgba(255, 255, 255, 0.25)';

        ctx2.fillStyle = color;
        ctx2.fillRect(x, y, width, h);
      }

    }
  }
}

console.log(semitons(440, 1));

function loop() {
  ctx.clearRect(0, 0, $canvas.width, $canvas.height);


  if (frequencyBytes) {
    analyser.getByteFrequencyData(frequencyBytes);

    const bytes = frequencyBytes.slice(0, -45);
    waveMap(audioSrc.buffer);

    for (let i = 0; i < bytes.length; i++) {
      const width = $canvas.width / bytes.length;
      const x = width * i;
      const intensity = bytes[i] / 256;
      const h = intensity * ($canvas.height - 32);

      const color = `rgb(${(1 - (i / bytes.length)) * 255}, ${(i / bytes.length) * 255}, 51)`;

      ctx.fillStyle = color;
      ctx.fillRect(x, ($canvas.height / 2) - h / 2, width, h);

      // ctx.fillRect($canvas.width - 1, $canvas.height - x, width, 1);
    }


    // const data = ctx.getImageData(1, 0, $canvas.width - 1, $canvas.height);
    // ctx.clearRect(0, 0, $canvas.width, $canvas.height);
    // ctx.putImageData(data, 0, 0);

  }


  window.requestAnimationFrame(loop);
}

window.requestAnimationFrame(loop);
