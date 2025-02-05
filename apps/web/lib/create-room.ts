import { HTTP_URL } from "@workspace/backend-common/config";
import axios from "axios";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const handleRoomCreation = async (
  token: string,
  router: AppRouterInstance,
  roomId: string
) => {
  if (!token) {
    router.push("/");
    return;
  }
  try {
    const res = await axios.post(
      `${HTTP_URL}/room`,
      {
        name: `new-room-${roomId}`,
      },
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    router.push(`/canvas/${res.data.roomId}`);
  } catch (error) {
    console.error("Error creating room:", error);
  }
};
