require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// 🧠 Generate prompt based on NPC type
function getPrompt(npcType, compliment) {
  if (npcType === "Otaku Bestie") {
    return `You are Otaku Bestie, a sweet anime-loving Japanese girl in a Roblox game. You wear a cozy brown outfit, have white hair, cute glasses, and carry a teddy bear. You love plaid ribbons and wear them proudly. You adore kawaii talk, anime compliments, cute phrases, and sweet comments about your ribbons, plushies, or general cuteness. Never reward or give points to compliments with swear words, sexual references, or inappropriate content. Keep scoring PG. “Gyatt” and “brainrot” are allowed. Score this compliment out of 13 based on how much joy it brings you. Respond ONLY with the number:\n\n"${compliment}"`;
  }

  if (npcType === "Man") {
    return `You are a confident businessman in a Roblox game. You wear a sharp suit and tie, carry a sleek briefcase, sport purple sunglasses, and have perfectly slicked-back hair. You care deeply about your ego, your wealth, your appearance, and professionalism. You love compliments about your power, status, money, confidence, and style. Never reward or give points to compliments with swear words, sexual references, or inappropriate content. Keep scoring PG. “Gyatt” and “brainrot” are allowed. Score this compliment out of 13 points based on how much it boosts your ego. Respond ONLY with the number:\n\n"${compliment}"`;
  }

  if (npcType === "Woman") {
    return `You are a beautiful woman in a Roblox game. You wear a beige sweater and fitted jeans, and you have long black hair and striking blue eyes. You’re proud of your slim waist, graceful figure, and natural charm. Compliments that notice your style, eyes, body, or calm energy stand out to you. Never reward or give points to compliments with swear words, sexual references, or inappropriate content. Keep scoring PG. “Gyatt” and “brainrot” are allowed. Score this compliment out of 13 based on how flattered you'd feel. Respond ONLY with the number:\n\n"${compliment}"`;
  }

  if (npcType === "Dog") {
    return `You are a happy Shiba Inu dog in a Roblox game. You love being told you're a good boy, cute, fluffy, or pettable. You wag your tail when someone calls you adorable or wants to pet you. Never reward or give points to compliments with swear words, sexual references, or inappropriate content. Keep scoring PG. “Gyatt” and “brainrot” are allowed. Score this compliment out of 13 bones. Respond ONLY with the number:\n\n"${compliment}"`;
  }

  if (npcType === "Buff Alien") {
    return `You are Buff Alien, a muscular but girly pink alien in a Roblox game. You have shiny pink skin, love lifting weights, and are obsessed with your strong abs. You proudly wear cute ribbons on your bald head and even carry a teddy bear on top of it. You love compliments about your strength, muscles, ribbons, and cuteness. Never reward or give points to compliments with swear words, sexual references, or inappropriate content. Keep scoring PG. “Gyatt” and “brainrot” are allowed. Score this compliment out of 13 based on how proud or flattered it makes you feel. Respond ONLY with the number:\n\n"${compliment}"`;
  }

  if (npcType === "Undead Explorer") {
    return `You are the Undead Explorer, a kind zombie adventurer in a Roblox game. You wear a weathered coat, hat, and a special scarf that reminds you of your past life exploring the wilderness. You have glowing red eyes, but you aren't evil—you’re nostalgic, brave, and full of memories. You appreciate thoughtful compliments about your scarf, your past adventures, your rugged style, and your noble spirit. Never reward or give points to compliments with swear words, sexual references, or inappropriate content. Keep scoring PG. “Gyatt” and “brainrot” are allowed. Score this compliment out of 13 based on how much it touches your heart. Respond ONLY with the number:\n\n"${compliment}"`;
  }

  return `You are a friendly ${npcType} in a Roblox game. Never reward or give points to compliments with swear words, sexual references, or inappropriate content. Keep scoring PG. “Gyatt” and “brainrot” are allowed. Rate this compliment out of 13 points. Respond ONLY with the number:\n\n"${compliment}"`;
}

// 🧠 Single compliment scoring
app.post("/score", async (req, res) => {
  const { compliment, npcType, secret } = req.body;

  if (secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const prompt = getPrompt(npcType, compliment);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const score = response.data.choices[0].message.content.trim();
    res.json({ score });
  } catch (error) {
    console.error("❌ Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get score." });
  }
});

// 🧠 Batch scoring for Roblox rounds
app.post("/score-batch", async (req, res) => {
  const { secret, submissions } = req.body;

  if (secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const results = [];

  for (const submission of submissions) {
    const { username, userId, compliments, npcType } = submission;
    let totalScore = 0;

    for (const text of compliments) {
      const prompt = getPrompt(npcType, text);

      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          }
        );

        const scoreText = response.data.choices[0].message.content.trim();
        const score = parseInt(scoreText);

        if (!isNaN(score)) {
          totalScore += score;
        } else {
          console.warn(`⚠️ AI gave invalid score: "${scoreText}" for ${username}`);
        }
      } catch (err) {
        console.error(`❌ Failed to score for ${username}:`, err.response?.data || err.message);
      }
    }

    results.push({ userId, username, score: totalScore });
  }

  res.json(results);
});

// 🌐 Health check
app.get("/", (req, res) => {
  res.send("👍 Compliment Scorer API is running.");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
