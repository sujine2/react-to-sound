import "./Home.css";
import { useEffect, useState } from "react";

function Home() {
  const [isRecording, setIsRecording] = useState(false);
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
    console.log("Component has mounted");
  }, []);

  const updateRecordingState = () => {
    if (isRecording) setIsRecording(false);
    else setIsRecording(true);
  };

  return (
    <div className="home">
      <div class="container wave">
        <div class="wave label-1"></div>
        <div class="wave label-2"></div>
        <div class="wave label-3"></div>
      </div>
      <div className="container main-des">
        <div className="main-des">
          <p className="p-1">안녕하세요.</p>
          <p className="p-2">저는 개발자 지니에요.</p>
          <p className="p-3">저는 소리에 반응해요.</p>
          <p className="p-4">저에 대해 무엇이든 물어보세요.</p>
        </div>
      </div>
      <div></div>
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
          {/* <div className="item"></div>
          <div className="item"></div> */}
        </div>
      </div>
    </div>
  );
}

export default Home;
