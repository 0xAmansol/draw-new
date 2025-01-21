import { SignUpSchema, UserSchema } from "@workspace/backend-common/types";
import { client } from "@workspace/db/client";
import express from "express";
import { JWT_SECRET } from "@workspace/backend-common/config";
import jwt from "jsonwebtoken";
import { middleware } from "./middleware";

const app = express();
const port = 3000;

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

app.post("/room", middleware, (req: express.Request, res: express.Response) => {
  res.json({
    message: "room created",
  });
  return;
});

app.listen(port, (res) => {
  console.log(`server running on port ${port}`);
});
