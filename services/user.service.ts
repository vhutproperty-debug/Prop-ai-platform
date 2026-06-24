import { withDatabase } from "@/lib/db/with-database";
import { AuthError, NotFoundError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { User } from "@/models/User";
import type { LoginInput, RegisterInput } from "@/validations/auth";

export const userService = {
  async register(input: RegisterInput) {
    const existing = await withDatabase(() => User.findOne({ email: input.email }));
    if (existing) throw new AuthError("Email already registered");

    const password = await hashPassword(input.password);
    return withDatabase(() =>
      User.create({
        ...input,
        password,
        role: input.role === "admin" ? "user" : input.role,
      })
    );
  },

  async login(input: LoginInput) {
    const user = await withDatabase(() =>
      User.findOne({ email: input.email }).select("+password")
    );

    if (!user) throw new AuthError("Invalid email or password");

    const isValid = await verifyPassword(input.password, user.password);
    if (!isValid) throw new AuthError("Invalid email or password");

    return user;
  },

  async getById(id: string) {
    const user = await withDatabase(() => User.findById(id).lean());
    if (!user) throw new NotFoundError("User");
    return user;
  },
};
