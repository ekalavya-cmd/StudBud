const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Note: Using Node.js built-in fetch (requires Node.js 18+)
dotenv.config();

// Set the timezone to IST (Asia/Kolkata) at the start
process.env.TZ = process.env.TZ || "Asia/Kolkata";
console.log(`Server timezone set to: ${process.env.TZ}`);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the UserData schema directly in server.js (as provided)
const userDataSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  tasks: [
    {
      id: { type: Number, required: true },
      title: { type: String, required: true },
      dueDate: { type: String, required: true },
      priority: {
        type: String,
        enum: ["Low", "Medium", "High"],
        required: true,
      },
      subject: { type: String },
      completed: { type: Boolean, default: false },
      completedDate: { type: String, default: null },
      pointsAwarded: { type: Boolean, default: false },
      hours: { type: Number, min: 0, default: 0 },
    },
  ],
  studyStats: {
    totalHours: { type: Number, default: 0, min: 0 },
    completedTasks: { type: Number, default: 0, min: 0 },
    streak: { type: Number, default: 0, min: 0 },
    lastActiveDate: { type: String, default: null },
    lastStreakUpdate: { type: String, default: null },
    studyHoursLog: [
      { date: { type: String }, hours: { type: Number, min: 0 } },
    ],
  },
  points: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  themes: {
    type: [String],
    default: [
      "Light Mode",
      "Dark Mode",
      "Ocean Breeze",
      "Sunset Glow",
      "Forest Whisper",
    ],
    validate: {
      validator: (themes) =>
        themes.every((theme) =>
          [
            "Light Mode",
            "Dark Mode",
            "Ocean Breeze",
            "Sunset Glow",
            "Forest Whisper",
          ].includes(theme)
        ),
      message: "Invalid theme name",
    },
  },
  currentTheme: {
    type: String,
    default: "Light Mode",
    enum: [
      "Light Mode",
      "Dark Mode",
      "Ocean Breeze",
      "Sunset Glow",
      "Forest Whisper",
    ],
  },
  unlockedThemes: {
    type: [String],
    default: ["Light Mode"],
    validate: {
      validator: (themes) =>
        themes.every((theme) =>
          [
            "Light Mode",
            "Dark Mode",
            "Ocean Breeze",
            "Sunset Glow",
            "Forest Whisper",
          ].includes(theme)
        ),
      message: "Invalid unlocked theme name",
    },
  },
  cachedSuggestions: { type: Map, of: String, default: {} },
});

const UserData = mongoose.model("UserData", userDataSchema);

// API Endpoints

// Get user data
app.get("/api/user/:userId", async (req, res) => {
  try {
    const userData = await UserData.findOne({ userId: req.params.userId });
    if (!userData) {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
      const defaultData = {
        userId: req.params.userId,
        tasks: [],
        studyStats: {
          totalHours: 0,
          completedTasks: 0,
          streak: 0,
          lastActiveDate: todayStr,
          lastStreakUpdate: todayStr,
          studyHoursLog: [],
        },
        points: 0,
        badges: [],
        themes: [
          "Light Mode",
          "Dark Mode",
          "Ocean Breeze",
          "Sunset Glow",
          "Forest Whisper",
        ],
        currentTheme: "Light Mode",
        unlockedThemes: ["Light Mode"],
        cachedSuggestions: {},
      };
      const newUser = new UserData(defaultData);
      await newUser.save();
      return res.status(200).json(defaultData);
    }
    res.status(200).json(userData);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ error: "Error fetching user data" });
  }
});

// Save user data
app.post("/api/user/:userId", async (req, res) => {
  try {
    const {
      tasks,
      studyStats,
      points,
      badges,
      themes,
      currentTheme,
      unlockedThemes,
    } = req.body;

    if (
      !Array.isArray(tasks) ||
      !Array.isArray(badges) ||
      !Array.isArray(themes) ||
      !Array.isArray(unlockedThemes)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid data format: Arrays required" });
    }

    if (typeof studyStats !== "object" || studyStats === null) {
      return res.status(400).json({ error: "studyStats must be an object" });
    }

    if (
      typeof studyStats.totalHours !== "number" ||
      typeof studyStats.completedTasks !== "number" ||
      typeof studyStats.streak !== "number"
    ) {
      return res.status(400).json({ error: "Invalid studyStats format" });
    }

    if (typeof points !== "number") {
      return res.status(400).json({ error: "Points must be a number" });
    }

    const validThemes = [
      "Light Mode",
      "Dark Mode",
      "Ocean Breeze",
      "Sunset Glow",
      "Forest Whisper",
    ];
    if (!unlockedThemes.every((theme) => validThemes.includes(theme))) {
      return res.status(400).json({ error: "Invalid theme in unlockedThemes" });
    }

    if (!validThemes.includes(currentTheme)) {
      return res.status(400).json({ error: "Invalid currentTheme" });
    }

    const userData = await UserData.findOneAndUpdate(
      { userId: req.params.userId },
      {
        tasks,
        studyStats: {
          ...studyStats,
          studyHoursLog: studyStats.studyHoursLog || [],
        },
        points,
        badges,
        themes,
        currentTheme,
        unlockedThemes,
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(200).json(userData);
  } catch (err) {
    console.error("Error saving user data:", err);
    res.status(500).json({ error: "Error saving user data" });
  }
});

// Endpoint for AI suggestions using Hugging Face Inference API
app.post("/api/ai-suggestion", async (req, res) => {
  const { tasks = [], studyHabits = {}, customPrompt } = req.body;
  try {
    // Validate tasks is an array
    if (!Array.isArray(tasks)) {
      throw new Error("Tasks must be an array");
    }

    // Validate studyHabits
    if (typeof studyHabits !== "object" || studyHabits === null) {
      throw new Error("studyHabits must be an object");
    }

    // Include customPrompt in the cache key to ensure unique suggestions
    const cacheKey = JSON.stringify({ tasks, studyHabits, customPrompt });
    const userData = await UserData.findOne({ userId: "user123" });
    if (
      userData.cachedSuggestions &&
      userData.cachedSuggestions.get(cacheKey)
    ) {
      return res.json({ suggestion: userData.cachedSuggestions.get(cacheKey) });
    }

    // Filter tasks to only include incomplete tasks due today or upcoming
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
    const filteredTasks = tasks.filter((task) => {
      const isNotCompleted = !task.completed;
      const isDueTodayOrUpcoming = new Date(task.dueDate) >= new Date(todayStr);
      return isNotCompleted && isDueTodayOrUpcoming;
    });

    // Get today's study hours from studyHabits
    const todayStudyHours =
      studyHabits.studyHoursLog?.find((log) => log.date === todayStr)?.hours ||
      0;

    const defaultPrompt = `You are an AI study assistant for Computer Engineering and Information Technology students, focusing on subjects like programming, operating systems, AI/ML, networking, and web development. Based on the following incomplete tasks (completed: false): ${JSON.stringify(
      filteredTasks
    )} and study habits: ${JSON.stringify(
      studyHabits
    )}, generate a study suggestion for today (${todayStr}). 

**Instructions:**
- Only include tasks due today or upcoming (not overdue).
- If there are no incomplete tasks, provide a concise general study tip (1-2 sentences) related to CE/IT fields instead of fabricating tasks.
- Use the exact priority values from the task data: "High", "Medium", "Low".
- Always include a "Habits" section with:
  - Total study hours for today: Use the value ${todayStudyHours} and the word "hour" (even for plural).
  - Current streak: Use the exact value ${
    studyHabits.streak || 0
  } with "day" (add "s" if streak > 1).
  - A short motivational message about consistency (1 sentence).
- End with this exact motivational message: "Your dedication and consistency will lead you to success in CE and IT field. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals."

**Format (use this structure exactly, even if sections are empty):**
- High Priority:
  - [Task title] (Hours: [hours], Due: [due date])
  - None (if no tasks)
- Medium Priority:
  - [Task title] (Hours: [hours], Due: [due date])
  - None (if no tasks)
- Low Priority:
  - [Task title] (Hours: [hours], Due: [due date])
  - None (if no tasks)
- General Study Tip (only if no tasks):
  - [A study tip related to CE/IT field]
- Habits:
  - Total study hours for today: [hours] hour
  - Your current streak is [streak] day(s)
  - [Motivational message about consistency]

**Example (if no tasks):**
- High Priority:
  - None
- Medium Priority:
  - None
- Low Priority:
  - None
- General Study Tip:
  - Practice writing HEART queries on a platform like LeetCode to strengthen your database skills.
- Habits:
  - Total study hours for today: 1 hour
  - Your current streak is 0 day
  - Keep consistent to build your streak and achieve your goals!
Your dedication and consistency will lead you to success in CE and IT field. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.`;

    // Use customPrompt if provided, otherwise use defaultPrompt
    const promptText = customPrompt || defaultPrompt;

    // List of models to try (in order of preference)
    const models = [
      "mistralai/Mixtral-8x7B-Instruct-v0.1", // Primary model
      "google/flan-t5-large", // Fallback model
      "distilgpt2", // Additional fallback
    ];

    let suggestion = null;
    let errorMessage = null;
    let usedModel = null;

    for (const model of models) {
      try {
        console.log(`Attempting to use model: ${model}`);
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: promptText,
              parameters: {
                max_length: 300,
                temperature: 0.5,
                top_p: 0.9,
              },
            }),
          }
        );

        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(
            `Invalid response from Hugging Face API (model: ${model}): ${text}`
          );
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(
            `Hugging Face API error (model: ${model}): ${data.error}`
          );
        }

        suggestion = data[0].generated_text;
        suggestion = suggestion.replace(promptText, "").trim();
        usedModel = model;
        console.log(
          `Successfully generated suggestion using model: ${usedModel}`
        );
        break; // Exit loop if successful
      } catch (error) {
        errorMessage = error.message;
        continue; // Try the next model
      }
    }

    if (!suggestion) {
      throw new Error(
        errorMessage || "No available models to generate suggestion"
      );
    }

    // Skip validation for customPrompt requests
    if (!customPrompt) {
      const requiredMotivationalMessage =
        "Your dedication and consistency will lead you to success in CE and IT field. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.";
      if (!suggestion.includes(requiredMotivationalMessage)) {
        suggestion = suggestion.trim() + "\n" + requiredMotivationalMessage;
      }

      const actualStreak = studyHabits.streak || 0;
      const streakMatch = suggestion.match(
        /- Your current streak is (\d+) day(s)?/
      );
      if (!streakMatch) {
        if (suggestion.includes("- Habits:")) {
          suggestion = suggestion.replace(
            /- Habits:\n/,
            `- Habits:\n  - Total study hours for today: ${todayStudyHours} hour\n  - Your current streak is ${actualStreak} day${
              actualStreak !== 1 ? "s" : ""
            }\n`
          );
        } else {
          suggestion = `${suggestion}\n- Habits:\n  - Total study hours for today: ${todayStudyHours} hour\n  - Your current streak is ${actualStreak} day${
            actualStreak !== 1 ? "s" : ""
          }\n  - Keep consistent to build your streak and achieve your goals!`;
        }
      } else {
        const reportedStreak = parseInt(streakMatch[1]);
        if (reportedStreak !== actualStreak) {
          suggestion = suggestion.replace(
            /- Your current streak is \d+ day(s)?/,
            `- Your current streak is ${actualStreak} day${
              actualStreak !== 1 ? "s" : ""
            }`
          );
        }
      }

      const hoursMatch = suggestion.match(
        /- Total study hours for today: (\d+(\.\d+)?) hour/
      );
      if (!hoursMatch) {
        if (suggestion.includes("- Habits:")) {
          suggestion = suggestion.replace(
            /- Habits:\n/,
            `- Habits:\n  - Total study hours for today: ${todayStudyHours} hour\n`
          );
        } else {
          suggestion = `${suggestion}\n- Habits:\n  - Total study hours for today: ${todayStudyHours} hour\n  - Your current streak is ${actualStreak} day${
            actualStreak !== 1 ? "s" : ""
          }\n  - Keep consistent to build your streak and achieve your goals!`;
        }
      } else {
        const reportedHours = parseFloat(hoursMatch[1]);
        if (reportedHours !== todayStudyHours) {
          suggestion = suggestion.replace(
            /- Total study hours for today: \d+(\.\d+)? hour/,
            `- Total study hours for today: ${todayStudyHours} hour`
          );
        }
      }

      if (suggestion.includes("Math")) {
        suggestion = suggestion.replace(
          /Low Priority:[\s\S]*?General Study Tip:/,
          "Low Priority:\n- None\nGeneral Study Tip:"
        );
      }

      if (
        filteredTasks.length === 0 &&
        !suggestion.includes("- General Study Tip:")
      ) {
        suggestion = suggestion.replace(
          /- Habits:/,
          `- General Study Tip:\n  - Practice writing SQL queries on a platform like LeetCode to strengthen your database skills.\n- Habits:`
        );
      }
    }

    await UserData.findOneAndUpdate(
      { userId: "user123" },
      { $set: { [`cachedSuggestions.${cacheKey}`]: suggestion } },
      { upsert: true }
    );

    res.json({ suggestion });
  } catch (error) {
    console.error("Error generating AI suggestion:", error);
    res
      .status(500)
      .json({ error: "Failed to generate AI suggestion: " + error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
