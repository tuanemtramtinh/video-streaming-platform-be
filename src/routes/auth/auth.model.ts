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
