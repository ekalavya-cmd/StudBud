// Save this as find-working-models.js in your backend folder
const axios = require('axios');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const apiKey = process.env.HUGGINGFACE_API_KEY;
console.log(`Checking API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

// A more comprehensive list of models to try, including smaller and potentially more accessible ones
const models = [
  // Smaller text generation models
  "distilgpt2",
  "gpt2",
  "EleutherAI/gpt-neo-125m",
  "bigscience/bloom-560m",
  "facebook/opt-125m",
  "bigcode/tiny_starcoder_py",
  
  // Smaller text2text models
  "google/flan-t5-small",
  "facebook/bart-base",
  "t5-small",
  
  // Text classification models
  "distilbert-base-uncased-finetuned-sst-2-english",
  "textattack/bert-base-uncased-SST-2",
  
  // Fill-mask models
  "bert-base-uncased",
  "distilbert-base-uncased",
  "roberta-base",
  
  // Open-source alternatives to larger models
  "Qwen/Qwen1.5-0.5B",
  "databricks/dolly-v2-3b",
  "HuggingFaceH4/zephyr-7b-alpha",
  "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
];

// Keep track of working models
const workingModels = {
  textGeneration: [],
  text2text: [],
  fillMask: [],
  textClassification: []
};

async function testModel(model) {
  console.log(`Testing model: ${model}`);
  
  // Choose appropriate inputs based on model type
  let endpoint = `https://api-inference.huggingface.co/models/${model}`;
  let inputs = "Hello, I am a student studying computer science. I need a study tip.";
  let taskType = "textGeneration"; // Default task type
  
  // Adjust input for certain model types
  if (model.includes("t5") || model.includes("bart")) {
    inputs = "translate English to French: Hello, how are you?";
    taskType = "text2text";
  } else if (model.includes("bert") || model.includes("roberta")) {
    if (model.includes("SST-2") || model.includes("sst-2")) {
      inputs = "I really enjoyed this movie!";
      taskType = "textClassification";
    } else {
      inputs = "The [MASK] is a computer science student.";
      taskType = "fillMask";
    }
  }
  
  try {
    const response = await axios({
      method: 'post',
      url: endpoint,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        inputs: inputs,
        parameters: {
          // Different models may need different parameters
          ...(taskType === "textGeneration" ? {
            max_new_tokens: 30,
            do_sample: true,
            temperature: 0.7,
            top_p: 0.9
          } : {})
        }
      },
      timeout: 15000
    });
    
    console.log(`✅ Model ${model} is accessible!`);
    console.log(`Response status: ${response.status}`);
    console.log(`Response type: ${typeof response.data}`);
    
    // Show a preview of the response
    if (Array.isArray(response.data)) {
      console.log(`Response (array): ${JSON.stringify(response.data.slice(0, 1), null, 2)}`);
    } else if (typeof response.data === 'object') {
      console.log(`Response (object): ${JSON.stringify(response.data, null, 2)}`);
    } else {
      console.log(`Response: ${response.data.substring(0, 100)}...`);
    }
    
    // Add to working models
    workingModels[taskType].push(model);
    return true;
  } catch (error) {
    console.log(`❌ Failed to access model ${model}`);
    if (error.response) {
      console.log(`Status code: ${error.response.status}`);
      if (error.response.data) {
        console.log(`Error message:`, error.response.data);
      }
      
      // Check for rate limiting
      if (error.response.status === 429) {
        console.log("⚠️ API KEY HAS REACHED ITS RATE LIMIT!");
      }
    } else {
      console.log(`Error: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log("Starting comprehensive model testing...");
  console.log("=================================");
  
  for (const model of models) {
    await testModel(model);
    console.log("---------------------------------");
  }
  
  // Save results to a file
  console.log("\nSummary of working models:");
  console.log("=================================");
  
  let summaryText = "# Hugging Face API Working Models\n\n";
  
  for (const [taskType, modelList] of Object.entries(workingModels)) {
    console.log(`\n${taskType} (${modelList.length} working):`);
    summaryText += `\n## ${taskType} (${modelList.length} working)\n\n`;
    
    if (modelList.length > 0) {
      modelList.forEach(model => {
        console.log(`- ${model}`);
        summaryText += `- ${model}\n`;
      });
    } else {
      console.log("No working models found for this task.");
      summaryText += "No working models found for this task.\n";
    }
  }
  
  fs.writeFileSync('working-models.md', summaryText);
  console.log("\nResults saved to working-models.md");
  
  // Determine overall results
  const totalWorkingModels = Object.values(workingModels).flat().length;
  
  if (totalWorkingModels > 0) {
    console.log(`\n✅ Found ${totalWorkingModels} working models you can use!`);
  } else {
    console.log("\n❌ No working models found. Consider using the local solution.");
  }
}

main().catch(console.error);