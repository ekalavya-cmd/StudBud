// Updated aiService.js with enhanced Hugging Face model support
export const getStudySuggestion = async ({
  tasks = [],
  studyStats = {},
  customPrompt = "",
} = {}) => {
  try {
    console.log("📱 Client: Requesting AI suggestion...");

    // Make the request to the backend
    const response = await fetch("http://localhost:5000/api/ai-suggestion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tasks,
        studyHabits: studyStats, // Map studyStats to studyHabits to match server.js
        customPrompt: customPrompt || undefined, // Send undefined if customPrompt is empty
      }),
    });

    if (!response.ok) {
      console.error(`📱 Client: Network response error: ${response.status}`);
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error(`📱 Client: API returned an error: ${data.error}`);
      throw new Error(data.error);
    }

    // Log the source of the suggestion (Hugging Face model or local fallback)
    if (data.meta) {
      if (data.meta.source === "huggingface") {
        console.log(
          `📱 Client: Generated using Hugging Face model: ${data.meta.model}`
        );
      } else if (data.meta.source === "cache") {
        console.log(`📱 Client: Retrieved from cache`);
      } else {
        console.log(`📱 Client: Generated using local fallback`);
      }
    }

    return data.suggestion;
  } catch (error) {
    console.error(`📱 Client: Error getting AI suggestion: ${error.message}`);
    // In case of error, return a fallback message
    return "I'm having trouble generating suggestions right now. Please try again later.";
  }
};
