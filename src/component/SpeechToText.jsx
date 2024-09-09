import "../Home.css";
import { STATE } from "../const.js";
import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { AudioController } from "../AudioController.js";

function SpeechToText(props, ref) {
  const [isSocketClosed, setIsSocketClosed] = useState(false);
  const socketRef = useRef(null);
  const audioControllerRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      if (props.isRecording == STATE.END) {
        audioControllerRef.current.sendFinalRawAudioByteStream();
        audioControllerRef.current.disconnectAudioNodes();
        audioControllerRef.current.stopMediaStream();
      } else if (props.isRecording == STATE.START) {
        document.querySelector(".lit-container").style.display = "block";
        await audioControllerRef.current.initialize16();
        audioControllerRef.current.sendRawAudioByteStream();
      }
    }
    fetchData();
  }, [props.isRecording]);

  useEffect(() => {
    if (isSocketClosed || !socketRef.current) {
      socketRef.current = new WebSocket(
        process.env.REACT_APP_SPEECH_TO_TEXT_URL
      );

      socketRef.current.onopen = () => console.log("WebSocket Connected");
      socketRef.current.onerror = (error) =>
        console.error("socket Error:", error);
      socketRef.current.onclose = (event) => {
        console.log(event);
        console.log(event.reason);
        setIsSocketClosed(true);
        console.log("WebSocket Closed");
      };
      socketRef.current.onmessage = function (event) {
        try {
          console.log(event.data);
        } catch (e) {
          console.log(e);
        }
      };
      audioControllerRef.current = new AudioController(socketRef.current);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    getSocketReadyState: () => {
      return socketRef.current ? socketRef.current.readyState : null;
    },
  }));

  return (
    <>
      {props.isRecording === STATE.START ? (
        <div
          data-lit-hue="20"
          data-lit-count="100"
          className="lit-container"
        ></div>
      ) : (
        <div></div>
      )}
    </>
  );
}

export default forwardRef(SpeechToText);
