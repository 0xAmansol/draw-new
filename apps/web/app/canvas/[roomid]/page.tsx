"use client";

import Canvas from "@/components/Canvas";
import { AppleStyleDock } from "@/components/Dock";

import { client } from "@workspace/db/client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [selectedTool, setSelectedTool] = useState<string>("");
  const params = useParams();
  const [isValidated, setIsValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const roomId = params.roomid?.toString() ?? "";
  console.log(roomId);

  useEffect(() => {
    const res = async () => {
      try {
        const checkUser = await client.room.findUnique({
          where: {
            id: parseInt(roomId),
          },
        });
        setIsValidated(!!checkUser);
      } catch (error) {
        console.log("Error Validating room", error);
        setIsValidated(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      res();
    }
  }, [roomId]);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isValidated) {
    return <div>Room not found</div>;
  }

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
