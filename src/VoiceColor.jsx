import "./Home.css";
import { STATE } from "./const.js";
import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { AudioController } from "./AudioController.js";

function VoiceColor(props, ref) {
  const [isSocketClosed, setIsSocketClosed] = useState(false);
  const [bubbleColors, setBubbleColors] = useState([]);
  const socketRef = useRef(null);
  const audioControllerRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      if (props.isRecording == STATE.END) {
        audioControllerRef.current.disconnectAudioNodes();
        audioControllerRef.current.stopMediaStream();
        clearBubble();
      } else if (props.isRecording == STATE.START) {
        document.querySelector(".lit-container").style.display = "block";
        await audioControllerRef.current.initialize();
        audioControllerRef.current.sendRawAudioStream();
      }
    }
    fetchData();
  }, [props.isRecording]); // isRecording이 변경될 때마다 실행

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
    document.querySelectorAll("[data-lit-hue]").forEach((target) => {
      const rect = target.getBoundingClientRect();
      const hue = Number(target.getAttribute("data-lit-hue"));
      const count = Number(target.getAttribute("data-lit-count") || 50);

      if (bubbleColors.length > count && props.isRecording) {
        // console.log(bubbleColors);
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
  const createBubble = (x, y, rect, hue, target, bubleColor) => {
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
  };

  const clearBubble = () => {
    document.querySelectorAll(".lit").forEach((element) => element.remove());
    setBubbleColors([]);
  };

  useImperativeHandle(ref, () => ({
    getSocketReadyState: () => {
      return socketRef.current ? socketRef.current.readyState : null;
    },
  }));

  return (
    <>
      {props.isRecording === STATE.START ? (
        <div data-lit-hue="20" data-lit-count="100" className="lit-container">
          <div className="minimal element">
            <p>음성 색상을 확인해보세요.</p>
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
}

export default forwardRef(VoiceColor);
