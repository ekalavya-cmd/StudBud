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
  "Here's a study tip for students:\n\n- Use the Pomodoro Technique: Study for 25 minutes, then take a 5-minute break. This improves focus by working with your brain's natural attention cycles. Ideal for complex topics requiring deep concentration.",
  "Here's a study tip for students:\n\n- Create a dedicated study environment free from distractions. Your brain forms associations with physical spaces, making it easier to focus when you're in your designated study area. Perfect for deep learning in any subject.",
  "Here's a study tip for students:\n\n- Practice active recall by testing yourself rather than just re-reading notes. Try explaining concepts out loud as if teaching someone else. This strengthens neural pathways and improves retention across all subjects.",
  "Here's a study tip for students:\n\n- Use spaced repetition for memorizing important concepts. Review material at increasing intervals (1 day, 3 days, 1 week, etc.). This technique is especially effective for remembering key facts, formulas, and definitions.",
  "Here's a study tip for students:\n\n- Break complex topics into smaller, manageable chunks. Master one concept before moving to the next. This prevents overwhelm and builds confidence through incremental success, regardless of what you're studying.",
  "Here's a study tip for students:\n\n- Create mind maps to visualize connections between different concepts. This spatial organization helps your brain form meaningful associations and see the bigger picture in complex subjects, from sciences to humanities.",
  'Here\'s a study tip for students:\n\n- Set specific, measurable study goals for each session. Instead of "study chemistry," aim to "understand and diagram the three types of chemical bonds." This creates clear endpoints and a sense of accomplishment.',
  "Here's a study tip for students:\n\n- Use the Feynman Technique: Explain a complex concept in simple terms as if teaching a beginner. This reveals gaps in your understanding and reinforces your knowledge of the material, works for any field of study.",
  "Here's a study tip for students:\n\n- Alternate between different subjects or problem types in a single study session. This interleaving approach forces your brain to retrieve different strategies and strengthens overall learning more than blocked practice.",
  "Here's a study tip for students:\n\n- Take brief, regular movement breaks during study sessions. Physical activity increases blood flow to the brain, improving cognitive function. Even a 5-minute walk can refresh your mind for tackling difficult problems.",
];

// Predefined motivational messages for progress reports
const predefinedMotivationalMessages = [
  "Your dedication and consistency will lead you to success in your field of study. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.",
  "Small steps every day add up to big results over time. Keep building your knowledge consistently, regardless of your area of study!",
  "The effort you put into your studies today will shape your professional future tomorrow. Every subject you master opens new doors of opportunity.",
  "Persistence is the key to mastering complex topics in any field. Your consistent effort is building a strong foundation for success.",
  "Every study session brings you closer to your goals. Your dedication today will open doors to opportunities tomorrow, whatever your field of interest.",
  "Learning is a journey, not a destination. Each day of practice makes you stronger and more skilled in your chosen discipline.",
  "Great job on your progress today! Remember that consistent small improvements compound into mastery over time, no matter what you're studying.",
  "Your commitment to learning is inspiring. Keep nurturing your skills and knowledge, and you'll achieve remarkable results in your field.",
  "Success comes from consistent practice and problem-solving. You're building valuable skills every day that will serve you well in your future endeavors.",
  "The road to becoming an expert is built one study session at a time. You're making excellent progress toward your educational goals!",
];

// Predefined motivational messages based on progress level
const progressBasedMessages = {
  // For students who haven't made progress yet or just started
  beginner: [
    "Starting your learning journey is often the hardest part, and you've already taken that step. That's something to be proud of!",
    "Everyone begins somewhere. Your willingness to start learning sets you apart and will take you far in your studies.",
    "The first steps of any learning journey can be challenging, but they're also the most important. You've got this!",
    "You're at the beginning of an exciting learning adventure. Each small step you take builds momentum for future success.",
    "Starting fresh gives you a world of possibilities. Embrace this beginning and watch your knowledge grow day by day.",
  ],

  // For students who have been consistently studying
  intermediate: [
    "Your consistent dedication to your studies is building a solid foundation of knowledge. Keep that momentum going!",
    "The steady progress you're making shows real commitment to your learning goals. That persistence will take you far.",
    "You're finding your rhythm in your studies, and that consistent effort is how lasting knowledge is built. Well done!",
    "Consistent practice is the hallmark of successful learners, and you're demonstrating that quality every day.",
    "Your regular study habits are setting you apart. This consistent approach will serve you well throughout your academic journey.",
  ],

  // For students who have been studying for a long time
  advanced: [
    "The dedication you've shown over your extended learning journey is remarkable. You've come so far, and that persistence will continue to serve you well.",
    "Your long-term commitment to your studies shows a rare level of discipline. That quality will be invaluable throughout your life and career.",
    "The depth of knowledge you're building through consistent, long-term study creates a foundation that few achieve. Be proud of your exceptional commitment.",
    "Your sustained dedication to learning demonstrates character that extends far beyond academics. You're developing life skills that will benefit you in countless ways.",
    "The journey you've been on represents hundreds of choices to prioritize growth and learning. That's something truly special.",
  ],
};

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

// Function to try getting a suggestion from Hugging Face API with optimized models
async function getHuggingFaceSuggestion(promptText) {
  console.log(
    "🤖 Attempting to use Hugging Face API for suggestion generation..."
  );

  // List of models known to work well for text generation
  // More focused list of models that are confirmed to be available
  const models = [
    "gpt2", // Simple but reliable
    "distilgpt2", // Faster version of GPT-2
    "facebook/bart-large-cnn", // Works but needs filtering
    "EleutherAI/gpt-neo-125M", // Smaller GPT-Neo model
    "facebook/blenderbot-400M-distill", // Good for conversational text
  ];

  // Check if we have an API key before trying to call the API
  if (!process.env.HUGGINGFACE_API_KEY) {
    console.log("❌ No Hugging Face API key configured");
    throw new Error("No API key configured");
  }

  // Try each model in sequence until one works
  for (const model of models) {
    try {
      console.log(`🔄 Trying model: ${model}...`);

      // Determine what type of request this is
      const isStudyTipRequest = promptText.includes(
        "Generate a concise study tip"
      );
      const isProgressReport = promptText.includes(
        "Generate a list of 10 short motivational messages"
      );

      // Use very simple, direct prompts for better results
      let formattedPrompt;

      if (isStudyTipRequest) {
        // Use direct, imperative sentences for better results
        if (model.includes("gpt2") || model.includes("neo")) {
          formattedPrompt = "Here's a study tip: To improve your learning, ";
        } else if (model.includes("blenderbot")) {
          formattedPrompt =
            "What's a good study technique that helps students learn better?";
        } else {
          formattedPrompt = "An effective study technique is to ";
        }
      } else if (isProgressReport) {
        if (model.includes("gpt2") || model.includes("neo")) {
          formattedPrompt =
            "Motivational message for students: Your dedication to studying ";
        } else if (model.includes("blenderbot")) {
          formattedPrompt =
            "What would you say to motivate a student who's been studying hard?";
        } else {
          formattedPrompt = "A motivational message for a dedicated student: ";
        }
      } else {
        if (model.includes("gpt2") || model.includes("neo")) {
          formattedPrompt =
            "Study plan advice: When studying, it's important to ";
        } else if (model.includes("blenderbot")) {
          formattedPrompt = "What's a good way to organize your study time?";
        } else {
          formattedPrompt = "Tips for effective studying: ";
        }
      }

      // Customize model parameters based on the model type
      let modelOptions = {};
      let taskType = "text-generation";

      if (model.includes("gpt2") || model.includes("neo")) {
        // Parameters for GPT-type models
        modelOptions = {
          max_new_tokens: 100, // Limit response length
          temperature: 0.7, // Moderate randomness
          top_p: 0.9, // Nucleus sampling
          do_sample: true, // Enable sampling
          return_full_text: false, // Don't include the prompt
        };
      } else if (model.includes("bart")) {
        // Parameters for BART models
        taskType = "summarization";
        modelOptions = {
          max_length: 100,
          min_length: 30,
          do_sample: true,
          temperature: 0.7,
        };
      } else if (model.includes("blenderbot")) {
        // Parameters for conversational models
        taskType = "text-generation";
        modelOptions = {
          max_length: 100,
          do_sample: true,
          temperature: 0.7,
        };
      } else {
        // Default parameters
        modelOptions = {
          max_length: 100,
          do_sample: true,
          temperature: 0.7,
        };
      }

      console.log(
        `📤 Sending request to Hugging Face API using ${model} (task: ${taskType})...`
      );
      console.log(`📋 Prompt: ${formattedPrompt}`);

      // Use the inference API with the appropriate task
      const response = await axios({
        method: "post",
        url: `https://api-inference.huggingface.co/models/${model}`,
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        data: {
          inputs: formattedPrompt,
          parameters: modelOptions,
          options: {
            wait_for_model: true,
            use_cache: true,
          },
        },
        timeout: 30000, // 30 second timeout
      });

      // Log the response status and type
      console.log(`📊 Response status: ${response.status}`);
      console.log(`📊 Response type: ${typeof response.data}`);

      // Extract the generated text based on the model type and response format
      let generatedText = "";

      if (response.data) {
        // For GPT-2 models, we typically get an array of objects with 'generated_text'
        if (model.includes("gpt2") || model.includes("neo")) {
          if (
            Array.isArray(response.data) &&
            response.data.length > 0 &&
            response.data[0].generated_text
          ) {
            generatedText = response.data[0].generated_text;
            console.log("📝 GPT-2 format detected");
          }
        }
        // For BART models, we typically get an object with 'summary_text'
        else if (model.includes("bart")) {
          if (
            Array.isArray(response.data) &&
            response.data.length > 0 &&
            response.data[0].summary_text
          ) {
            generatedText = response.data[0].summary_text;
            console.log("📝 BART format detected");
          }
        }
        // For BlenderBot, we might get a conversation format
        else if (model.includes("blenderbot")) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            if (response.data[0].conversation) {
              generatedText =
                response.data[0].conversation.generated_responses[0];
              console.log("📝 BlenderBot conversation format detected");
            } else if (response.data[0].generated_text) {
              generatedText = response.data[0].generated_text;
              console.log("📝 BlenderBot text format detected");
            }
          }
        }

        // If we haven't extracted text through the model-specific formats,
        // fall back to more generic extraction
        if (!generatedText && typeof response.data === "string") {
          generatedText = response.data;
          console.log("📝 String response format");
        } else if (
          !generatedText &&
          Array.isArray(response.data) &&
          response.data.length > 0
        ) {
          if (typeof response.data[0] === "string") {
            generatedText = response.data[0];
            console.log("📝 Array of strings format");
          } else if (response.data[0].generated_text) {
            generatedText = response.data[0].generated_text;
            console.log("📝 Generic generated_text format");
          } else if (response.data[0].summary_text) {
            generatedText = response.data[0].summary_text;
            console.log("📝 Generic summary_text format");
          }
        }

        // Last resort: try to extract text from whatever we got
        if (!generatedText && typeof response.data === "object") {
          try {
            // Try to find any string property that might contain useful text
            for (const key in response.data) {
              if (
                typeof response.data[key] === "string" &&
                response.data[key].length > 10
              ) {
                generatedText = response.data[key];
                console.log(`📝 Found text in property: ${key}`);
                break;
              } else if (
                typeof response.data[key] === "object" &&
                response.data[key] !== null
              ) {
                // Look one level deeper
                for (const nestedKey in response.data[key]) {
                  if (
                    typeof response.data[key][nestedKey] === "string" &&
                    response.data[key][nestedKey].length > 10
                  ) {
                    generatedText = response.data[key][nestedKey];
                    console.log(
                      `📝 Found text in nested property: ${key}.${nestedKey}`
                    );
                    break;
                  }
                }
              }
            }

            // If we still don't have text, use the stringified object (last resort)
            if (!generatedText) {
              generatedText = JSON.stringify(response.data);
              console.log("📝 Using stringified object as fallback");
            }
          } catch (e) {
            console.log(`❌ Error extracting text from response: ${e.message}`);
          }
        }
      }

      // If we still don't have usable text, throw an error
      if (!generatedText || generatedText.trim().length < 5) {
        console.log(`⚠️ Empty or too short response from model ${model}`);
        throw new Error(`Empty or too short response from model ${model}`);
      }

      console.log(
        `📝 Raw extracted text (${
          generatedText.length
        } chars): ${generatedText.substring(0, 150)}...`
      );

      // Post-process the generated text to make it more useful

      // 1. Truncate at periods or question marks to get complete sentences
      const sentenceEnd = generatedText.search(/[.?!]\s+[A-Z]|[.?!]$/);
      if (sentenceEnd > 20) {
        // Only truncate if we have a reasonable sentence length
        generatedText = generatedText.substring(0, sentenceEnd + 1);
      }

      // 2. For GPT models that might continue with irrelevant text, limit to first few sentences
      if (model.includes("gpt2") || model.includes("neo")) {
        const sentences = generatedText.match(/[^.!?]+[.!?]+/g) || [
          generatedText,
        ];
        if (sentences.length > 3) {
          generatedText = sentences.slice(0, 3).join(" ");
        }
      }

      // 3. Clean up any artifacts or irrelevant content
      generatedText = generatedText
        .replace(/CNN\.com|cnn\.com/g, "")
        .replace(/quiz|Quiz/g, "")
        .replace(/click here|Click here/g, "")
        .replace(/subscribe|Subscribe/g, "");

      // 4. Reject if the text has problematic patterns
      const rejectPatterns = [
        /news/i,
        /today's/i,
        /weekly/i,
        /article/i,
        /headlines/i,
        /submit/i,
        /find out more/i,
        /learn more/i,
        /for more information/i,
      ];

      for (const pattern of rejectPatterns) {
        if (pattern.test(generatedText)) {
          console.log(`⚠️ Response matched reject pattern: ${pattern}`);
          throw new Error(`Response contains irrelevant content: ${pattern}`);
        }
      }

      // 5. For study tips, ensure it contains relevant keywords
      if (isStudyTipRequest) {
        const studyKeywords = [
          "study",
          "learn",
          "memory",
          "recall",
          "focus",
          "concentrat",
          "review",
          "practice",
          "technique",
          "method",
          "approach",
          "understand",
          "break",
          "time",
          "session",
          "notes",
          "read",
          "write",
          "remember",
        ];

        const keywordCount = studyKeywords.filter((keyword) =>
          generatedText.toLowerCase().includes(keyword)
        ).length;

        if (keywordCount < 1) {
          // Just require 1 keyword to be more lenient
          console.log(
            `⚠️ Response lacks study-related keywords (found ${keywordCount})`
          );
          throw new Error(`Response lacks sufficient study-related content`);
        }
      }

      // Format the response appropriately
      if (
        isStudyTipRequest &&
        !generatedText.toLowerCase().includes("here's a study tip")
      ) {
        generatedText = `Here's a study tip for students:\n\n- ${generatedText}`;
      } else if (
        isProgressReport &&
        !generatedText.toLowerCase().includes("motivation")
      ) {
        generatedText = `Your dedication is impressive. ${generatedText}`;
      }

      // Filter out any tech-specific content
      if (
        generatedText.toLowerCase().includes("coding") ||
        generatedText.toLowerCase().includes("programming") ||
        generatedText.toLowerCase().includes("it field") ||
        generatedText.toLowerCase().includes("computer science")
      ) {
        console.log(
          "⚠️ Response contains tech-specific content, trying another model"
        );
        throw new Error("Response contains tech-specific content");
      }

      console.log(
        `✅ Successfully generated content using ${model} (${generatedText.length} chars)`
      );
      console.log(`📝 Final text: ${generatedText}`);

      return {
        text: generatedText.trim(),
        model: model, // Return which model was used successfully
      };
    } catch (error) {
      console.log(`❌ Error with model ${model}: ${error.message}`);
      if (error.response) {
        console.log(`📡 Response status: ${error.response.status}`);
        try {
          console.log(
            `📡 Response data: ${JSON.stringify(error.response.data).substring(
              0,
              200
            )}...`
          );
        } catch (e) {
          console.log(`📡 Response data is not JSON serializable`);
        }
      }

      // If we've tried all models and none worked, throw the last error
      if (model === models[models.length - 1]) {
        console.log(
          "❌ All Hugging Face models failed, falling back to local generation"
        );
        throw error;
      }
      // Otherwise try the next model
      console.log(`⏭️ Trying next model...`);
    }
  }

  // If we get here, all models failed
  console.log("❌ All Hugging Face models failed to generate a response");
  throw new Error("All Hugging Face models failed to generate a response");
}

// Endpoint for AI suggestions using Hugging Face Inference API
app.post("/api/ai-suggestion", async (req, res) => {
  console.log("\n🔍 API Request: /api/ai-suggestion");
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
      console.log("🔄 Using cached suggestion");
      // Add artificial delay for cache hit as well to maintain consistent UX
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return res.json({
        suggestion: userData.cachedSuggestions.get(cacheKey),
        meta: { source: "cache" },
      });
    }

    // Check if this is a study tip request (based on the customPrompt content)
    const isStudyTipRequest =
      customPrompt && customPrompt.includes("Generate a concise study tip");

    // Check if this is a progress report request
    const isProgressReport =
      customPrompt &&
      customPrompt.includes(
        "Generate a list of 10 short motivational messages"
      );

    if (isStudyTipRequest) {
      console.log("📚 Request type: Study Tip");
    } else if (isProgressReport) {
      console.log("📊 Request type: Progress Report");
    } else {
      console.log("🗓️ Request type: Regular Suggestion");
    }

    let suggestion;
    let usedHuggingFace = false;
    let huggingFaceModel = null;

    // Add a consistent delay to simulate processing time (improves UX)
    await new Promise((resolve) => setTimeout(resolve, 1200)); // Increased delay to 1.2 seconds

    // Try to get a suggestion from Hugging Face first
    try {
      // Always try Hugging Face first
      const promptToUse =
        customPrompt || generateDefaultPrompt(tasks, studyHabits);
      const huggingFaceResponse = await getHuggingFaceSuggestion(promptToUse);

      suggestion = huggingFaceResponse.text;
      huggingFaceModel = huggingFaceResponse.model;
      usedHuggingFace = true;

      console.log(
        `✅ Successfully used Hugging Face model: ${huggingFaceModel}`
      );
    } catch (error) {
      // If Hugging Face fails, fall back to local generation
      console.log(`❌ Hugging Face API failed: ${error.message}`);
      console.log(`⚙️ Falling back to local suggestion generation`);

      if (isStudyTipRequest) {
        console.log(`📚 Using predefined study tip`);
        suggestion =
          predefinedStudyTips[
            Math.floor(Math.random() * predefinedStudyTips.length)
          ];
      } else if (isProgressReport) {
        console.log(`📊 Generating local progress report`);
        // For progress reports, make sure we include a motivational message
        try {
          // Get the progress data from the request
          const today = new Date();
          const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
          const todayStudyHours =
            studyHabits.studyHoursLog?.find((log) => log.date === todayStr)
              ?.hours || 0;
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

          // Determine progress level based on stats and task history
          let progressLevel = "beginner";
          const streak = studyHabits.streak || 0;
          const totalHours = studyHabits.totalHours || 0;
          const completedTasks = tasks.filter((task) => task.completed).length;

          if (streak > 14 || totalHours > 50 || completedTasks > 30) {
            progressLevel = "advanced";
          } else if (streak > 5 || totalHours > 20 || completedTasks > 10) {
            progressLevel = "intermediate";
          }

          console.log(`👤 User progress level: ${progressLevel}`);

          // Select a random motivational message based on progress level
          let motivationalMessage;
          const noProgressToday =
            todayStudyHours === 0 && totalTasksCompletedToday === 0;

          if (noProgressToday) {
            // For days with no progress, use beginner messages to encourage starting
            console.log(
              `⚠️ No progress detected today, using 'beginner' motivation`
            );
            motivationalMessage =
              progressBasedMessages.beginner[
                Math.floor(
                  Math.random() * progressBasedMessages.beginner.length
                )
              ];
          } else {
            // Use progress level appropriate messages
            console.log(
              `✅ Progress detected today, using '${progressLevel}' motivation`
            );
            const messagesForLevel = progressBasedMessages[progressLevel];
            motivationalMessage =
              messagesForLevel[
                Math.floor(Math.random() * messagesForLevel.length)
              ];
          }

          // Format the progress report with the motivational message - DO NOT include a date in the motivational message
          suggestion = `Here's your progress for today (${todayStr}):\n\n- Total Study Hours Today: ${todayStudyHours} hour${
            todayStudyHours !== 1 ? "s" : ""
          }\n- Tasks Completed Today: ${totalTasksCompletedToday}\n- High Priority Tasks Completed Today: ${highPriorityCompleted}\n- Medium Priority Tasks Completed Today: ${mediumPriorityCompleted}\n- Low Priority Tasks Completed Today: ${lowPriorityCompleted}\n\n${motivationalMessage}`;
        } catch (error) {
          console.log(
            `❌ Error generating local progress report: ${error.message}`
          );
          // Fallback motivational message if there's an error
          const motivationalMessage = predefinedMotivationalMessages[0];
          const today = new Date();
          const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
          suggestion = `Here's your progress for today (${todayStr}):\n\n- Total Study Hours Today: 0 hours\n- Tasks Completed Today: 0\n- High Priority Tasks Completed Today: 0\n- Medium Priority Tasks Completed Today: 0\n- Low Priority Tasks Completed Today: 0\n\n${motivationalMessage}`;
        }
      } else {
        console.log(`🗓️ Generating local task suggestion`);
        // For regular suggestions, use local generation
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
        const filteredTasks = tasks.filter((task) => {
          const isNotCompleted = !task.completed;
          const isDueTodayOrUpcoming =
            new Date(task.dueDate) >= new Date(todayStr);
          return isNotCompleted && isDueTodayOrUpcoming;
        });

        // Get today's study hours from studyHabits
        const todayStudyHours =
          studyHabits.studyHoursLog?.find((log) => log.date === todayStr)
            ?.hours || 0;

        suggestion = generateFallbackSuggestion(
          filteredTasks,
          studyHabits,
          todayStudyHours,
          todayStr
        );
      }
    }

    // Skip validation for customPrompt requests or if it's a study tip
    if (!customPrompt && !isStudyTipRequest) {
      console.log(`🔄 Validating and formatting suggestion`);
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD in IST
      const todayStudyHours =
        studyHabits.studyHoursLog?.find((log) => log.date === todayStr)
          ?.hours || 0;

      const requiredMotivationalMessage =
        "Your dedication and consistency will lead you to success in your field of study. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.";
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
        const isDueTodayOrUpcoming =
          new Date(task.dueDate) >= new Date(todayStr);
        return isNotCompleted && isDueTodayOrUpcoming;
      });

      if (
        filteredTasks.length === 0 &&
        !suggestion.includes("- General Study Tip:")
      ) {
        suggestion = suggestion.replace(
          /- Habits:/,
          `- General Study Tip:\n  - Practice organizing your notes with clear headers and bullet points to make review sessions more efficient. This structure helps your brain categorize information and improves recall during exams.\n- Habits:`
        );
      }
    }

    console.log(`💾 Caching suggestion for future use`);
    await UserData.findOneAndUpdate(
      { userId: "user123" },
      { $set: { [`cachedSuggestions.${cacheKey}`]: suggestion } },
      { upsert: true }
    );

    // Include metadata about whether Hugging Face was used
    console.log(
      `✅ Sending response (source: ${
        usedHuggingFace ? "huggingface" : "local"
      })`
    );
    res.json({
      suggestion,
      meta: {
        source: usedHuggingFace ? "huggingface" : "local",
        model: huggingFaceModel,
      },
    });
  } catch (error) {
    console.log(`❌ API Error: ${error.message}`);
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
- End with a motivational message that is applicable to students in any field, not specific to IT or computing`;
}

// Function to generate a fallback suggestion when API calls fail
function generateFallbackSuggestion(
  tasks,
  studyHabits,
  todayStudyHours,
  todayStr
) {
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
  - Practice organizing your notes with clear headers and bullet points to make review sessions more efficient. This structure helps your brain categorize information and improves recall during exams.
- Habits:
  - Total study hours for today: ${todayStudyHours} hour
  - Your current streak is ${actualStreak} day${actualStreak !== 1 ? "s" : ""}
  - Keep consistent to build your streak and achieve your goals!
Your dedication and consistency will lead you to success in your field of study. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.`;
  }

  // If there are tasks, organize them by priority
  const highPriorityTasks = tasks.filter((task) => task.priority === "High");
  const mediumPriorityTasks = tasks.filter(
    (task) => task.priority === "Medium"
  );
  const lowPriorityTasks = tasks.filter((task) => task.priority === "Low");

  let suggestion = "";

  // Add high priority tasks
  suggestion += "- High Priority:\n";
  if (highPriorityTasks.length > 0) {
    highPriorityTasks.forEach((task) => {
      suggestion += `  - ${task.title} (Hours: ${task.hours || 0}, Due: ${
        task.dueDate
      })\n`;
    });
  } else {
    suggestion += "  - None\n";
  }

  // Add medium priority tasks
  suggestion += "- Medium Priority:\n";
  if (mediumPriorityTasks.length > 0) {
    mediumPriorityTasks.forEach((task) => {
      suggestion += `  - ${task.title} (Hours: ${task.hours || 0}, Due: ${
        task.dueDate
      })\n`;
    });
  } else {
    suggestion += "  - None\n";
  }

  // Add low priority tasks
  suggestion += "- Low Priority:\n";
  if (lowPriorityTasks.length > 0) {
    lowPriorityTasks.forEach((task) => {
      suggestion += `  - ${task.title} (Hours: ${task.hours || 0}, Due: ${
        task.dueDate
      })\n`;
    });
  } else {
    suggestion += "  - None\n";
  }

  // Add habits section
  suggestion += `- Habits:
  - Total study hours for today: ${todayStudyHours} hour
  - Your current streak is ${actualStreak} day${actualStreak !== 1 ? "s" : ""}
  - Keep consistent to build your streak and achieve your goals!
Your dedication and consistency will lead you to success in your field of study. Keep pushing forward and remember that every hour you invest in learning is a step closer to achieving your goals.`;

  return suggestion;
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
