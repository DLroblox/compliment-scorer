const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

require("dotenv").config();
app.use(bodyParser.json());

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

app.get("/", (req, res) => {
  res.send("👍 Compliment Scorer API is running.");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
