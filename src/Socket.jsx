export let socket;
export let workletNode;
export let audioContext;
export let stream;
export let source;

export function CloseSocket() {
  if (socket != undefined && socket.readyState === WebSocket.OPEN) {
    socket.close(); // 웹소켓 연결 끊기
    handleCloseEvent();
  }
}

export async function OpenSocket() {
  //Socket
  console.log(process.env.REACT_APP_SOCKET_API);
  socket = new WebSocket(process.env.REACT_APP_SOCKET_API);
  socket.onopen = () => console.log("WebSocket Connected");
  socket.onerror = (error) => console.error("socket Error:", error);
  socket.onclose = (event) => {
    console.log(event);
    handleCloseEvent();
    socket.close();
    console.log("WebSocket Closed");
  };
  socket.onmessage = function (event) {
    console.log("Message from server:", event.data);
  };

  if (socket.readyState == WebSocket.CONNECTING) {
    // Audio Worklet
    audioContext = new window.AudioContext();
    await audioContext.audioWorklet.addModule("processor.js");
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    source = audioContext.createMediaStreamSource(stream);
    workletNode = new AudioWorkletNode(audioContext, "audio-processor");
    console.log(stream, source, workletNode);

    let audioBuffers = [];
    let audioBuffer = [];
    let nextTimeToSend = Date.now() + 1000;
    workletNode.port.onmessage = (event) => {
      if (audioBuffer.length >= 256) {
        audioBuffers.push(audioBuffer);
        audioBuffer = [];
      }
      const inputData = event.data.audioData;
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
              sampleRate: audioContext.sampleRate,
              sampleSize: 32,
              channel: 1,
              bigEndian: false,
            };

            try {
              socket.send(JSON.stringify(audioDataObj));
              console.log("Audio data sent as JSON");
            } catch (e) {
              console.log(e);
            }
            nextTimeToSend = Date.now() + 1000;
          }
        }
        audioBuffers = [];
      }
    };
  }

  source.connect(workletNode);
  workletNode.connect(audioContext.destination);
}

function disconnectAudioNodes(source, workletNode, audioContext) {
  if (source != undefined) {
    source.disconnect();
    console.log("Source successfully closed.");
  }

  if (source != undefined) {
    workletNode.disconnect();
    console.log("WorkletNode successfully closed.");
  }
  if (source != undefined && audioContext.state == "running") {
    audioContext.close().then(() => {
      console.log("AudioContext successfully closed.");
    });
  }
  //   console.log("check", source, workletNode, audioContext);
}

function stopMediaStream(stream) {
  if (stream != undefined && stream.active) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

function handleCloseEvent() {
  disconnectAudioNodes(source, workletNode, audioContext);

  stopMediaStream(stream);

  console.log(
    "All audio resources have been released and audio processing stopped."
  );
}
