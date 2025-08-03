// Updated aiService.js with Gemini 2.5 Flash Lite integration
export const getStudySuggestion = async ({
  tasks = [],
  studyStats = {},
  customPrompt = "",
} = {}) => {
  try {
    // Make the request to the backend (all AI logging happens on backend)
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
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }

    return data.suggestion;
  } catch (error) {
    // In case of error, return a fallback message
    return "I'm having trouble generating suggestions right now. Please try again later.";
  }
};
