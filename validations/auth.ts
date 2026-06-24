import { z } from "zod";
import { USER_ROLES } from "@/config/constants";
import { emailSchema, phoneSchema } from "@/validations/common";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: emailSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  phone: phoneSchema.optional(),
  role: z.enum(USER_ROLES).default("user"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
