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
  const [request, setRequest] = useState(""); // result 상태 초기화
  const [response, setResponse] = useState("");
  const socketRef = useRef(null);
  const audioControllerRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      if (props.isRecording == STATE.END) {
        audioControllerRef.current.sendFinalRawAudioByteStream();
        audioControllerRef.current.disconnectAudioNodes();
        audioControllerRef.current.stopMediaStream();
        setRequest("");
        setResponse("");
      } else if (props.isRecording == STATE.START) {
        document.querySelector(".chat-container").style.display = "block";
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
          const data = JSON.parse(event.data);

          const result = data.result;
          const isResponse = data.response;

          if (isResponse) setResponse(result);
          else setRequest(result);
        } catch (e) {
          console.log(e);
          console.log(event.data);
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
        <div className="chat-container">
          <div className="chat-nav"></div>
          <div className="chat-message-container">
            {request !== "" ? (
              <div className="chat-req-message">{request}</div>
            ) : (
              <></>
            )}
            {response !== "" ? (
              <div className="chat-res-message">{response}</div>
            ) : (
              <></>
            )}
          </div>
          <div className="chat-enter"></div>
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
}

export default forwardRef(SpeechToText);
