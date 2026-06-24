import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, getErrorMessage, ValidationError } from "@/lib/errors";
import type { ApiResponse } from "@/types/api";

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: unknown): NextResponse<ApiResponse<never>> {
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        details: error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  console.error("[API Error]", error);
  return NextResponse.json(
    { success: false, error: getErrorMessage(error) },
    { status: 500 }
  );
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: Record<string, string[]> };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function actionError(
  error: unknown,
  details?: Record<string, string[]>
): ActionResult<never> {
  return {
    success: false,
    error: getErrorMessage(error),
    details,
  };
}
