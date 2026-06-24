import { apiError, apiSuccess } from "@/lib/api/response";
import { setAuthCookie } from "@/lib/auth/cookies";
import { userService } from "@/services/user.service";
import { registerSchema } from "@/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = registerSchema.parse(body);
    const user = await userService.register(input);

    await setAuthCookie({
      userId: String(user._id),
      email: user.email,
      role: user.role,
    });

    return apiSuccess(
      {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}
