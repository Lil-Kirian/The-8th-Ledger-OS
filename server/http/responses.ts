import { NextResponse } from "next/server";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: string; detail?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  error: string,
  status = 400,
  detail?: string,
): NextResponse<ApiFailure> {
  return NextResponse.json({ success: false, error, detail }, { status });
}

export function unauthorized(message = "Authentication required") {
  return fail(message, 401);
}

export function forbidden(message = "Permission denied") {
  return fail(message, 403);
}
