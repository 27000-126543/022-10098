import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CustomerVerify from "@/pages/CustomerVerify";
import ProjectSelect from "@/pages/ProjectSelect";
import RiskExplain from "@/pages/RiskExplain";
import ESign from "@/pages/ESign";
import Archive from "@/pages/Archive";
import ExceptionPage from "@/pages/Exception";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CustomerVerify />} />
        <Route path="/projects" element={<ProjectSelect />} />
        <Route path="/risk-explain" element={<RiskExplain />} />
        <Route path="/sign" element={<ESign />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/exception" element={<ExceptionPage />} />
      </Routes>
    </Router>
  );
}
