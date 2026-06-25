const axios = require("axios");

async function triggerN8nDeadline(data) {
  try {
    await axios.post(process.env.N8N_DEADLINE_WEBHOOK, data, { timeout: 10000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function triggerN8nNotice(data) {
  try {
    await axios.post(process.env.N8N_NOTICE_WEBHOOK, data, { timeout: 10000 });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { triggerN8nDeadline, triggerN8nNotice };
