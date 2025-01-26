import React, { useState } from "react";
import Canvas from "./Canvas";
import { WS_BACKEND_URL } from "@workspace/backend-common/config";

const MainCanvas = ({
  roomId,
  selectedTool,
}: {
  roomId: string;
  selectedTool: string;
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const ws = new WebSocket(
    `${WS_BACKEND_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTZkbzIzNHQwMDAwaWw3Y3V0NHE5MWFxIiwiaWF0IjoxNzM3ODk4Nzg3fQ.3CG8hIQoCNECL075a2EV-2GZ1gszb9UDHE0lZqnHjIQ`
  );
  ws.onopen = () => {
    setSocket(ws);
    const data = JSON.stringify({
      type: "join_room",
      roomId,
    });
    ws.send(data);
  };
  if (!socket) {
    return <div>Loading...</div>;
  }

  return <Canvas roomId={roomId} selectedTool={selectedTool} socket={socket} />;
};

export default MainCanvas;
