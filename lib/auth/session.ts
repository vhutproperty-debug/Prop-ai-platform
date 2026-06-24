import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/config/constants";
import { AuthError } from "@/lib/errors";
import { verifyToken, type TokenPayload } from "@/lib/auth/jwt";
import type { UserRole } from "@/config/constants";

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<TokenPayload> {
  const session = await getSession();
  if (!session) throw new AuthError("Authentication required");
  return session;
}

export async function requireRole(...roles: UserRole[]): Promise<TokenPayload> {
  const session = await requireAuth();
  if (!roles.includes(session.role as UserRole)) {
    throw new AuthError("Insufficient permissions");
  }
  return session;
}
