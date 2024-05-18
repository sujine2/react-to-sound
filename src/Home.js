import "./Home.css";

function Home() {
  return (
    <div className="home">
      <div className="container main-des">
        <div className="main-des">
          <p className="p-1">안녕하세요.</p>
          <p className="p-2">저는 소리에 반응해요.</p>
          <p className="p-3">저에 대해 무엇이든 물어보세요.</p>
        </div>
      </div>

      <div class="container wave">
        <div class="wave label-1"></div>
        <div class="wave label-2"></div>
        <div class="wave label-3"></div>
      </div>
    </div>
  );
}

export default Home;
