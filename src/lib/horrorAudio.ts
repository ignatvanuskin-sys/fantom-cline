/**
 * HorrorAudio — синтез звука для квест-рума.
 *
 * Звуки НЕ записаны файлами: всё генерируется через Web Audio API прямо
 * в браузере. Причины:
 *  — 0 байт трафика и никаких лицензионных вопросов на аудио;
 *  — параметры можно связать со страницей (пульс ускоряется, когда гость
 *    наводится на кнопку отправки);
 *  — никаких микрофонов и загрузок.
 *
 * Синтезируется:
 *  — drone   : низкий гул коридора (две расстроенные пилы + фильтр)
 *  — heartbeat: сердцебиение (парные низкочастотные удары)
 *  — whisper : шёпот (шум в узкой полосе с АМ-тремолом)
 *  — door    : хлопок двери (шумовой всплеск + падающий синус)
 *  — sting   : скример (резкий шум + нисходящая пила)
 *  — click   : сухой щелчок
 *
 * Важно: контекст создаётся ТОЛЬКО по явному действию пользователя —
 * этого требует политика автовоспроизведения всех браузеров.
 */

/** Максимальная громкость. Специально тихо: хоррор — не про громкость. */
const MASTER = 0.18;

export type SoundName =
  | "door"
  | "sting"
  | "whisper"
  | "click"
  | "heartbeat";

type NoiseCache = { ctx: AudioContext; buffer: AudioBuffer };

export class HorrorAudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private drone: { nodes: (OscillatorNode | AudioBufferSourceNode)[]; gain: GainNode } | null =
    null;
  private noise: NoiseCache | null = null;
  private intensity = 0;
  private enabled = false;

  /** Есть ли вообще Web Audio (старый Safari всё ещё жив). */
  static supported(): boolean {
    if (typeof window === "undefined") return false;
    return Boolean(
      window.AudioContext ??
        (window as unknown as { webkitAudioContext?: unknown })
          .webkitAudioContext,
    );
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.ctx = ctx;
    this.master = master;
    return ctx;
  }

  /** Белый шум: база для шёпота, хлопка и скримера. */
  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise && this.noise.ctx === ctx) return this.noise.buffer;
    const len = Math.floor(ctx.sampleRate * 2);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noise = { ctx, buffer: buf };
    return buf;
  }

  /** Интенсивность 0..1 — двигает частоту пульса. */
  setIntensity(v: number) {
    this.intensity = Math.max(0, Math.min(1, v));
  }

  isEnabled() {
    return this.enabled;
  }

  /**
   * Включить звук. Обязан вызываться из обработчика пользовательского
   * действия (клик/клавиша) — иначе браузер заблокирует контекст.
   */
  async enable(): Promise<boolean> {
    const ctx = this.ensure();
    if (!ctx || !this.master) return false;
    if (ctx.state === "suspended") await ctx.resume();

    this.startDrone();
    const t = ctx.currentTime;
    const g = this.master.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    // Плавный накат: звук не должен включаться ударом
    g.linearRampToValueAtTime(MASTER, t + 1.5);
    this.enabled = true;
    return true;
  }

  disable() {
    const ctx = this.ctx;
    const master = this.master;
    this.enabled = false;
    if (!ctx || !master) return;
    // Работаем с AudioParam громкости, а не с узлом GainNode
    const g = master.gain;
    const t = ctx.currentTime;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0, t + 0.6);
    setTimeout(() => this.stopDrone(), 700);
  }

  async toggle(): Promise<boolean> {
    if (this.enabled) {
      this.disable();
      return false;
    }
    return this.enable();
  }

  /** Скрытая вкладка — глушим. */
  handleVisibility() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    const g = master.gain;
    if (document.hidden) {
      g.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    } else if (this.enabled) {
      g.linearRampToValueAtTime(MASTER, ctx.currentTime + 0.4);
    }
  }

  private startDrone() {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master || this.drone) return;

    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 220;
    filter.Q.value = 3;

    // Две слегка расстроенные пилы дают «нестабильный» гул
    const nodes: OscillatorNode[] = [];
    for (const detune of [-7, 5]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = 48;
      o.detune.value = detune;
      o.connect(filter);
      o.start();
      nodes.push(o);
    }
    filter.connect(gain);
    gain.connect(master);

    // Медленное «дыхание» громкости — гул кажется живым
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.07;
    lfoGain.gain.value = 0.22;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    nodes.push(lfo);

    this.drone = { nodes, gain };
  }

  private stopDrone() {
    const d = this.drone;
    if (!d) return;
    d.nodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        /* уже остановлен */
      }
    });
    d.gain.disconnect();
    this.drone = null;
  }

  destroy() {
    this.stopDrone();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
  }

  /** Tick по таймеру: сердцебиение. */
  heartbeatTick() {
    if (!this.enabled) return;
    const i = this.intensity;
    // чем выше интенсивность, тем чаще стучит
    if (i < 0.15 && Math.random() > 0.25) return;
    this.play("heartbeat");
  }

  /** Один конкретный звук. */
  play(name: SoundName) {
    const ctx = this.ctx;
    const master = this.master;
    if (!ctx || !master) return;
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;

    switch (name) {
      /* --- Удар сердца: два низких удара (lub-dub) --- */
      case "heartbeat": {
        const thump = (at: number, gainVal: number) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(78, at);
          osc.frequency.exponentialRampToValueAtTime(34, at + 0.16);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, at);
          g.gain.linearRampToValueAtTime(gainVal, at + 0.012);
          g.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
          osc.connect(g);
          g.connect(master);
          osc.start(at);
          osc.stop(at + 0.25);
        };
        thump(t, 0.9);
        thump(t + 0.19, 0.55);
        break;
      }

      /* --- Хлопок двери: шумовой всплеск + падающий синус --- */
      case "door": {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(ctx);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 380;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.9, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
        src.connect(bp);
        bp.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + 0.35);

        const sub = ctx.createOscillator();
        sub.type = "sine";
        sub.frequency.setValueAtTime(120, t);
        sub.frequency.exponentialRampToValueAtTime(28, t + 0.4);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.8, t);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        sub.connect(sg);
        sg.connect(master);
        sub.start(t);
        sub.stop(t + 0.5);
        break;
      }

      /* --- Скример: резкий шум + нисходящая пила --- */
      case "sting": {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(ctx);
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 900;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, t);
        g.gain.exponentialRampToValueAtTime(1, t + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
        src.connect(hp);
        hp.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + 0.75);

        const saw = ctx.createOscillator();
        saw.type = "sawtooth";
        saw.frequency.setValueAtTime(1600, t);
        saw.frequency.exponentialRampToValueAtTime(90, t + 0.5);
        const sg = ctx.createGain();
        sg.gain.setValueAtTime(0.0001, t);
        sg.gain.exponentialRampToValueAtTime(0.5, t + 0.02);
        sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
        saw.connect(sg);
        sg.connect(master);
        saw.start(t);
        saw.stop(t + 0.6);
        break;
      }

      /* --- Шёпот: шум в узкой полосе, полоса модулируется --- */
      case "whisper": {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(ctx);
        src.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.setValueAtTime(1400, t);
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 5.5;
        lfoGain.gain.value = 500;
        lfo.connect(lfoGain);
        lfoGain.connect(bp.frequency);
        lfo.start(t);

        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.5, t + 0.35);
        g.gain.linearRampToValueAtTime(0.0001, t + 1.4);
        src.connect(bp);
        bp.connect(g);
        g.connect(master);
        src.start(t);
        src.stop(t + 1.5);
        lfo.stop(t + 1.5);
        break;
      }

      /* --- Тик: короткий сухой щелчок --- */
      case "click": {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = 1400;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
        osc.connect(g);
        g.connect(master);
        osc.start(t);
        osc.stop(t + 0.07);
        break;
      }
    }
  }
}

