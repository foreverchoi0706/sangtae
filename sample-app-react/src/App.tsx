import "@/App.css";
import logo from "@/assets/react.svg";
import DemoPage from "@/pages/DemoPage";

const App = () => {
  return (
    <main>
      <header className="header">
        <div className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </div>
      </header>
      <DemoPage />
    </main>
  );
};

export default App;
