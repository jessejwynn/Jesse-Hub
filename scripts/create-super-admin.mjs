// Creates the first super admin (or promotes an existing user).
// Usage: npm run create-super-admin -- <email> <password> [name]
import { createClient } from "@supabase/supabase-js";

const [email, password, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ") || null;

if (!email || !password) {
  console.error("Usage: npm run create-super-admin -- <email> <password> [name]");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let userId;
const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { name },
});

if (error) {
  // Already exists: look it up and promote it.
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (!existing) {
    console.error(`Could not create user: ${error.message}`);
    process.exit(1);
  }
  userId = existing.id;
  console.log(`User ${email} already exists; promoting to super admin.`);
} else {
  userId = data.user.id;
  console.log(`Created ${email}.`);
}

const { error: flagError } = await admin
  .from("profiles")
  .update({ is_super_admin: true })
  .eq("id", userId);
if (flagError) {
  console.error(`Could not set super admin: ${flagError.message}`);
  process.exit(1);
}
console.log(`${email} is now a super admin.`);
