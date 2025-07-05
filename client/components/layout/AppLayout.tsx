import { ReactNode, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface AppLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function AppLayout({
  children,
  showSidebar = true,
}: AppLayoutProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex flex-1">
        {showSidebar && <Sidebar className="hidden md:flex" />}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
