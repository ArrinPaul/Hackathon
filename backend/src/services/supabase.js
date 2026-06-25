const { createClient } = require("@supabase/supabase-js");

let supabase = null;

function getClient() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || url === "placeholder" || !key || key === "placeholder") {
      throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
    }
    supabase = createClient(url, key);
  }
  return supabase;
}

module.exports = { getClient };
