import { cookies } from "next/headers";
import { AUTH_COOKIE, AUTH_COOKIE_MAX_AGE } from "@/config/constants";
import { signToken, type TokenPayload } from "@/lib/auth/jwt";

export async function setAuthCookie(payload: TokenPayload): Promise<void> {
  const cookieStore = await cookies();
  const token = signToken(payload);

  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
