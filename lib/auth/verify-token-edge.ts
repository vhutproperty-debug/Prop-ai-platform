import { jwtVerify } from "jose";
import type { TokenPayload } from "@/lib/auth/jwt";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return new TextEncoder().encode(secret);
}

/** Edge-safe JWT verification for middleware. */
export async function verifyTokenEdge(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    algorithms: ["HS256"],
  });

  if (
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.role !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };
}
