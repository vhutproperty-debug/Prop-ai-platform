import jwt from "jsonwebtoken";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }
  return secret;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d", algorithm: "HS256" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as TokenPayload;
}
