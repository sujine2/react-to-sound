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
import axios from "axios";

const getCookie = (name) => {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
};

const checkAndInitializeToken = () => {
  const jwt = getCookie("jwt"); // 쿠키에서 jwt 값 가져오기

  if (!jwt) {
    console.log("쿠키 없음. /token/initialize 호출...");
    axios
      .get("http://localhost:8080/token/initialize", {
        withCredentials: true, // 쿠키 포함 설정
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        if (error.response && error.response.data === "Already exist JWT") {
          console.warn("⚠️ Already exist JWT");
          return;
        } else console.error("토큰 초기화 실패:", error);
      });
  } else {
    console.log("cookie", jwt);
  }
};

function SpeechToText(props, ref) {
  const [chatHistory, setChatHistory] = useState([]);
  const [isSocketClosed, setIsSocketClosed] = useState(false);
  const [request, setRequest] = useState("");
  const [pendingRequest, setPendingRequest] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);
  const audioControllerRef = useRef(null);

  const scrollToBottom = () => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  };

  const fetchMessages = () => {
    checkAndInitializeToken();
    console.log("fetch history");
    axios
      .get(process.env.REACT_APP_HISTORY_URL, { withCredentials: true })
      .then((response) => {
        console.log(response.data);
        setChatHistory(response.data);
      })
      .catch((error) => {
        console.error("API 호출 오류:", error);
      });
  };

  const sendRequest = () => {
    //setRequest(pendingRequest);
    setIsFinal(false);
    console.log("current request", pendingRequest);
    const newMessage = {
      id: chatHistory.length + 1,
      question: pendingRequest,
      answer: "...",
    };
    setPendingRequest("");
    setChatHistory([...chatHistory, newMessage]);
    axios
      .post(
        "http://localhost:8080/ask",
        { question: pendingRequest },
        { withCredentials: true }
      )
      .then((response) => {
        console.log("answer:", response.data);
        fetchMessages();
      })
      .catch((error) => {
        console.error("API 호출 오류:", error);
      });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    async function fetchData() {
      if (props.isRecording == STATE.END) {
        audioControllerRef.current.sendFinalRawAudioByteStream();
        audioControllerRef.current.disconnectAudioNodes();
        audioControllerRef.current.stopMediaStream();
        setRequest("");
        setPendingRequest("");
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
      fetchMessages();
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
          const isFinal = data.final;
          console.log(data);
          console.log("is Final", isFinal);
          if (isFinal) {
            setIsFinal(true);
            setRequest(pendingRequest);
          } else setPendingRequest(result);
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
          <div className="chat-message-container" ref={chatContainerRef}>
            {chatHistory.map((msg, index) => (
              <>
                <div className="chat-req-message">{msg.question}</div>
                <div className="chat-res-message">💡 {msg.answer}</div>
              </>
            ))}
            <div />
          </div>
          <div className="chat-enter">
            <svg
              className="chat-enter-mic-img"
              viewBox="3 1.5 13 13"
              onClick={props.controlRecordingVoice}
              fill={
                props.isRecording == STATE.START
                  ? "rgb(96, 189, 239)"
                  : "rgb(149, 207, 239)"
              }
            >
              <path
                className="mic-img-path"
                d="M 3 8 A 1 1 0 0 0 3 8 A 1 1 0 0 0 16 8 A 1 1 0 0 0 3 8 V 8 M 3 8 M 3 8 M 3 8 V 8 L 6 8 V 9 C 6 10 5 10 5 9 V 8 V 7 C 5 6 6 6 6 7 V 8 Z L 7 8 C 7 7.3333 7 6.6667 7 6 C 7 5 8 5 8 6 V 10 C 8 11 7 11 7 10 V 8 L 9 8 V 5 C 9 4 10 4 10 5 C 10 7 10 9 10 11 C 10 12 9 12 9 11 V 8 L 11 8 V 6 C 11 5 12 5 12 6 V 8 V 10 C 12 11 11 11 11 10 V 8 L 13 8 V 7 C 13 6 14 6 14 7 V 9 C 14 10 13 10 13 9 V 8"
              />
            </svg>
            {pendingRequest !== "" ? <div>{pendingRequest}</div> : <></>}
            <svg
              className="chat-enter-send"
              viewBox="3 1.5 13 13"
              onClick={() => {
                if (isFinal) {
                  setRequest(pendingRequest);
                  sendRequest();
                }
              }}
              fill={isFinal ? "rgb(54, 188, 255)" : "rgb(186, 213, 227)"}
            >
              <path
                className="send-path"
                d="M 3 8 A 1 1 0 0 0 3 8 A 1 1 0 0 0 16 8 A 1 1 0 0 0 3 8 V 8 M 3 8 M 3 8 M 3 8 V 8 L 6 8 V 8 V 8 Z L 7 8 L 9 8 V 5 L 6 7 C 6 7 6 6 6 6 L 8 4 C 9 3 10 3 11 4 L 13 6 L 13 7 L 13 7 L 10 5 L 10 12 C 10 13 9 13 9 12 V 8"
              />
            </svg>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
}

export default forwardRef(SpeechToText);
