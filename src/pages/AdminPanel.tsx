import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminManage from "./AdminManage";

const AdminPanel = () => {
  const [activeSection, setActiveSection] = useState<"dashboard" | "gerenciar">("dashboard");

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {activeSection === "dashboard" ? <AdminDashboard /> : <AdminManage />}
    </AdminLayout>
  );
};

export default AdminPanel;
