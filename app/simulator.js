/*
 * simulator.js - dependency-free browser ES module
 * Nonclinical research bench simulator. NO infection model, therapeutic dose,
 * clinical thresholds, hardware actuation, DOM/network/storage.
 *
 * Exports:
 *   CHANNELS, FAMILIES, generateWindow, validateWindow, extractFeatures, toCSV
 */

export const CHANNELS = Object.freeze(['ph', 'temperature', 'moisture', 'glucose']);
export const FAMILIES = Object.freeze(['steady', 'shift', 'sensor_fault']);

const SCHEMA = 'patchline-bench-window-v1';
const MAX_SEED = 4294967295;

const BOUNDS = {
  ph: [0, 14],
  temperature: [-40, 100],
  moisture: [0, 100],
  glucose: [0, 5],
};

const BASE = {
  ph: [5.5, 8.5],
  temperature: [20, 35],
  moisture: [25, 65],
  glucose: [0.2, 1.2],
};

const SCALES = { ph: 1, temperature: 5, moisture: 30, glucose: 1 };

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function lcg(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function clamp(x, lo, hi) {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

function capChannel(channel, value) {
  if (value === null) return null;
  const [lo, hi] = BOUNDS[channel];
  return clamp(value, lo, hi);
}

function pickChannel(rand) {
  return CHANNELS[Math.floor(rand() * CHANNELS.length)];
}

function generateWindow(family, seed, count = 24) {
  if (!FAMILIES.includes(family)) {
    throw new Error('family must be one of ' + FAMILIES.join(','));
  }
  if (!Number.isInteger(seed) || seed < 1 || seed > MAX_SEED) {
    throw new Error('seed must be an integer in 1..4294967295');
  }
  if (!Number.isInteger(count) || count < 8 || count > 240) {
    throw new Error('count must be an integer in 8..240');
  }

  const rand = lcg(seed);
  const samples = [];

  const basePh = BASE.ph[0] + rand() * (BASE.ph[1] - BASE.ph[0]);
  const baseTemp = BASE.temperature[0] + rand() * (BASE.temperature[1] - BASE.temperature[0]);
  const baseMoist = BASE.moisture[0] + rand() * (BASE.moisture[1] - BASE.moisture[0]);
  const baseGlu = BASE.glucose[0] + rand() * (BASE.glucose[1] - BASE.glucose[0]);

  const shiftStart = Math.floor(count * 0.4);
  const shiftEnd = Math.max(shiftStart + 2, Math.floor(count * 0.7));
  const shiftPh = 0.5 + rand() * 0.7;
  const shiftTemp = 1.5 + rand() * 2.5;
  const shiftMoist = (rand() < 0.5 ? -1 : 1) * (10 + rand() * 15);
  const shiftGlu = 0.2 + rand() * 0.5;

  const faultType = Math.floor(rand() * 4);
  const faultChannel = pickChannel(rand);
  const faultStart = Math.floor(count * 0.3);
  const faultEnd = Math.max(faultStart + 1, Math.floor(count * 0.7));
  const spikeIdx = 1 + Math.floor(rand() * (count - 2));
  const rampStart = Math.floor(count * 0.3);
  const rampEnd = Math.max(rampStart + 1, Math.floor(count * 0.7));
  const rampMag = (rand() < 0.5 ? -1 : 1) * (1 + rand() * 2);

  for (let i = 0; i < count; i++) {
    const t = i;
    const noisePh = (rand() - 0.5) * 0.1;
    const noiseTemp = (rand() - 0.5) * 0.5;
    const noiseMoist = (rand() - 0.5) * 1.0;
    const noiseGlu = (rand() - 0.5) * 0.05;

    let ph = basePh + noisePh;
    let temperature = baseTemp + noiseTemp;
    let moisture = baseMoist + noiseMoist;
    let glucose = baseGlu + noiseGlu;

    if (family === 'shift') {
      let frac = 0;
      if (i >= shiftEnd) {
        frac = 1;
      } else if (i > shiftStart) {
        frac = (i - shiftStart) / (shiftEnd - shiftStart);
      }
      ph += frac * shiftPh;
      temperature += frac * shiftTemp;
      moisture += frac * shiftMoist;
      glucose += frac * shiftGlu;
    } else if (family === 'sensor_fault') {
      if (faultType === 0 && faultChannel === 'ph') ph = null;
      else if (faultType === 0 && faultChannel === 'temperature') temperature = null;
      else if (faultType === 0 && faultChannel === 'moisture') moisture = null;
      else if (faultType === 0 && faultChannel === 'glucose') glucose = null;
      else if (faultType === 1 && i >= faultStart && i <= faultEnd) {
        if (faultChannel === 'ph') ph = basePh;
        else if (faultChannel === 'temperature') temperature = baseTemp;
        else if (faultChannel === 'moisture') moisture = baseMoist;
        else if (faultChannel === 'glucose') glucose = baseGlu;
      } else if (faultType === 2 && i === spikeIdx) {
        if (faultChannel === 'ph') ph = basePh + 3;
        else if (faultChannel === 'temperature') temperature = baseTemp + 15;
        else if (faultChannel === 'moisture') moisture = baseMoist + 30;
        else if (faultChannel === 'glucose') glucose = baseGlu + 2;
      } else if (faultType === 3 && i >= rampStart && i <= rampEnd) {
        const frac = (i - rampStart) / (rampEnd - rampStart);
        if (faultChannel === 'ph') ph += frac * rampMag;
        else if (faultChannel === 'temperature') temperature += frac * rampMag * 5;
        else if (faultChannel === 'moisture') moisture += frac * rampMag * 10;
        else if (faultChannel === 'glucose') glucose += frac * rampMag * 0.5;
      }
    }

    samples.push({
      t,
      ph: capChannel('ph', ph),
      temperature: capChannel('temperature', temperature),
      moisture: capChannel('moisture', moisture),
      glucose: capChannel('glucose', glucose),
    });
  }

  const result = {
    schema: SCHEMA,
    provenance: 'synthetic',
    seed,
    family,
    samples,
  };

  return deepFreeze(result);
}

function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const k of Object.keys(obj)) {
    deepFreeze(obj[k]);
  }
  return obj;
}

function dataKeys(object, allowed) {
  const keys=Reflect.ownKeys(object);
  for(const key of keys){
    assert(typeof key==='string' && allowed.includes(key),'Unsupported key');
    const d=Object.getOwnPropertyDescriptor(object,key);
    assert(d && Object.prototype.hasOwnProperty.call(d,'value'),'Accessors unsupported');
  }
  assert(keys.length===allowed.length,'Missing data keys');
  return keys;
}
function validateWindow(window) {
  if (!isPlainObject(window)) {
    throw new Error('window must be a plain object');
  }
  const keys = dataKeys(window,['schema','provenance','seed','family','samples']);
  assert(keys.length === 5, 'window must have exactly 5 keys');
  assert(keys.includes('schema'), 'window missing schema');
  assert(keys.includes('provenance'), 'window missing provenance');
  assert(keys.includes('seed'), 'window missing seed');
  assert(keys.includes('family'), 'window missing family');
  assert(keys.includes('samples'), 'window missing samples');

  assert(window.schema === SCHEMA, 'schema must be patchline-bench-window-v1');
  assert(
    window.provenance === 'synthetic' ||
      window.provenance === 'bench' ||
      window.provenance === 'imported',
    'provenance must be synthetic, bench, or imported'
  );

  if (window.provenance === 'synthetic') {
    assert(
      Number.isInteger(window.seed) && window.seed >= 1 && window.seed <= MAX_SEED,
      'synthetic seed must be integer 1..4294967295'
    );
    assert(FAMILIES.includes(window.family), 'family must be one of ' + FAMILIES.join(','));
  } else {
    assert(
      window.seed === null || (Number.isInteger(window.seed) && window.seed >= 1 && window.seed <= MAX_SEED),
      'non-synthetic seed must be null or integer 1..4294967295'
    );
    assert(
      window.family === null || FAMILIES.includes(window.family),
      'non-synthetic family must be null or one of ' + FAMILIES.join(',')
    );
  }

  assert(Array.isArray(window.samples), 'samples must be an array');
  assert(window.samples.length >= 8 && window.samples.length <= 240, 'samples length must be 8..240');
  dataKeys(window.samples,['length',...Array.from({length:window.samples.length},(_,i)=>String(i))]);

  const copiedSamples = [];
  let lastT = -Infinity;
  for (let i = 0; i < window.samples.length; i++) {
    const s = window.samples[i];
    if (!isPlainObject(s)) {
      throw new Error('sample ' + i + ' must be a plain object');
    }
    const sKeys = dataKeys(s,['t',...CHANNELS]);
    assert(sKeys.length === 5, 'sample ' + i + ' must have exactly 5 keys');
    assert(sKeys.includes('t'), 'sample ' + i + ' missing t');
    for (const ch of CHANNELS) {
      assert(sKeys.includes(ch), 'sample ' + i + ' missing ' + ch);
    }
    assert(isFiniteNumber(s.t), 'sample ' + i + ' t must be finite number');
    assert(s.t >= 0 && s.t <= 1e9, 'sample ' + i + ' t outside supported elapsed-time range');
    assert(s.t > lastT, 'sample ' + i + ' t must be strictly increasing');
    lastT = s.t;
    const copy = { t: s.t };
    for (const ch of CHANNELS) {
      const v = s[ch];
      assert(v === null || isFiniteNumber(v), 'sample ' + i + ' ' + ch + ' must be null or finite number');
      if (v !== null) {
        const [lo, hi] = BOUNDS[ch];
        assert(v >= lo && v <= hi, 'sample ' + i + ' ' + ch + ' out of bounds');
      }
      copy[ch] = v;
    }
    copiedSamples.push(copy);
  }

  const result = {
    schema: window.schema,
    provenance: window.provenance,
    seed: window.seed,
    family: window.family,
    samples: copiedSamples,
  };
  return deepFreeze(result);
}

function extractFeatures(window) {
  const w=validateWindow(window),features=[];
  for(const ch of CHANNELS){
    const readings=w.samples.filter(s=>s[ch]!==null),n=readings.length,scale=SCALES[ch];
    if(!n){features.push(0,0,0,0,0,1);continue;}
    const mean=readings.reduce((sum,s)=>sum+s[ch],0)/n;
    const timeMean=readings.reduce((sum,s)=>sum+s.t,0)/n;
    const std=Math.sqrt(readings.reduce((sum,s)=>sum+(s[ch]-mean)**2,0)/n);
    const numerator=readings.reduce((sum,s)=>sum+(s.t-timeMean)*(s[ch]-mean),0);
    const denominator=readings.reduce((sum,s)=>sum+(s.t-timeMean)**2,0);
    const values=readings.map(s=>s[ch]);
    const slope=denominator>0?numerator/denominator:0;
    features.push(mean/scale,std/scale,slope/scale,(values.at(-1)-values[0])/scale,(Math.max(...values)-Math.min(...values))/scale,(w.samples.length-n)/w.samples.length);
  }
  assert(features.length===24 && features.every(Number.isFinite),'Nonfinite features');
  return Object.freeze(features);
}

function toCSV(window) {
  const validated = validateWindow(window);
  const header = 'timestamp_s,ph,temperature_c,wetness_pct,glucose_au';
  const lines = [header];
  for (const s of validated.samples) {
    const parts = [String(s.t)];
    parts.push(s.ph === null ? '' : String(s.ph));
    parts.push(s.temperature === null ? '' : String(s.temperature));
    parts.push(s.moisture === null ? '' : String(s.moisture));
    parts.push(s.glucose === null ? '' : String(s.glucose));
    lines.push(parts.join(','));
  }
  return lines.join('\n');
}

export {generateWindow,validateWindow,extractFeatures,toCSV};
