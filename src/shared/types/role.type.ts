export const RoleType = {
  Admin: 'admin',
  Student: 'student',
  Teacher: 'teacher',
} as const;

export type RoleTypeType = (typeof RoleType)[keyof typeof RoleType];
