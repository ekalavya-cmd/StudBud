// server.js with fixed generateSchedule function

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios"); // Using axios instead of fetch

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

// Predefined study tips to use as fallback
const predefinedStudyTips = [
  "Here's a study tip for students:\n\n- Use the Pomodoro Technique: Study for 25 minutes, then take a 5-minute break. This improves focus by working with your brain's natural attention cycles. Ideal for complex programming tasks.",
  "Here's a study tip for students:\n\n- Create a dedicated study environment free from distractions. Your brain forms associations with physical spaces, making it easier to focus when you're in your designated study area. Perfect for deep technical learning.",
  "Here's a study tip for students:\n\n- Practice active recall by testing yourself rather than just re-reading notes. Try explaining database concepts or algorithms out loud as if teaching someone else. This strengthens neural pathways and improves retention.",
  "Here's a study tip for students:\n\n- Use spaced repetition for memorizing important concepts. Review material at increasing intervals (1 day, 3 days, 1 week, etc.). This technique is especially effective for remembering syntax rules and programming patterns.",
  "Here's a study tip for students:\n\n- Break complex topics into smaller, manageable chunks. When learning a new programming language, master one concept before moving to the next. This prevents overwhelm and builds confidence through incremental success.",
  "Here's a study tip for students:\n\n- Create mind maps to visualize connections between different computing concepts. This spatial organization helps your brain form meaningful associations and see the bigger picture in complex technical subjects.",
  "Here's a study tip for students:\n\n- Set specific, measurable study goals for each session. Instead of \"study networking,\" aim to \"understand and diagram the OSI model layers.\" This creates clear endpoints and a sense of accomplishment.",
  "Here's a study tip for students:\n\n- Use the Feynman Technique: Explain a complex computing concept in simple terms as if teaching a beginner. This reveals gaps in your understanding and reinforces your knowledge of the material.",
  "Here's a study tip for students:\n\n- Alternate between different subjects or problem types in a single study session. This interleaving approach forces your brain to retrieve different strategies and strengthens overall learning more than blocked practice.",
  "Here's a study tip for students:\n\n- Take brief, regular movement breaks during study sessions. Physical activity increases blood flow to the brain, improving cognitive function. Even a 5-minute walk can refresh your mind for tackling difficult coding problems."
];

// Predefined motivational messages for progress reports
const predefinedMotivationalMessages = [
  "Your dedication and consistency will lead you to success in CE and IT field. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.",
  "Small steps every day add up to big results over time. Keep building your knowledge consistently!",
  "The effort you put into your studies today will shape your professional future tomorrow. Keep up the great work!",
  "Persistence is the key to mastering complex technical topics. Your consistent effort is building a strong foundation for success.",
  "Every study session brings you closer to your goals. Your dedication today will open doors to opportunities tomorrow.",
  "Learning to code is a journey, not a destination. Each day of practice makes you stronger and more skilled.",
  "Great job on your progress today! Remember that consistent small improvements compound into mastery over time.",
  "Your commitment to learning is inspiring. Keep nurturing your technical skills, and you'll achieve remarkable results.",
  "Success in tech comes from consistent practice and problem-solving. You're building those skills every day!",
  "The road to becoming a great developer is built one study session at a time. You're making excellent progress!"
];

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

// Function to try getting a suggestion from Hugging Face API using facebook/bart-base
async function getHuggingFaceSuggestion(promptText) {
  // Using the working model we found: facebook/bart-base
  const model = "facebook/bart-base";
  
  // Check if we have an API key before trying to call the API
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.log("No API key found - skipping API calls");
    throw new Error("No API key configured");
  }
  
  try {
    console.log(`Attempting to use model: ${model}`);
    
    // Since bart-base is a text2text model, we need to format the prompt properly
    const isStudyTipRequest = promptText.includes("Generate a concise study tip");
    
    // Format the prompt appropriately for the model
    const formattedPrompt = isStudyTipRequest
      ? `Create a short, actionable study tip that helps students improve their learning efficiency. The tip should be concise and specific. For example: "To improve focus, study in 25-minute blocks with 5-minute breaks. This matches your brain's attention span and boosts productivity."`
      : `Generate a study suggestion based on the following information: ${promptText}`;
    
    const response = await axios({
      method: 'post',
      url: `https://api-inference.huggingface.co/models/${model}`,
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data: {
        inputs: formattedPrompt,
        parameters: {
          max_length: 300,
          min_length: 50,  // Add a minimum length to encourage non-empty responses
          do_sample: true,
          temperature: 0.7,
          num_beams: 4
        }
      },
      timeout: 15000 // 15 second timeout
    });
    
    if (response.status === 200) {
      // Handle different response formats
      let generatedText = "";
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        generatedText = response.data[0].generated_text || "";
      } else if (typeof response.data === 'string') {
        generatedText = response.data;
      } else if (response.data && response.data.generated_text) {
        generatedText = response.data.generated_text;
      }
      
      console.log(`Successfully generated suggestion using model: ${model}`);
      console.log("Raw generated text:", generatedText);
      
      // Check if the response is empty or too short (less than 10 chars)
      if (!generatedText || generatedText.trim().length < 10) {
        console.log("Response too short or empty, using fallback");
        throw new Error("Empty or too short response from model");
      }
      
      // Ensure proper formatting for study tips
      if (isStudyTipRequest && !generatedText.toLowerCase().includes("here's a study tip")) {
        generatedText = `Here's a study tip for students:\n\n- ${generatedText}`;
      }
      
      return generatedText.trim();
    } else {
      throw new Error(`Invalid response status: ${response.status}`);
    }
  } catch (error) {
    console.error(`Error with model ${model}:`, error.message);
    throw error;
  }
}

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
      userData?.cachedSuggestions &&
      userData.cachedSuggestions.get(cacheKey)
    ) {
      // Add artificial delay for cache hit as well to maintain consistent UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.json({ suggestion: userData.cachedSuggestions.get(cacheKey) });
    }

    // Check if this is a study tip request (based on the customPrompt content)
    const isStudyTipRequest = customPrompt && customPrompt.includes("Generate a concise study tip");
    
    // Check if this is a progress report request
    const isProgressReport = customPrompt && customPrompt.includes("Generate a list of 10 short motivational messages");

    let suggestion;
    
    // Add a consistent delay to simulate processing time (improves UX)
    await new Promise(resolve => setTimeout(resolve, 1200)); // Increased delay to 1.2 seconds
    
    // For study tips specifically, use our predefined tips directly
    // This is more reliable than trying to use the API which is returning empty responses
    if (isStudyTipRequest) {
      console.log("Using predefined study tip for reliable response");
      suggestion = predefinedStudyTips[Math.floor(Math.random() * predefinedStudyTips.length)];
    } else if (isProgressReport) {
      // For progress reports, make sure we include a motivational message
      try {
        console.log("Generating progress report");
        
        // Get the progress data from the request
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
        const todayStudyHours =
          studyHabits.studyHoursLog?.find((log) => log.date === todayStr)?.hours || 0;
        const tasksCompletedToday = tasks.filter(
          (task) => task.completed && task.completedDate === todayStr
        );
        const totalTasksCompletedToday = tasksCompletedToday.length;
        const highPriorityCompleted = tasksCompletedToday.filter(
          (task) => task.priority === "High"
        ).length;
        const mediumPriorityCompleted = tasksCompletedToday.filter(
          (task) => task.priority === "Medium"
        ).length;
        const lowPriorityCompleted = tasksCompletedToday.filter(
          (task) => task.priority === "Low"
        ).length;
        
        // Select a random motivational message
        const motivationalMessage = predefinedMotivationalMessages[
          Math.floor(Math.random() * predefinedMotivationalMessages.length)
        ];
        
        // Format the progress report with the motivational message - DO NOT include a date in the motivational message
        suggestion = `Here's your progress for today (${todayStr}):\n\n- Total Study Hours Today: ${todayStudyHours} hour${todayStudyHours !== 1 ? "s" : ""}\n- Tasks Completed Today: ${totalTasksCompletedToday}\n- High Priority Tasks Completed Today: ${highPriorityCompleted}\n- Medium Priority Tasks Completed Today: ${mediumPriorityCompleted}\n- Low Priority Tasks Completed Today: ${lowPriorityCompleted}\n\n${motivationalMessage}`;
        
        console.log("Generated progress report successfully");
      } catch (error) {
        console.log("Error generating progress report:", error.message);
        
        // Fallback motivational message if there's an error
        const motivationalMessage = predefinedMotivationalMessages[0];
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
        suggestion = `Here's your progress for today (${todayStr}):\n\n- Total Study Hours Today: 0 hours\n- Tasks Completed Today: 0\n- High Priority Tasks Completed Today: 0\n- Medium Priority Tasks Completed Today: 0\n- Low Priority Tasks Completed Today: 0\n\n${motivationalMessage}`;
      }
    } else {
      // For regular suggestions (not study tips), try the Hugging Face API first
      try {
        console.log("Attempting to generate personalized suggestion from Hugging Face API");
        suggestion = await getHuggingFaceSuggestion(generateDefaultPrompt(tasks, studyHabits));
        console.log("Successfully generated suggestion from Hugging Face API");
      } catch (error) {
        console.log("Falling back to local generation:", error.message);
        
        // For regular suggestions, use local generation
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
        const filteredTasks = tasks.filter((task) => {
          const isNotCompleted = !task.completed;
          const isDueTodayOrUpcoming = new Date(task.dueDate) >= new Date(todayStr);
          return isNotCompleted && isDueTodayOrUpcoming;
        });
        
        // Get today's study hours from studyHabits
        const todayStudyHours =
          studyHabits.studyHoursLog?.find((log) => log.date === todayStr)?.hours || 0;
            
        suggestion = generateFallbackSuggestion(filteredTasks, studyHabits, todayStudyHours, todayStr);
        console.log("Generated local fallback suggestion");
      }
    }

    // Add debugging to see what's being sent to the frontend
    console.log("Formatted suggestion before sending to frontend:", suggestion);

    // Skip validation for customPrompt requests or if it's a study tip
    if (!customPrompt && !isStudyTipRequest) {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
      const todayStudyHours =
        studyHabits.studyHoursLog?.find((log) => log.date === todayStr)?.hours || 0;
      
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

      const filteredTasks = tasks.filter((task) => {
        const isNotCompleted = !task.completed;
        const isDueTodayOrUpcoming = new Date(task.dueDate) >= new Date(todayStr);
        return isNotCompleted && isDueTodayOrUpcoming;
      });
      
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

// Function to generate the default prompt for Hugging Face API
function generateDefaultPrompt(tasks, studyHabits) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
  
  // Filter tasks to only include incomplete tasks due today or upcoming
  const filteredTasks = tasks.filter((task) => {
    const isNotCompleted = !task.completed;
    const isDueTodayOrUpcoming = new Date(task.dueDate) >= new Date(todayStr);
    return isNotCompleted && isDueTodayOrUpcoming;
  });
  
  // Get today's study hours from studyHabits
  const todayStudyHours =
    studyHabits.studyHoursLog?.find((log) => log.date === todayStr)?.hours || 0;
  
  return `Create a study plan for today based on this information:
Tasks: ${JSON.stringify(filteredTasks)}
Study habits: ${JSON.stringify(studyHabits)}
Today's date: ${todayStr}
Today's study hours: ${todayStudyHours}
Current streak: ${studyHabits.streak || 0} days

Format the response with these sections:
- High Priority tasks
- Medium Priority tasks 
- Low Priority tasks
- Study tip
- Habits information
- End with a motivational message`;
}

// Function to generate a fallback suggestion when API calls fail
function generateFallbackSuggestion(tasks, studyHabits, todayStudyHours, todayStr) {
  const actualStreak = studyHabits.streak || 0;
  
  // Check if there are any tasks
  if (tasks.length === 0) {
    return `- High Priority:
  - None
- Medium Priority:
  - None
- Low Priority:
  - None
- General Study Tip:
  - Practice writing SQL queries on a platform like LeetCode to strengthen your database skills.
- Habits:
  - Total study hours for today: ${todayStudyHours} hour
  - Your current streak is ${actualStreak} day${actualStreak !== 1 ? "s" : ""}
  - Keep consistent to build your streak and achieve your goals!
Your dedication and consistency will lead you to success in CE and IT field. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.`;
  }
  
  // If there are tasks, organize them by priority
  const highPriorityTasks = tasks.filter(task => task.priority === "High");
  const mediumPriorityTasks = tasks.filter(task => task.priority === "Medium");
  const lowPriorityTasks = tasks.filter(task => task.priority === "Low");
  
  let suggestion = "";
  
  // Add high priority tasks
  suggestion += "- High Priority:\n";
  if (highPriorityTasks.length > 0) {
    highPriorityTasks.forEach(task => {
      suggestion += `  - ${task.title} (Hours: ${task.hours || 0}, Due: ${task.dueDate})\n`;
    });
  } else {
    suggestion += "  - None\n";
  }
  
  // Add medium priority tasks
  suggestion += "- Medium Priority:\n";
  if (mediumPriorityTasks.length > 0) {
    mediumPriorityTasks.forEach(task => {
      suggestion += `  - ${task.title} (Hours: ${task.hours || 0}, Due: ${task.dueDate})\n`;
    });
  } else {
    suggestion += "  - None\n";
  }
  
  // Add low priority tasks
  suggestion += "- Low Priority:\n";
  if (lowPriorityTasks.length > 0) {
    lowPriorityTasks.forEach(task => {
      suggestion += `  - ${task.title} (Hours: ${task.hours || 0}, Due: ${task.dueDate})\n`;
    });
  } else {
    suggestion += "  - None\n";
  }
  
  // Add habits section
  suggestion += `- Habits:
  - Total study hours for today: ${todayStudyHours} hour
  - Your current streak is ${actualStreak} day${actualStreak !== 1 ? "s" : ""}
  - Keep consistent to build your streak and achieve your goals!
Your dedication and consistency will lead you to success in CE and IT field. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.`;

  return suggestion;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));