// Updated aiService.js with loading states
export const getStudySuggestion = async ({
  tasks = [],
  studyStats = {},
  customPrompt = "",
} = {}) => {
  try {
    // Add loading state indicators in the console for debugging
    console.log("Requesting AI suggestion...");
    
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
      console.error(`Network response error: ${response.status}`);
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      console.error("API returned an error:", data.error);
      throw new Error(data.error);
    }

    // Add debugging log to see the raw response
    console.log("Raw API response:", data.suggestion);
    
    return data.suggestion;
  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    return "I'm having trouble generating suggestions right now. Please try again later.";
  }
};