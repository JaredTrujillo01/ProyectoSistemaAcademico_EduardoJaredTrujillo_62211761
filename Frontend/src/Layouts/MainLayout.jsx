import Sidebar from "../Components/Sidebar";
import Navbar from "../Components/Navbar";
import "../Styles/layout.css";

function MainLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default MainLayout;