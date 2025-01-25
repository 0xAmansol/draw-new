"use client";

import Canvas from "@/components/Canvas";
import { AppleStyleDock } from "@/components/Dock";
import { useState } from "react";
import { useParams } from "next/navigation";

const Dashboard = () => {
  const { roomid } = useParams();
  const [selectedTool, setSelectedTool] = useState<string>("");
  return (
    <div>
      <AppleStyleDock
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
      />
      <Canvas
        selectedTool={selectedTool}
        params={{ roomId: roomid as string }}
      />
    </div>
  );
};

export default Dashboard;
