import { JWT_SECRET } from "@workspace/backend-common/config";
import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

const wss = new WebSocketServer({ port: 8080 });

type Users = {
  userId: string;
  rooms: string[];
  ws: WebSocket;
};

const users: Users[] = [];

function checkUser(token: string): string | null {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || typeof decoded == "string") {
      return null;
    }
    return decoded.userId;
  } catch (error) {
    console.error(error);
    return null;
  }
}

wss.on("connection", (ws, request) => {
  console.log("connection on wss is made");

  const url = request.url;
  const queryParam = new URLSearchParams(url?.split("?")[1]);
  const token = queryParam.get("token");

  const userId = checkUser(token as string);
  if (userId == null) {
    ws.close();
    return;
  }

  ws.on("messsage", (message) => {
    const parsedData = JSON.parse(message as string);
    if (!parsedData) {
      console.log("Invalid message");
      return;
    }

    if (parsedData.type == "join_room") {
      const roomId = parsedData.roomId;
      const user = users.find((x) => x.userId == userId);
      user?.rooms.push(roomId);
    }

    if (parsedData.type == "leave_room") {
      const roomId = parsedData.roomId;
      const user = users.find((x) => x.userId == userId);
      if (!user) {
        return;
      }

      user.rooms = user.rooms.filter((x) => x !== roomId);
    }

    if (parsedData.type == "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;
      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            })
          );
        }
      });
    }
  });
});
