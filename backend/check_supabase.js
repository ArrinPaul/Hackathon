const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  console.log("Connecting to Supabase at:", url);
  try {
    const { data, error } = await supabase.from('whiteboards').select('*').limit(1);
    if (error) {
      console.log("Error querying whiteboards table:", error.message);
    } else {
      console.log("Success! Table exists. Rows found:", data.length);
    }
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

check();
