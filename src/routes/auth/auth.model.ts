import z from 'zod';

export const UserSchema = z.object({
  id: z.number(),
  email: z.email(),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserType = z.infer<typeof UserSchema>;

export const RegisterBodySchema = UserSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).strict();

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;

export const LoginBodySchema = UserSchema.pick({
  email: true,
  password: true,
}).strict();

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

export const UserResponseSchema = UserSchema.omit({
  password: true,
});

export const LoginResSchema = z.object({
  user: UserResponseSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type LoginResType = z.infer<typeof LoginResSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
