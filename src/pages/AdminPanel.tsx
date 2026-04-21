import { useState } from "react";
import { useLocation } from "react-router-dom";
import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminManage from "./AdminManage";

const AdminPanel = () => {
  const location = useLocation();
  const initial: "dashboard" | "gerenciar" =
    (location.state as { adminSection?: string } | null)?.adminSection === "gerenciar"
      ? "gerenciar"
      : "dashboard";
  const [activeSection, setActiveSection] = useState<"dashboard" | "gerenciar">(initial);

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === "dashboard" ? <AdminDashboard /> : <AdminManage />}
    </AdminLayout>
  );
};

export default AdminPanel;
