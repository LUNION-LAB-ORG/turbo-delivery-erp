import { z } from 'zod';

// Login
export const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
});
export type _loginSchema = z.infer<typeof loginSchema>;

// Change Password
export const changePasswordSchema = z.object({
    username: z.string(),
    oldPassword: z.string(),
    newPassword: z.string(),
    confirm_password: z.string(),
});
export type _changePasswordSchema = z.infer<typeof changePasswordSchema>;

// create User
export const createUserSchema = z.object({
    username: z.string(),
    name: z.string(),
    prenoms: z.string(),
    email: z.string(),
    role: z.string(),
});
export type _createUserSchema = z.infer<typeof createUserSchema>;
