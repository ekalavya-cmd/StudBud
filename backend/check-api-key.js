// Save this as check-api-key.js in your backend folder
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.HUGGINGFACE_API_KEY;
console.log(`Checking API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`);

// List of models to try
const models = [
  "gpt2",
  "distilbert-base-uncased",
  "bert-base-uncased",
  "t5-small",
  "EleutherAI/gpt-neo-125M"
];

async function checkModel(model) {
  console.log(`Testing model: ${model}`);
  try {
    const response = await axios({
      method: 'post',
      url: `https://api-inference.huggingface.co/models/${model}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      data: {
        inputs: "Hello, I am testing the API.",
        parameters: {
          max_new_tokens: 20,
          do_sample: true,
          temperature: 0.7,
          top_p: 0.9
        }
      },
      timeout: 10000
    });
    
    console.log(`✅ Model ${model} is accessible!`);
    console.log(`Response status: ${response.status}`);
    console.log(`Response data:`, response.data);
    return true;
  } catch (error) {
    console.log(`❌ Failed to access model ${model}`);
    if (error.response) {
      console.log(`Status code: ${error.response.status}`);
      console.log(`Error message:`, error.response.data);
      
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
  console.log("Starting API key verification...");
  console.log("=================================");
  
  let anyModelWorked = false;
  
  for (const model of models) {
    const worked = await checkModel(model);
    if (worked) {
      anyModelWorked = true;
      console.log(`✅ Model ${model} is working with your API key!`);
    }
    console.log("---------------------------------");
  }
  
  if (anyModelWorked) {
    console.log("✅ Your API key is valid and working with at least one model!");
  } else {
    console.log("❌ Your API key couldn't access any of the tested models.");
    console.log("This could be due to:");
    console.log("1. The API key being invalid");
    console.log("2. Rate limiting on your account");
    console.log("3. All tested models being unavailable through the Inference API");
  }
}

main().catch(console.error);