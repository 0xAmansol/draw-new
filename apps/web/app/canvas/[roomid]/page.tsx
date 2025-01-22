"use client";

import Canvas from "@/components/Canvas";
import { AppleStyleDock } from "@/components/Dock";
import { useState } from "react";

const Dashboard = () => {
  const [selectedTool, setSelectedTool] = useState<string>("");
  return (
    <div>
      <AppleStyleDock
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
      />
      <Canvas selectedTool={selectedTool} />
    </div>
  );
};

export default Dashboard;
