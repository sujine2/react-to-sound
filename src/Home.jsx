import "./Home.css";
import { useEffect, useState, useRef } from "react";
import { AudioController } from "./AudioController.js";

function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [restore, setRestore] = useState(false);
  const [isSocketClosed, setIsSocketClosed] = useState(false);
  const [bubbleColors, setBubbleColors] = useState([]);
  const socketRef = useRef(null);
  const audioControllerRef = useRef(null);

  useEffect(() => {
    if (isSocketClosed || !socketRef.current) {
      socketRef.current = new WebSocket(process.env.REACT_APP_SOCKET_API);

      socketRef.current.onopen = () => console.log("WebSocket Connected");
      socketRef.current.onerror = (error) =>
        console.error("socket Error:", error);
      socketRef.current.onclose = (event) => {
        console.log(event);
        setIsSocketClosed(true);
        console.log("WebSocket Closed");
      };
      socketRef.current.onmessage = function (event) {
        try {
          const data = JSON.parse(event.data)[0];
          if (data.red !== 255 && data.green !== 255 && data.blue !== 255) {
            const color = `rgb(${data.red}, ${data.green}, ${data.blue})`;
            setBubbleColors((prev) => [...prev, color]);
          }
        } catch (e) {
          console.log(event.data);
        }
      };
      audioControllerRef.current = new AudioController(socketRef.current);
    }
  }, []);

  useEffect(() => {
    document
      .querySelector(".mic-img")
      .addEventListener("mouseover", function () {
        document.querySelectorAll(".item").forEach(function (item) {
          item.style.opacity = "1";
        });
      });

    document
      .querySelector(".mic-img")
      .addEventListener("mouseout", function () {
        document.querySelectorAll(".item").forEach(function (item) {
          item.style.opacity = "0";
        });
      });
  }, []);

  useEffect(() => {
    document.querySelectorAll("[data-lit-hue]").forEach((target) => {
      const rect = target.getBoundingClientRect();
      const hue = Number(target.getAttribute("data-lit-hue"));
      const count = Number(target.getAttribute("data-lit-count") || 50);

      if (bubbleColors.length > count && isRecording) {
        console.log(bubbleColors);
        bubbleColors.forEach((bubbleColor, index) => {
          if (index < count) {
            const x = randRange(0, rect.width);
            const y = randRange(0, rect.height);
            createBubble(x, y, rect, hue, target, bubbleColor);
          }
        });
        setBubbleColors((prevColors) => prevColors.slice(100));
      }
    });
  }, [bubbleColors]);

  const clip = (v, min, max = Infinity) => {
    if (v < min) return min;
    else if (v > max) return max;
    else return v;
  };

  // generated random value from given range
  const randRange = (min, max) => Math.random() * max + min;

  // create bubble on x and y position inside target with given hue theme
  function createBubble(x, y, rect, hue, target, bubleColor) {
    // variables
    const size = randRange(5, rect.width / 5);

    const animDuration = randRange(clip(size ** 2 / 1000, 1), 6);
    const zIndex = Math.random() < 0.1 ? 2 : -1;
    // apply to DOM
    const circle = document.createElement("span");
    circle.className = "lit";
    circle.style.left = x + "px";
    circle.style.top = y + "px";
    circle.style.width = size + "px";
    circle.style.height = size + "px";
    circle.style.background = bubleColor;
    circle.style.zIndex = zIndex;
    circle.style.animationDuration = animDuration + "s";

    circle.addEventListener("animationend", () => {
      circle.remove(); // 애니메이션 완료 후 span 요소 제거
    });

    target.appendChild(circle);
  }

  const updateRecordingState = async () => {
    if (isRecording) {
      audioControllerRef.current.disconnectAudioNodes();
      audioControllerRef.current.stopMediaStream();
      setIsRecording(false);
      setRestore(true);
      clearBubble();
      document.querySelector(".recording").style.display = "none";
      document.querySelector(".main-des").style.display = "block";
      document.querySelector(".lit-container").style.display = "none";
    } else {
      console.log(socketRef.current.readyState);

      if (socketRef.current) {
        if (
          socketRef.current.readyState == WebSocket.CONNECTING ||
          socketRef.current.readyState == WebSocket.OPEN
        ) {
          console.log("start", bubbleColors);
          setIsRecording(true);
          setRestore(false);
          document.querySelector(".recording").style.display = "flex";
          document.querySelector(".main-des").style.display = "none";
          document.querySelector(".lit-container").style.display = "block";

          await audioControllerRef.current.initialize();
          audioControllerRef.current.sendRawAudioStream();
        }
      }
    }
  };

  const clearBubble = () => {
    document.querySelectorAll(".lit").forEach((element) => element.remove());
    setBubbleColors([]);
  };

  const getClassName = () => {
    if (restore) return "container wave wave-down";
    if (isRecording) return "container wave wave-up";
    return "container wave";
  };

  return (
    <div className="home">
      <div className={getClassName()}>
        <div className="wave label-1"></div>
        <div className="wave label-2"></div>
        <div className="wave label-3"></div>
      </div>
      <div className="container main-con">
        <div className="main-des">
          <p className="p-1">안녕하세요.</p>
          <p className="p-2">저는 개발자 지니에요.</p>
          <p className="p-3">저는 소리에 반응해요.</p>
          <p className="p-4">저에 대해 무엇이든 물어보세요.</p>
        </div>
        <div data-lit-hue="20" data-lit-count="100" class="lit-container">
          <div class="minimal element">
            <p>음성 색상을 확인해보세요.</p>
          </div>
        </div>
      </div>

      <div></div>
      <div className="recording">
        <div className="obj"></div>
        <div className="obj"></div>
        <div className="obj"></div>
        <div className="obj"></div>
        <div className="obj"></div>
        <div className="obj"></div>
        <div className="obj"></div>
        <div className="obj"></div>
      </div>
      <div className="container nav-bar">
        <div className="center">
          <svg
            className="mic-img"
            viewBox="3 1.5 13 13"
            onClick={updateRecordingState}
            fill={isRecording ? "rgb(96, 189, 239)" : "rgb(149, 207, 239)"}
          >
            <path
              className="mic-img-path"
              d="M 3 8 A 1 1 0 0 0 3 8 A 1 1 0 0 0 16 8 A 1 1 0 0 0 3 8 V 8 M 3 8 M 3 8 M 3 8 V 8 L 6 8 V 9 C 6 10 5 10 5 9 V 8 V 7 C 5 6 6 6 6 7 V 8 Z L 7 8 C 7 7.3333 7 6.6667 7 6 C 7 5 8 5 8 6 V 10 C 8 11 7 11 7 10 V 8 L 9 8 V 5 C 9 4 10 4 10 5 C 10 7 10 9 10 11 C 10 12 9 12 9 11 V 8 L 11 8 V 6 C 11 5 12 5 12 6 V 8 V 10 C 12 11 11 11 11 10 V 8 L 13 8 V 7 C 13 6 14 6 14 7 V 9 C 14 10 13 10 13 9 V 8"
            />
          </svg>
        </div>
        <div className="center item-con">
          {/* TODO: get ramdom question from api */}
          <div className="item">내 목소리 색을 보여줘</div>
          <div className="item">너는 누구니?</div>
        </div>
      </div>
    </div>
  );
}

export default Home;
