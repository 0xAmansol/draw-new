"use client";

import Canvas from "@/components/Canvas";
import { AppleStyleDock } from "@/components/Dock";

import { useParams } from "next/navigation";
import { useState } from "react";

const Dashboard = () => {
  const [selectedTool, setSelectedTool] = useState<string>("");

  const params = useParams();

  const roomId = params.roomid?.toString() ?? "";
  console.log(roomId);

  return (
    <div>
      <AppleStyleDock
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
      />
      <Canvas roomId={roomId} selectedTool={selectedTool} />
    </div>
  );
};

export default Dashboard;
