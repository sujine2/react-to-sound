export class AudioController {
  #audioContext;
  #workletNode;
  #source;
  #stream;
  #intervalId;
  constructor(socket) {
    this.socket = socket;
  }

  async initialize32() {
    this.#audioContext = new window.AudioContext();
    await this.#audioContext.audioWorklet.addModule("processor32.js");

    // Audio Worklet
    this.#workletNode = new AudioWorkletNode(
      this.#audioContext,
      "audio-processor"
    );
    this.#stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.#source = this.#audioContext.createMediaStreamSource(this.#stream);
    let track = this.#stream.getAudioTracks()[0];
    console.log(track.getCapabilities());

    // connect
    this.#source.connect(this.#workletNode);
    this.#workletNode.connect(this.#audioContext.destination);
    console.log("## connect", this.#workletNode, this.#stream, this.#source);
  }

  async initialize16() {
    this.#audioContext = new window.AudioContext();
    await this.#audioContext.audioWorklet.addModule("processor16.js");

    // Audio Worklet
    this.#workletNode = new AudioWorkletNode(
      this.#audioContext,
      "audio-processor"
    );
    this.#stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.#source = this.#audioContext.createMediaStreamSource(this.#stream);
    let track = this.#stream.getAudioTracks()[0];
    console.log(track.getCapabilities());

    // connect
    this.#source.connect(this.#workletNode);
    this.#workletNode.connect(this.#audioContext.destination);
    console.log("## connect", this.#workletNode, this.#stream, this.#source);
  }

  sendRawAudioStream() {
    let inputData;
    this.#workletNode.port.onmessage = (event) => {
      if (
        this.socket.readyState == WebSocket.CONNECTING ||
        this.socket.readyState == WebSocket.OPEN
      ) {
        inputData = event.data.audioData;

        const audioDataObj = {
          rawStream: Array.from(inputData),
          sampleRate: this.#audioContext.sampleRate,
          sampleSize: 32,
          channel: 1,
          bigEndian: false,
        };

        try {
          this.socket.send(JSON.stringify(audioDataObj));
          // console.log("Audio data sent as JSON");
        } catch (e) {
          console.log(e);
        }
      } else {
        this.disconnectAudioNodes();
        this.stopMediaStream();
      }
    };
  }

  sendRawAudioByteStream() {
    let inputData;
    let audioDataBuffer = [];

    this.#workletNode.port.onmessage = (event) => {
      const audioData = event.data.audioData;
      audioDataBuffer.push(...audioData); // 음성 데이터를 계속 모아둠
    };

    this.#intervalId = setInterval(() => {
      if (audioDataBuffer.length > 0) {
        if (
          this.socket.readyState == WebSocket.CONNECTING ||
          this.socket.readyState == WebSocket.OPEN
        ) {
          // console.log(audioDataBuffer);
          // console.log("변환", new Float32Array(audioDataBuffer));
          const audioDataObj = {
            rawStream: Array.from(this.#int16ToByteArray(audioDataBuffer)),
            sampleRate: this.#audioContext.sampleRate,
            sampleSize: 16,
            channel: 1,
            bigEndian: false,
            isFinal: false,
          };

          try {
            this.socket.send(JSON.stringify(audioDataObj));
            // console.log("Audio data sent as JSON");
            audioDataBuffer = [];
          } catch (e) {
            console.log(e);
          }
        } else {
          this.disconnectAudioNodes();
          this.stopMediaStream();
        }
      }
    }, 700);
  }

  #int16ToByteArray(int16Array) {
    const byteArray = new Uint8Array(int16Array.length * 2); // 16비트 -> 2바이트로 변환

    for (let i = 0; i < int16Array.length; i++) {
      byteArray[i * 2] = int16Array[i] & 0xff; // 하위 바이트
      byteArray[i * 2 + 1] = (int16Array[i] >> 8) & 0xff; // 상위 바이트
    }

    return byteArray;
  }

  sendFinalRawAudioByteStream() {
    const audioDataObj = {
      rawStream: Array.from(new Float32Array([]).buffer),
      sampleRate: this.#audioContext.sampleRate,
      sampleSize: 32,
      channel: 1,
      bigEndian: false,
      isFinal: true,
    };
    try {
      this.socket.send(JSON.stringify(audioDataObj));
      console.log("Final audio send as JSON");
    } catch (e) {
      console.log(e);
    }
  }
  disconnectAudioNodes() {
    if (this.#source != undefined) this.#source.disconnect();
    if (this.#workletNode != undefined) this.#workletNode.disconnect();
    if (
      this.#audioContext != undefined &&
      this.#audioContext.state == "running"
    )
      this.#audioContext.close().then(() => {});

    console.log(
      "All audio resources have been released and audio processing stopped."
    );
  }

  stopMediaStream() {
    if (this.#stream != undefined && this.#stream.active) {
      this.#stream.getTracks().forEach((track) => track.stop());
      console.log("stop media stream");
    }
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
    }
  }
}
