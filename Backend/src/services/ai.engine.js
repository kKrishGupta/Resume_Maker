let currentIndex = 0;

const providerMap = {
  gemini: require("./providers/gemini").generateWithGemini,
  groq: require("./providers/groq").generateWithGroq
};

const providers = [];

if (process.env.GOOGLE_GENAI_API_KEY) providers.push("gemini");
if (process.env.GROQ_API_KEY) providers.push("groq");

// 🔥 provider health state
let providerState = {
  gemini: { blockedUntil: 0 },
  groq: { blockedUntil: 0 }
};

// 🔥 helper
function isAvailable(name) {
  return Date.now() >= (providerState[name]?.blockedUntil || 0);
}

// 🔥 detect quota error safely
function isQuotaError(err) {
  const msg = typeof err === "string"
    ? err
    : JSON.stringify(err);

  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("RESOURCE_EXHAUSTED")
  );
}

async function generateAI(prompt) {
  if (providers.length === 0) {
    throw new Error("No AI providers configured");
  }

  const total = providers.length;
  let tried = 0;

  while (tried < total) {
    const providerName = providers[currentIndex % total];
    const provider = providerMap[providerName];

    currentIndex++;

    // 🔥 skip if blocked
    if (!isAvailable(providerName)) {
      tried++;
      continue;
    }

    try {
      console.log(`⚡ Using: ${providerName}`);

      const result = await provider(prompt);

      if (result && typeof result === "string") {
        return result;
      }

    } catch (err) {
      const errorMsg = err.response?.data || err.message;

      console.log(`❌ ${providerName} failed:`, errorMsg);

      // 🔥 QUOTA → block longer
      if (isQuotaError(errorMsg)) {
        console.log(`⛔ ${providerName} blocked (quota)`);

        providerState[providerName].blockedUntil =
          Date.now() + 5 * 60 * 1000; // 5 min
      } else {
        // 🔥 temporary error → short block
        providerState[providerName].blockedUntil =
          Date.now() + 60 * 1000; // 1 min
      }

      tried++;
    }
  }

  // 🔥 ALL BLOCKED → WAIT FOR FIRST RECOVERY
  console.log("⚠️ All providers blocked, retrying after delay...");

  await new Promise(resolve => setTimeout(resolve, 2000));

  return generateAI(prompt); // 🔁 retry automatically
}

module.exports = { generateAI };