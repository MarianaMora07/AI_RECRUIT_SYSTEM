import { z } from "zod";
import { USER_ROLES } from "@/lib/constants/roles";

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export const registerSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Incluye al menos una mayúscula")
    .regex(/[0-9]/, "Incluye al menos un número"),
  fullName: z.string().min(2, "Nombre requerido").max(100),
  role: z.enum(USER_ROLES).default("recruiter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
