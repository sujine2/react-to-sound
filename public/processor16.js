class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  // 32비트 float 데이터를 16비트 PCM으로 변환하는 함수
  float32ToInt16(buffer) {
    const len = buffer.length;
    const output = new Int16Array(len);

    for (let i = 0; i < len; i++) {
      // 32-bit float (-1.0 to 1.0) -> 16-bit PCM (-32768 to 32767)
      output[i] = Math.max(-1, Math.min(1, buffer[i])) * 32767;
    }

    return output;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const inputDataLeft = input[0];
      const inputDataRight = input.length > 1 ? input[1] : inputDataLeft;

      const inputArray = new Float32Array(inputDataLeft.length);
      for (let i = 0; i < inputDataLeft.length; i++) {
        inputArray[i] = (inputDataLeft[i] + inputDataRight[i]) / 2;
      }

      // 16비트 PCM으로 변환
      const pcmData = this.float32ToInt16(inputArray);

      // 변환된 16비트 PCM 데이터를 전송
      this.port.postMessage({ audioData: pcmData });
    }

    return true;
  }
}
registerProcessor("audio-processor", AudioProcessor);
