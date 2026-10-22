import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "art-studio-secure-key-2026-development-token";

export interface TokenPayload {
  userId: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  name: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(req: NextRequest): Promise<TokenPayload | null> {
  // Check authorization header first
  const authHeader = req.headers.get("authorization");
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // Fallback to cookie
  if (!token) {
    token = req.cookies.get("token")?.value;
  }

  if (!token) return null;

  return verifyToken(token);
}

export type AuthResult =
  | { user: TokenPayload; response?: undefined }
  | { user?: undefined; response: NextResponse };

/**
 * Ensures the request is authenticated.
 * Returns 401 if unauthenticated.
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return {
      response: NextResponse.json(
        { error: "Authentication required. Please log in to continue." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Ensures the request is authenticated AND has one of the allowed roles.
 * Returns 401 if unauthenticated, 403 if role is disallowed.
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: ("CUSTOMER" | "ADMIN")[]
): Promise<AuthResult> {
  const auth = await requireAuth(req);
  if (auth.response) return auth;

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      response: NextResponse.json(
        { error: `Forbidden: This action requires role [${allowedRoles.join(" or ")}].` },
        { status: 403 }
      ),
    };
  }

  return auth;
}
