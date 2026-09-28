/**
 * Audio processing utilities for Gemini Live API
 * - Input: 16kHz 16-bit linear PCM little-endian
 * - Output: 24kHz 16-bit linear PCM little-endian
 */

/**
 * Resamples float32 audio buffer from inputSampleRate to targetSampleRate (16000Hz)
 */
export function resampleTo16k(
  inputData: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number = 16000
): Float32Array {
  if (inputSampleRate === targetSampleRate) {
    return inputData;
  }
  const ratio = inputSampleRate / targetSampleRate;
  const newLength = Math.round(inputData.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetInput = 0;

  while (offsetResult < result.length) {
    const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
    // Linear interpolation or average over range
    let accum = 0;
    let count = 0;
    for (let i = offsetInput; i < nextOffsetInput && i < inputData.length; i++) {
      accum += inputData[i];
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetInput = nextOffsetInput;
  }
  return result;
}

/**
 * Converts Float32Array [-1.0, 1.0] to 16-bit signed PCM ArrayBuffer (Little Endian)
 */
export function float32ToPcm16(float32Array: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // 16-bit signed integer range: -32768 to 32767
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/**
 * Converts 16-bit PCM ArrayBuffer to Base64 string safely
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192; // Chunk to prevent call stack overflow
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Decodes Base64 16-bit PCM little-endian audio chunk into an AudioBuffer at 24kHz
 */
export function pcm16Base64ToAudioBuffer(
  base64String: string,
  audioCtx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataView = new DataView(bytes.buffer);
  const numSamples = Math.floor(len / 2);
  const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const int16 = dataView.getInt16(i * 2, true);
    // Convert int16 to float32 range [-1.0, 1.0]
    channelData[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7fff;
  }

  return audioBuffer;
}

/**
 * Calculates Root Mean Square (RMS) volume level [0.0, 1.0]
 */
export function calculateRMS(samples: Float32Array): number {
  if (!samples || samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  const rms = Math.sqrt(sum / samples.length);
  return Math.min(1, rms * 4); // boost multiplier for natural voice visualization
}
