const noteFrequency = {
  C4: 261.63,
  E4: 329.63,
  G4: 392.0,
  G3: 196.0,
  E3: 164.81,
  C3: 130.81,
  Ab2: 103.83,
};

const makeNoiseBuffer = (context) => {
  const buffer = context.createBuffer(1, context.sampleRate * 1.2, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
};

export class AudioEngine {
  constructor() {
    this.enabled = false;
    this.context = null;
    this.noiseBuffer = null;
    this.activeScratch = null;
  }

  async ensureContext() {
    if (!this.context) {
      this.context = new window.AudioContext();
      this.noiseBuffer = makeNoiseBuffer(this.context);
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
    return this.context;
  }

  async setEnabled(value) {
    this.enabled = Boolean(value);
    if (this.enabled) {
      await this.ensureContext();
    } else {
      this.stopScratch();
    }
  }

  async playTone(freq, start, duration, type = "triangle", gainValue = 0.08) {
    if (!this.enabled) return;
    const context = await this.ensureContext();
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);

    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + 0.02);
    gain.gain.linearRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  async playCompletion() {
    if (!this.enabled) return;
    const context = await this.ensureContext();
    const now = context.currentTime;
    this.playTone(noteFrequency.C4, now, 0.15);
    this.playTone(noteFrequency.E4, now + 0.08, 0.15);
    this.playTone(noteFrequency.G4, now + 0.16, 0.22);
  }

  async playReject() {
    if (!this.enabled) return;
    const context = await this.ensureContext();
    const now = context.currentTime;
    this.playTone(noteFrequency.G3, now, 0.18, "square", 0.07);
    this.playTone(noteFrequency.E3, now + 0.13, 0.18, "square", 0.07);
    this.playTone(noteFrequency.C3, now + 0.26, 0.2, "square", 0.07);
    this.playTone(noteFrequency.Ab2, now + 0.39, 0.22, "square", 0.07);
  }

  async playConfession() {
    if (!this.enabled) return;
    const context = await this.ensureContext();
    const now = context.currentTime;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(22, now + 0.38);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  async startScratch() {
    if (!this.enabled || this.activeScratch) return;
    const context = await this.ensureContext();

    const source = context.createBufferSource();
    source.buffer = this.noiseBuffer;
    source.loop = true;

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1400;

    const gain = context.createGain();
    gain.gain.value = 0.02;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    source.start();
    this.activeScratch = { source };
  }

  stopScratch() {
    if (!this.activeScratch) return;
    this.activeScratch.source.stop();
    this.activeScratch.source.disconnect();
    this.activeScratch = null;
  }
}
