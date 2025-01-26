"use client";

import { AppleStyleDock } from "@/components/Dock";
import MainCanvas from "@/components/MainCanvas";
import { useState } from "react";

const Dashboard = ({
  params,
}: {
  params: {
    roomId: string;
  };
}) => {
  const [selectedTool, setSelectedTool] = useState<string>("");
  const roomId = params.roomId;
  console.log(roomId);

  return (
    <div>
      <AppleStyleDock
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
      />
      <MainCanvas roomId={roomId} selectedTool={selectedTool} />
    </div>
  );
};

export default Dashboard;
