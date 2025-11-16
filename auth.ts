import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { getUserByEmail, createUser as dbCreateUser } from "./db";

const JWT_SECRET = ENV.jwtSecret;
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: number;
  email: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: number, email: string): string {
  const payload: JWTPayload = { userId, email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Register a new user
 */
export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<{ success: boolean; error?: string; token?: string }> {
  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return { success: false, error: "Email já cadastrado" };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await dbCreateUser({
      email,
      password: hashedPassword,
      name: name || null,
      loginMethod: "password",
    });

    // Generate token
    const token = generateToken(user.id, user.email);

    return { success: true, token };
  } catch (error) {
    console.error("[Auth] Registration error:", error);
    return { success: false, error: "Erro ao criar usuário" };
  }
}

/**
 * Login a user
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; token?: string; user?: any }> {
  try {
    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, error: "Email ou senha inválidos" };
    }

    // Check if user has a password (not OAuth user)
    if (!user.password) {
      return { success: false, error: "Usuário criado via OAuth. Use o login OAuth." };
    }

    // Verify password
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return { success: false, error: "Email ou senha inválidos" };
    }

    // Generate token
    const token = generateToken(user.id, user.email);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return { success: false, error: "Erro ao fazer login" };
  }
}
