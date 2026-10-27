const fs = require('fs');
const path = require('path');

function generateTingTingWav() {
  const sampleRate = 44100;
  const duration = 0.85; // seconds
  const totalSamples = Math.floor(sampleRate * duration);
  const buffer = Buffer.alloc(44 + totalSamples * 2);

  // WAV Header
  // 'RIFF'
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + totalSamples * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32);  // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(totalSamples * 2, 40);

  // Ping 1 (C6 ~ 1046.5 Hz) starting at t=0
  const f1 = 1046.5;
  const f1_harmonic = 2093.0;

  // Ping 2 (E6 ~ 1318.5 Hz) starting at t=0.18s
  const startPing2 = 0.18;
  const f2 = 1318.5;
  const f2_harmonic = 2637.0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Ping 1
    if (t < 0.4) {
      const attack = Math.min(1, t / 0.005);
      const decay = Math.exp(-t * 14);
      const wave = Math.sin(2 * Math.PI * f1 * t) * 0.7 + Math.sin(2 * Math.PI * f1_harmonic * t) * 0.3;
      sample += attack * decay * wave * 0.5;
    }

    // Ping 2
    if (t >= startPing2) {
      const t2 = t - startPing2;
      const attack2 = Math.min(1, t2 / 0.005);
      const decay2 = Math.exp(-t2 * 9);
      const wave2 = Math.sin(2 * Math.PI * f2 * t2) * 0.7 + Math.sin(2 * Math.PI * f2_harmonic * t2) * 0.3;
      sample += attack2 * decay2 * wave2 * 0.6;
    }

    // Soft clamp between -1.0 and 1.0
    sample = Math.max(-1, Math.min(1, sample));
    const int16 = Math.round(sample * 32767);
    buffer.writeInt16LE(int16, 44 + i * 2);
  }

  return buffer;
}

const wavBuffer = generateTingTingWav();

// Save to assets/sounds
const assetsSoundsDir = path.resolve(__dirname, '../assets/sounds');
if (!fs.existsSync(assetsSoundsDir)) {
  fs.mkdirSync(assetsSoundsDir, { recursive: true });
}
const assetsWavPath = path.join(assetsSoundsDir, 'notification_ting.wav');
fs.writeFileSync(assetsWavPath, wavBuffer);
console.log('Saved to:', assetsWavPath);

// Save to android/app/src/main/res/raw
const androidRawDir = path.resolve(__dirname, '../android/app/src/main/res/raw');
if (!fs.existsSync(androidRawDir)) {
  fs.mkdirSync(androidRawDir, { recursive: true });
}
const androidWavPath = path.join(androidRawDir, 'notification_ting.wav');
fs.writeFileSync(androidWavPath, wavBuffer);
console.log('Saved to:', androidWavPath);
