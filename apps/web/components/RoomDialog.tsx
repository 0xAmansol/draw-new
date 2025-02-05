"use-client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HTTP_URL } from "@workspace/backend-common/config";
import axios from "axios";
import { handleRoomCreation } from "@/lib/create-room";
import { toast } from "@workspace/ui/hooks/use-toast";

function RoomDialog() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const res = localStorage.getItem("token");
    console.log(token);
    setToken(res || "");
    if (!res) {
      router.push("/");
      toast({
        title: "User not Signedin",
      });
      setIsAuthenticated(false);
      return;
    }
  }, [router]);

  const joinRoom = () => {
    if (roomId) {
      router.push(`/canvas/${roomId}`);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create or Join Room</Button>
      </DialogTrigger>
      <DialogContent>
        <div className="mb-2 flex flex-col items-center gap-2">
          <DialogHeader>
            <DialogTitle className="sm:text-center">
              Welcome to Collaborative Canvas
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => handleRoomCreation(token, router, roomId)}
            className="w-full"
          >
            Create New Room
          </Button>

          <div className="relative">
            <Input
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="w-full"
            />
            <Button onClick={joinRoom} className="w-full mt-2">
              Join Room
            </Button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By using this service you agree to our{" "}
          <a className="underline hover:no-underline" href="#">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="underline hover:no-underline" href="#">
            Privacy Policy
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}

export { RoomDialog };
