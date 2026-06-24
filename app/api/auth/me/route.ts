import { apiError, apiSuccess } from "@/lib/api/response";
import { getSession } from "@/lib/auth/session";
import { userService } from "@/services/user.service";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiSuccess(null);
    }

    const user = await userService.getById(session.userId);
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
