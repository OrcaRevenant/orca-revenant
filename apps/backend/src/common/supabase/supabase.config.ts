import { registerAs } from "@nestjs/config";

export default registerAs("supabase", () => ({
  url: process.env.SUPABASE_URL,
  roleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  secret: process.env.SUPABASE_SERVICE_SECRET,
}));
