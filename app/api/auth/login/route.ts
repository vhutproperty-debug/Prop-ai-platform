import { apiError, apiSuccess } from "@/lib/api/response";
import { setAuthCookie } from "@/lib/auth/cookies";
import { userService } from "@/services/user.service";
import { loginSchema } from "@/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = loginSchema.parse(body);
    const user = await userService.login(input);

    await setAuthCookie({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    return apiSuccess({
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    return apiError(error);
  }
}
