import axios from "axios";
import { HTTP_URL } from "@workspace/backend-common/config";
import { Element } from "@/components/Canvas";

export async function getExistingElements(roomId: string): Promise<Element[]> {
  try {
    const res = await axios.get(`${HTTP_URL}/chats/${roomId}`);

    const messages = res.data.messages;

    const shapes = messages.map((x: { message: string }) => {
      const messageData = JSON.parse(x.message);
      return messageData;
    });
    return shapes;
  } catch (error) {
    return [];
  }
}
