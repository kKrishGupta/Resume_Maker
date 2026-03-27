let currentIndex = 0;

const providerMap = {
  gemini: require("./providers/gemini").generateWithGemini,
  groq: require("./providers/groq").generateWithGroq
};

const providers = [];

if (process.env.GOOGLE_GENAI_API_KEY) providers.push("gemini");
if (process.env.GROQ_API_KEY) providers.push("groq");


// 🔥 COOLDOWN SYSTEM (NOT DEAD)
let cooldown = {}; // { gemini: timestamp }


// ===============================
// 🔥 MAIN ENGINE
// ===============================
async function generateAI(prompt) {
  const total = providers.length;

  if (total === 0) {
    throw new Error("No AI providers configured");
  }

  let attempts = 0;

  while (attempts < total) {
    const providerName = providers[currentIndex % total];
    const provider = providerMap[providerName];

    // 🔥 CHECK COOLDOWN
    if (cooldown[providerName] && Date.now() < cooldown[providerName]) {
      currentIndex++;
      attempts++;
      continue;
    }

    try {
      console.log(`⚡ Using: ${providerName}`);

      const result = await provider(prompt);

      if (result) {
        // 🔥 MOVE TO NEXT PROVIDER (LOAD BALANCE)
        currentIndex = (currentIndex + 1) % total;

        // console.log(`✅ Success: ${providerName}`);
        return result;
      }

    } catch (err) {
      console.log(`❌ ${providerName} failed:`, err.message);

      // 🔥 ADD COOLDOWN (1 MINUTE)
      cooldown[providerName] = Date.now() + 60 * 1000;

      currentIndex++;
      attempts++;
    }
  }

  // 🔥 FINAL SAFETY (NEVER CRASH FRONTEND)
  console.log("⚠️ All providers failed → fallback");

  return JSON.stringify({
    question: "Explain core concepts related to this topic."
  });
}

module.exports = { generateAI };