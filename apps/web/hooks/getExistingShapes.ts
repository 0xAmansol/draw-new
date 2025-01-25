import { HTTP_URL } from "@workspace/backend-common/config";
import axios from "axios";
import { client } from "@workspace/db/client";
import { Element } from "@/components/Canvas";

export async function getExistingShapes({
  params,
}: {
  params: {
    roomId: string;
  };
}) {
  const roomId = params.roomId;
  try {
    const res = await axios.get(`${HTTP_URL}/room/${roomId}`);

    const messages = res.data.messages;
    const shapes = messages.map((message: string) => {
      return JSON.parse(message);
    });
    return shapes;
  } catch (error) {
    console.log(error);
    return [];
  }
}

export async function pushExistingShape({
  roomId,
  message,
}: {
  roomId: number;
  message: Element;
}) {
  if (!roomId) {
    return;
  }
  const addShape = await client.room.update({
    where: {
      id: roomId,
    },
    data: {
      chats: {
        message: JSON.stringify(message),
      },
    },
  });
  return addShape;
}
