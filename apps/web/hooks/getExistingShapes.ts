import axios from "axios";

export async function getExistingShapes(roomId: string) {
  const res = await axios.get(`{$HTTP_URL}/chats/${roomId}`);
  const messages = res.data.messages;
  const shapes = messages.map((x: { message: string }) => {
    const messagesData = JSON.parse(x.message);
    return messagesData.shape;
  });

  return shapes;
}
