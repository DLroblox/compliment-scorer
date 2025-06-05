require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// 🧠 Single compliment scoring (existing)
app.post("/score", async (req, res) => {
  const { compliment, npcType, secret } = req.body;

  if (secret !== process.env.SECRET_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const prompt = `You are a friendly ${npcType} in a Roblox game. Rate this compliment out of 13 points. Respond ONLY with the number:\n\n"${compliment}"`;

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
      const prompt = `You are a friendly ${npcType} in a Roblox game. Rate this compliment out of 13 points. Respond ONLY with the number:\n\n"${text}"`;

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
