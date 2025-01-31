import { z } from "zod";

export const UserSchema = z.object({
  name: z.string().min(6).optional(),
  email: z.string(),
  password: z.string(),
});

export const RoomSchema = z.object({
  name: z.string(),
});

export const SignUpSchema = z.object({
  email: z.string(),
  password: z.string(),
  name: z.string().optional(),
});
