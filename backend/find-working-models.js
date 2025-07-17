// find-working-models.js
// A script to find and test free Hugging Face models for study suggestions

require("dotenv").config();
const axios = require("axios");

// Array of models to test
const modelsToTest = [
  // Text generation models (best for open-ended suggestions)
  { name: "gpt2", type: "text-generation" }, // Very reliable, free to use
  { name: "distilgpt2", type: "text-generation" }, // Faster version of GPT-2
  { name: "EleutherAI/gpt-neo-125M", type: "text-generation" }, // Small but effective
  { name: "bigscience/bloom-560m", type: "text-generation" }, // Multilingual model
  { name: "facebook/opt-125m", type: "text-generation" }, // Meta's OPT model - small version
  { name: "roneneldan/TinyStories-1M", type: "text-generation" }, // Very small but good for simple text

  // Text-to-text generation models (better for structured responses)
  { name: "facebook/bart-base", type: "text2text-generation" }, // Good all-around model
  { name: "facebook/bart-large-cnn", type: "text2text-generation" }, // Better quality but slower
  { name: "t5-small", type: "text2text-generation" }, // Google's T5 model
  { name: "google/flan-t5-small", type: "text2text-generation" }, // Instruction-tuned T5
  { name: "google/flan-t5-base", type: "text2text-generation" }, // Larger instruction-tuned T5

  // Smaller specialized models
  { name: "Xenova/transformers.js-model", type: "text-generation" }, // Designed for browser/Node.js
  { name: "distilbert-base-uncased", type: "fill-mask" }, // Good for completing sentences
  { name: "microsoft/DialoGPT-small", type: "text-generation" }, // Dialog generation
  { name: "facebook/blenderbot-400M-distill", type: "text-generation" }, // Conversational
];

// Test prompts
const testPrompts = [
  {
    name: "Study tip",
    prompt:
      "Create a short, actionable study tip for students to improve learning efficiency.",
  },
  {
    name: "Motivational message",
    prompt:
      "Generate a motivational message for a student who studied for 2 hours today and completed 3 tasks.",
  },
  {
    name: "Study schedule",
    prompt:
      "Create a study schedule for a student with 3 high priority and 2 medium priority tasks.",
  },
];

// Function to test a model with a prompt
async function testModel(model, prompt) {
  try {
    console.log(`Testing ${model.name} with prompt: ${prompt.name}...`);

    // Configure parameters based on model type
    let parameters = {};

    if (model.type === "text-generation") {
      parameters = {
        max_new_tokens: 100,
        temperature: 0.7,
        top_p: 0.9,
        do_sample: true,
        return_full_text: false,
      };
    } else if (model.type === "text2text-generation") {
      parameters = {
        max_length: 100,
        min_length: 20,
        do_sample: true,
        temperature: 0.7,
      };
    } else if (model.type === "fill-mask") {
      // For fill-mask models, we need to use a different approach
      // by including a [MASK] token in the prompt
      prompt.prompt = prompt.prompt.replace(".", " [MASK].");
    }

    const response = await axios({
      method: "post",
      url: `https://api-inference.huggingface.co/models/${model.name}`,
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        inputs: prompt.prompt,
        parameters: parameters,
        options: {
          use_cache: true,
          wait_for_model: true,
        },
      },
      timeout: 30000, // 30 second timeout
    });

    // Extract the generated text based on model type
    let generatedText = "";

    if (model.type === "text-generation") {
      if (Array.isArray(response.data) && response.data.length > 0) {
        generatedText = response.data[0].generated_text || "";
      }
    } else if (model.type === "text2text-generation") {
      if (response.data && response.data.generated_text) {
        generatedText = response.data.generated_text;
      } else if (Array.isArray(response.data) && response.data.length > 0) {
        generatedText = response.data[0].generated_text || "";
      }
    } else if (model.type === "fill-mask") {
      if (Array.isArray(response.data) && response.data.length > 0) {
        generatedText = response.data.map((item) => item.sequence).join(" / ");
      }
    }

    console.log(`✅ SUCCESS for ${model.name}`);
    console.log(
      `Response: ${generatedText.slice(0, 200)}${
        generatedText.length > 200 ? "..." : ""
      }`
    );
    return { success: true, text: generatedText };
  } catch (error) {
    console.log(`❌ FAILED for ${model.name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Function to run all tests and collect results
async function runTests() {
  console.log("=== STARTING MODEL TESTS ===");
  console.log(
    `Testing ${modelsToTest.length} models with ${testPrompts.length} prompts each`
  );

  const results = [];

  for (const model of modelsToTest) {
    const modelResults = {
      name: model.name,
      type: model.type,
      promptResults: [],
    };

    for (const prompt of testPrompts) {
      const result = await testModel(model, prompt);
      modelResults.promptResults.push({
        promptName: prompt.name,
        success: result.success,
        text: result.success ? result.text : result.error,
      });
    }

    // Calculate success rate for this model
    const successCount = modelResults.promptResults.filter(
      (r) => r.success
    ).length;
    modelResults.successRate = (successCount / testPrompts.length) * 100;
    results.push(modelResults);
  }

  // Sort results by success rate
  results.sort((a, b) => b.successRate - a.successRate);

  // Display summary
  console.log("\n=== TEST RESULTS SUMMARY ===");
  results.forEach((model, index) => {
    console.log(
      `${index + 1}. ${model.name} (${model.type}): ${
        model.successRate
      }% success rate`
    );
  });

  console.log("\n=== RECOMMENDED MODELS ===");
  const recommendedModels = results.filter((model) => model.successRate >= 66);
  if (recommendedModels.length > 0) {
    recommendedModels.forEach((model, index) => {
      console.log(
        `${index + 1}. ${model.name} (${model.type}): ${
          model.successRate
        }% success rate`
      );
    });
  } else {
    console.log("No models achieved at least 66% success rate. Best options:");
    results.slice(0, 3).forEach((model, index) => {
      console.log(
        `${index + 1}. ${model.name} (${model.type}): ${
          model.successRate
        }% success rate`
      );
    });
  }

  return results;
}

// Run the tests if this is the main script
if (require.main === module) {
  runTests().catch((error) => {
    console.error("Error running tests:", error);
  });
}

module.exports = { runTests, testModel, modelsToTest, testPrompts };
