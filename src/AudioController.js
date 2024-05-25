export class AudioController {
  #audioContext;
  #workletNode;
  #source;
  #stream;
  constructor(socket) {
    this.socket = socket;
  }

  async initialize() {
    this.#audioContext = new window.AudioContext();
    await this.#audioContext.audioWorklet.addModule("processor.js");

    // Audio Worklet
    this.#workletNode = new AudioWorkletNode(
      this.#audioContext,
      "audio-processor"
    );
    this.#stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.#source = this.#audioContext.createMediaStreamSource(this.#stream);

    // connect
    this.#source.connect(this.#workletNode);
    this.#workletNode.connect(this.#audioContext.destination);
    console.log("## connect", this.#workletNode, this.#stream, this.#source);
  }

  sendRawAudioStream() {
    let audioBuffers = [];
    let audioBuffer = [];
    let inputData;
    let nextTimeToSend = Date.now() + 5000;
    this.#workletNode.port.onmessage = (event) => {
      if (
        this.socket.readyState == WebSocket.CONNECTING ||
        this.socket.readyState == WebSocket.OPEN
      ) {
        if (audioBuffer.length >= 480) {
          audioBuffers.push(audioBuffer);
          audioBuffer = [];
        }

        inputData = event.data.audioData;
        audioBuffer.push(...inputData);
        if (Date.now() >= nextTimeToSend) {
          if (audioBuffers.length > 0) {
            for (let i = 0; i < audioBuffers.length; i++) {
              const audioDataObj = {
                rawStream: btoa(
                  String.fromCharCode(
                    ...new Uint8Array(new Float32Array(audioBuffers[i]).buffer)
                  )
                ),
                sampleRate: this.#audioContext.sampleRate,
                sampleSize: 32,
                channel: 1,
                bigEndian: false,
              };

              try {
                this.socket.send(JSON.stringify(audioDataObj));
                console.log("Audio data sent as JSON");
              } catch (e) {
                console.log(e);
              }
              nextTimeToSend = Date.now() + 1000;
            }
          }
          audioBuffers = [];
        }
      } else {
        this.disconnectAudioNodes();
        this.stopMediaStream();
      }
    };
  }

  disconnectAudioNodes() {
    if (this.#source != undefined) {
      this.#source.disconnect();
    }
    if (this.#workletNode != undefined) {
      this.#workletNode.disconnect();
    }
    if (
      this.#audioContext != undefined &&
      this.#audioContext.state == "running"
    ) {
      this.#audioContext.close().then(() => {});
    }

    console.log(
      "All audio resources have been released and audio processing stopped."
    );
  }

  stopMediaStream() {
    if (this.#stream != undefined && this.#stream.active) {
      this.#stream.getTracks().forEach((track) => track.stop());
      console.log("stop media stream");
    }
  }
}
