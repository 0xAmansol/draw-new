import {
  RoomSchema,
  SignUpSchema,
  UserSchema,
} from "@workspace/backend-common/types";

import express from "express";
import { JWT_SECRET } from "@workspace/backend-common/config";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";
import { client } from "@workspace/db/client";
import cors from "cors";

const app = express();
const port = 3001;

app.use(cors());

app.use(express.json());

app.post("/signup", async (req, res) => {
  const parsedUser = SignUpSchema.safeParse(req.body);
  if (!parsedUser.success) {
    res.status(403).json({
      message: "Invalid Inputs",
    });
    return;
  }

  try {
    const user = await client.user.create({
      data: {
        email: parsedUser.data.email,
        password: parsedUser.data.password,
        name: parsedUser.data.name,
      },
    });
    res.json({
      message: "user created",
      userId: user.id,
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({
      message: "user already exists",
    });
  }
});

app.post("/signin", async (req, res) => {
  const parsedUser = UserSchema.safeParse(req.body);
  if (!parsedUser.success) {
    res.status(403).json({
      message: "invalid inputs",
    });
    return;
  }

  if (!parsedUser.data.email || !parsedUser.data.password) {
    res.status(403).json({
      message: "invalid inputs",
    });
  }

  try {
    const user = await client.user.findFirst({
      where: {
        email: parsedUser.data.email,
      },
    });

    if (!user) {
      res.status(403).json({
        message: "No such user exists",
      });
    }
    const userId = user?.id;
    const token = jwt.sign({ userId }, JWT_SECRET);
    res.json({
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(403).json({
      message: "Unable to signin",
    });
  }
});

app.post("/room", middleware, async (req, res) => {
  const parsedUser = RoomSchema.safeParse(req.body);
  if (!parsedUser.success) {
    res.json({
      message: "Invalid room name",
    });
    return;
  }

  const userId = req.userId;
  if (!userId) {
    res.status(403).json({
      message: "User not authenticated",
    });
    return;
  }

  try {
    const room = await client.room.create({
      data: {
        slug: parsedUser.data.name,
        adminId: userId,
      },
    });
    res.json({ roomId: room.id });
  } catch (error) {
    res.status(500).json({
      message: "Error creating room",
    });
  }
});

app.get("/chats/:id", async (req, res) => {
  const roomId = Number(req.params.id);
  const userId = req.headers.authorization;
  console.log(roomId);

  try {
    const messages = await client.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
    });
    res.json({
      messages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error fetching room",
    });
  }
});

app.listen(port, (res) => {
  console.log(`server running on port ${port}`);
});
