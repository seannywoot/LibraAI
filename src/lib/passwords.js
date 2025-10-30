import bcrypt from "bcryptjs";

const ROUNDS = 12;

export async function hashPassword(plain) {
  if (!plain) throw new Error("Password required");
  const salt = await bcrypt.genSalt(ROUNDS);
  return bcrypt.hash(plain, salt);
}

export function comparePassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
