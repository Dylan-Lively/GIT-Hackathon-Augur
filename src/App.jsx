import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./NavBar";
import MainPage from "./MainPage";
import Setup from "./Setup";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/setup" element={<Setup />} />
      </Routes>
    </BrowserRouter>
  );
}