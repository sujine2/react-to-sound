class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
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

      this.port.postMessage({ audioData: inputArray });
    }

    return true;
  }
}
registerProcessor("audio-processor", AudioProcessor);
