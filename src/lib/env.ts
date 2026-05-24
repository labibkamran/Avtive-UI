import { z } from "zod";

const envSchema = z.object({
  APP_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  EMAIL_FROM: z.string().email(),
  EMAIL_PASS: z.string().min(1),
  EMAIL_USER: z.string().min(1),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SESSION_SECRET: z.string().min(32),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .transform((value) => value === "true"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv() {
  if (!cachedEnv) {
    cachedEnv = envSchema.parse(process.env);
  }

  return cachedEnv;
}
