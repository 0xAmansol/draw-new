import axios from "axios";
import { HTTP_URL } from "@workspace/backend-common/config";

export const checkRoom = async (roomId: number): Promise<boolean> => {
  const res = await axios.get(`${HTTP_URL}/chats/${roomId}`);
  const data = res.data.message;
  if (data == "No room found") {
    return false;
  }
  return true;
};
