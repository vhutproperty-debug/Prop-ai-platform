"use server";

import { ZodError } from "zod";
import { actionError, actionSuccess } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth/cookies";
import { userService } from "@/services/user.service";
import { loginSchema, registerSchema } from "@/validations/auth";

export async function registerAction(input: unknown) {
  try {
    const data = registerSchema.parse(input);
    const user = await userService.register(data);
    await setAuthCookie({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });
    return actionSuccess({ id: String(user._id), email: user.email, role: user.role });
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(new ValidationError("Validation failed", error.flatten().fieldErrors));
    }
    return actionError(error);
  }
}

export async function loginAction(input: unknown) {
  try {
    const data = loginSchema.parse(input);
    const user = await userService.login(data);
    await setAuthCookie({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });
    return actionSuccess({ id: String(user._id), email: user.email, role: user.role });
  } catch (error) {
    if (error instanceof ZodError) {
      return actionError(new ValidationError("Validation failed", error.flatten().fieldErrors));
    }
    return actionError(error);
  }
}

export async function logoutAction() {
  await clearAuthCookie();
  return actionSuccess({ loggedOut: true });
}
