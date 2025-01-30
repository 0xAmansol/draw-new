import { JWT_SECRET } from "@workspace/backend-common/config";
import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { client } from "@workspace/db/client";

const wss = new WebSocketServer({ port: 8080 });

interface Users {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: Users[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !(decoded as JwtPayload).userId) {
      return null;
    }

    return decoded.userId;
  } catch (e) {
    return null;
  }
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) {
    return;
  }

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close();
    return;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async (message) => {
    let parsedData;
    try {
      parsedData = JSON.parse(message as unknown as string);
    } catch (e) {
      console.error("Invalid JSON received:", e);
      return;
    }

    if (parsedData.type == "join_room") {
      const user = users.find((x) => x.ws == ws);

      user?.rooms.push(parsedData.roomId);
      console.log("user joined room", parsedData.roomId);
    }

    if (parsedData.type == "leave_room") {
      const user = users.find((x) => x.ws == ws);
      if (!user) {
        return;
      }
      user.rooms = user?.rooms.filter((x) => x == parsedData.roomId);
    }

    if (parsedData.type == "chat") {
      const roomId = parsedData.roomId;
      console.log(roomId);
      const message = parsedData.message;
      await client.chat.create({
        data: {
          roomId: Number(roomId),
          message,
          userId,
        },
      });
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
