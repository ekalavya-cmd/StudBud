// frontend/src/components/Layout.jsx
import React, { useState, useEffect, useCallback } from "react";
import Header from "./layout/Header";
import Navigation from "./layout/Navigation";
import MainContent from "./layout/MainContent";
import Footer from "./layout/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getStudySuggestion } from "../services/aiService";
import { getCardStyles } from "./utils/themeUtils";

function Layout() {
  // Initialize activeTab from localStorage, default to "dashboard" if not set
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem("activeTab");
    return savedTab || "dashboard";
  });
  const [tasks, setTasks] = useState([]);
  const [studyStats, setStudyStats] = useState({
    totalHours: 0,
    completedTasks: 0,
    streak: 0,
    lastActiveDate: null,
    lastStreakUpdate: null,
    studyHoursLog: [],
  });
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiSuggestionType, setAiSuggestionType] = useState("task");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [points, setPoints] = useState(0);
  const [badges, setBadges] = useState([]);
  const [currentTheme, setCurrentTheme] = useState("Light Mode");
  const [unlockedThemes, setUnlockedThemes] = useState(["Light Mode"]);
  const [loading, setLoading] = useState(true);

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const userId = "demouser";
  const styles = getCardStyles(currentTheme);

  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${day}-${month}-${year}`;
  };

  const getNextTheme = () => {
    if (unlockedThemes.length === 1) {
      return "Light Mode";
    }
    const currentIndex = unlockedThemes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % unlockedThemes.length;
    return unlockedThemes[nextIndex];
  };

  const handleThemeChange = () => {
    const nextTheme = getNextTheme();
    setCurrentTheme(nextTheme);
  };

  const handlePointsUpdate = (newPoints) => {
    setPoints(newPoints);
  };

  const handleThemeUnlock = (themeName) => {
    if (!unlockedThemes.includes(themeName)) {
      setUnlockedThemes([...unlockedThemes, themeName]);
    }
  };

  const updateStreak = (today) => {
    setStudyStats((prev) => {
      const lastActive = prev.lastActiveDate
        ? new Date(prev.lastActiveDate)
        : null;
      const lastStreakUpdate = prev.lastStreakUpdate
        ? new Date(prev.lastStreakUpdate)
        : null;
      const todayDate = new Date(today);

      let newStreak = prev.streak;
      let newLastActiveDate = today;
      let newLastStreakUpdate = prev.lastStreakUpdate;

      const lastActiveDateString = lastActive
        ? getLocalDateString(lastActive)
        : null;
      const lastStreakUpdateDateString = lastStreakUpdate
        ? getLocalDateString(lastStreakUpdate)
        : null;

      if (!lastActive || lastActiveDateString !== today) {
        if (lastActive) {
          const diffTime = todayDate - lastActive;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            newStreak = prev.streak + 1;
            newLastStreakUpdate = today;
          } else if (diffDays > 1) {
            newStreak = 1;
            newLastStreakUpdate = today;
          }
        } else {
          newStreak = 1;
          newLastStreakUpdate = today;
        }
      }

      if (lastStreakUpdate && lastStreakUpdateDateString !== today) {
        const diffTime = todayDate - new Date(lastStreakUpdate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          newStreak = 1;
          newLastStreakUpdate = today;
        }
      }

      const newStats = {
        ...prev,
        streak: newStreak,
        lastActiveDate: newLastActiveDate,
        lastStreakUpdate: newLastStreakUpdate,
        studyHoursLog: prev.studyHoursLog || [],
      };
      return newStats;
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/user/${userId}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch user data: ${response.status}`);
        }
        const data = await response.json();

        const fetchedTasks = (data.tasks || []).map((task) => ({
          ...task,
          pointsAwarded: task.pointsAwarded ?? false,
          hours: task.hours ?? 0,
        }));
        setTasks(fetchedTasks);

        const fetchedStats = {
          totalHours: data.studyStats?.totalHours || 0,
          completedTasks: data.studyStats?.completedTasks || 0,
          streak: data.studyStats?.streak || 0,
          lastActiveDate: data.studyStats?.lastActiveDate || null,
          lastStreakUpdate: data.studyStats?.lastStreakUpdate || null,
          studyHoursLog: data.studyStats?.studyHoursLog || [],
        };
        setStudyStats(fetchedStats);
        setPoints(data.points || 0);
        setBadges(data.badges || []);
        setCurrentTheme(data.currentTheme || "Light Mode");
        setUnlockedThemes(data.unlockedThemes || ["Light Mode"]);

        const today = getLocalDateString(new Date());
        const { lastActiveDate, lastStreakUpdate } = fetchedStats;

        let newStats = { ...fetchedStats };
        if (lastStreakUpdate !== today) {
          if (!lastActiveDate) {
            newStats = {
              ...fetchedStats,
              lastActiveDate: today,
              lastStreakUpdate: today,
              studyHoursLog: fetchedStats.studyHoursLog || [],
            };
          } else {
            const lastDate = new Date(lastActiveDate);
            const currentDate = new Date(today);
            const diffDays = (currentDate - lastDate) / (1000 * 60 * 60 * 24);

            if (diffDays === 1) {
              newStats = {
                ...fetchedStats,
                streak: fetchedStats.streak + 1,
                lastActiveDate: today,
                lastStreakUpdate: today,
                studyHoursLog: fetchedStats.studyHoursLog || [],
              };
            } else if (diffDays > 1) {
              newStats = {
                ...fetchedStats,
                streak: 0,
                lastActiveDate: today,
                lastStreakUpdate: today,
                studyHoursLog: fetchedStats.studyHoursLog || [],
              };
            } else {
              newStats = {
                ...fetchedStats,
                lastStreakUpdate: today,
                studyHoursLog: fetchedStats.studyHoursLog || [],
              };
            }
          }
          setStudyStats(newStats);
        }

        // Direct store of timestamp without using a variable
        localStorage.setItem("lastFetchTimestamp", Date.now().toString());

        setTimeout(async () => {
          const incompleteTasks = fetchedTasks.filter(
            (task) => !task.completed
          );
          if (incompleteTasks.length === 0) {
            setAiSuggestion(
              "Excellent work! You've completed all your tasks. Ready to add something new to your learning journey? I'm here to help you stay on track with your academic goals!"
            );
            setAiSuggestionType("task");
          } else {
            setAiSuggestion(
              "I can see you have some exciting tasks ahead! Whether you want to tackle one of them or add something new, I'm here to support your learning journey. You've got this!"
            );
            setAiSuggestionType("task");
          }
        }, 1000);

        setLoading(false);
      } catch (err) {
        toast.error("Having trouble connecting to your study data. Please refresh and try again.");
        setAiSuggestion("Welcome to StudBud! I'm here to help you stay organized and motivated. Start by adding your first task to begin tracking your academic progress!");
        setAiSuggestionType("task");
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    if (isAiLoading) return;
    if (aiSuggestionType !== "task") return;

    const incompleteTasks = tasks.filter((task) => !task.completed);
    if (incompleteTasks.length === 0) {
      setAiSuggestion(
        "Fantastic! You've cleared your task list. Ready to add your next learning challenge? I'm excited to help you continue growing!"
      );
      setAiSuggestionType("task");
    } else {
      setAiSuggestion(
        "Your learning journey is looking great! I'm here whenever you need study tips, want to complete a task, or add something new to your academic goals."
      );
      setAiSuggestionType("task");
    }
  }, [tasks, isAiLoading, aiSuggestionType]);

  useEffect(() => {
    const completedCount = tasks.filter((task) => task.completed).length;
    setStudyStats((prevStats) => ({
      ...prevStats,
      completedTasks: completedCount,
      studyHoursLog: prevStats.studyHoursLog || [],
    }));
  }, [tasks]);

  const saveUserData = useCallback(async () => {
    try {
      const serializedStudyStats = {
        totalHours: studyStats.totalHours,
        completedTasks: studyStats.completedTasks,
        streak: studyStats.streak,
        lastActiveDate: studyStats.lastActiveDate || null,
        lastStreakUpdate: studyStats.lastStreakUpdate || null,
        studyHoursLog: studyStats.studyHoursLog || [],
      };

      const dataToSend = {
        tasks,
        studyStats: serializedStudyStats,
        points,
        badges,
        themes: [
          "Light Mode",
          "Dark Mode",
          "Ocean Breeze",
          "Sunset Glow",
          "Forest Whisper",
        ],
        currentTheme,
        unlockedThemes,
      };

      const response = await fetch(
        `http://localhost:5000/api/user/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to save user data: ${response.status} - ${await response.text()}`
        );
      }
    } catch (err) {
      toast.error(`Failed to save progress: ${err.message}`);
    }
  }, [tasks, studyStats, points, badges, currentTheme, unlockedThemes]);

  useEffect(() => {
    const debounceSave = setTimeout(() => {
      saveUserData();
    }, 1000);

    return () => clearTimeout(debounceSave);
  }, [tasks, studyStats, points, badges, currentTheme, unlockedThemes, saveUserData]);

  const logStudyHours = (hours) => {
    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) {
      toast.error("Please enter a valid number of hours greater than 0.");
      return;
    }
    const roundedHours = Math.round(parsedHours * 100) / 100;
    const today = getLocalDateString(new Date());
    setStudyStats((prev) => {
      const studyHoursLog = prev.studyHoursLog || [];
      const existingLog = studyHoursLog.find((log) => log.date === today);
      let updatedLog;
      if (existingLog) {
        updatedLog = studyHoursLog.map((log) =>
          log.date === today
            ? {
                ...log,
                hours: Math.round((log.hours + roundedHours) * 100) / 100,
              }
            : log
        );
      } else {
        updatedLog = [...studyHoursLog, { date: today, hours: roundedHours }];
      }
      const newStats = {
        ...prev,
        totalHours: Math.round((prev.totalHours + roundedHours) * 100) / 100,
        studyHoursLog: updatedLog,
      };
      return newStats;
    });
    updateStreak(today);
  };

  const deductStudyHours = (hours, completedDate) => {
    const parsedHours = parseFloat(hours);
    if (isNaN(parsedHours) || parsedHours <= 0) return;
    const roundedHours = Math.round(parsedHours * 100) / 100;
    setStudyStats((prev) => {
      const studyHoursLog = prev.studyHoursLog || [];
      const logDate = completedDate;
      const existingLog = studyHoursLog.find((log) => log.date === logDate);
      let updatedLog;
      if (existingLog) {
        const newHours = Math.max(0, existingLog.hours - roundedHours);
        updatedLog = studyHoursLog
          .map((log) =>
            log.date === logDate
              ? { ...log, hours: Math.round(newHours * 100) / 100 }
              : log
          )
          .filter((log) => log.hours > 0);
      } else {
        updatedLog = studyHoursLog;
      }
      const newTotalHours = Math.max(0, prev.totalHours - roundedHours);
      const newStats = {
        ...prev,
        totalHours: Math.round(newTotalHours * 100) / 100,
        studyHoursLog: updatedLog,
      };
      return newStats;
    });
  };

  // Updated getStudyTips and generateSchedule functions for Layout.jsx

  // Complete and corrected Layout.jsx functions

  const getStudyTips = async () => {
    setIsAiLoading(true);
    setAiSuggestion("Loading a fresh study tip...");
    setAiSuggestionType("loading");
    try {
      const timestamp = Date.now();
      const prompt = {
        tasks: [],
        studyStats: {},
        customPrompt: `You are an expert academic tutor with years of experience helping students across all disciplines achieve their learning goals.

TASK: Create one concise, actionable study tip that can be applied by students in any field of study.

REQUIREMENTS:
- Keep it to 2-3 sentences maximum
- Use clear, simple language
- Focus on a practical technique or strategy
- Make it immediately actionable
- Ensure it works for any subject (science, arts, business, etc.)

OUTPUT FORMAT:
Provide only the study tip without any introductory phrases or labels.

EXAMPLES:
"Use the Feynman Technique: explain concepts in simple terms as if teaching a child. This reveals knowledge gaps and strengthens understanding."

"Study in 25-minute focused blocks with 5-minute breaks. This Pomodoro method matches your brain's attention span and prevents mental fatigue."

Now provide a unique study tip: (Request ID: ${timestamp})`,
      };
      const response = await getStudySuggestion(prompt);

      let studyTip = "Failed to fetch a valid study tip.";
      if (typeof response === "string" && response.trim()) {
        studyTip = response.trim();
        // Clean up any numbering
        studyTip = studyTip.replace(/^\d+\.\s*/, "");
        // Ensure it starts with the expected format
        if (!studyTip.toLowerCase().includes("here's a study tip")) {
          studyTip = `Here's a study tip for students:\n\n- ${studyTip}`;
        }
      } else if (Array.isArray(response) && response.length > 0) {
        studyTip =
          response.find((item) => typeof item === "string" && item.trim()) ||
          studyTip;
        studyTip = studyTip.trim();
        studyTip = studyTip.replace(/^\d+\.\s*/, "");
        if (!studyTip.toLowerCase().includes("here's a study tip")) {
          studyTip = `Here's a study tip for students:\n\n- ${studyTip}`;
        }
      }

      // Extra validation to ensure we never display the error message when we have content
      if (
        studyTip === "Failed to fetch a valid study tip." &&
        typeof response === "string" &&
        response.trim().length > 10
      ) {
        // If we have some substantial content but it didn't match our format expectations,
        // use it anyway with proper formatting
        studyTip = `Here's a study tip for students:\n\n- ${response.trim()}`;
      }

      // Filter out any tech-specific content
      if (
        studyTip.toLowerCase().includes("coding") ||
        studyTip.toLowerCase().includes("programming") ||
        studyTip.toLowerCase().includes("developer") ||
        studyTip.toLowerCase().includes("tech") ||
        studyTip.toLowerCase().includes("it field")
      ) {
        studyTip =
          "Here's a study tip for students:\n\n- Create mind maps to visualize connections between different concepts. This spatial organization helps your brain form meaningful associations and see the bigger picture in complex subjects, from sciences to humanities.";
      }

      setAiSuggestion(studyTip);
      setAiSuggestionType("studyTip");
    } catch (error) {
      setAiSuggestion("I'm having trouble generating a study tip right now. Don't worry though - you've got this! Take a moment to review your notes or try a different study technique while I get back on track.");
      setAiSuggestionType("error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const generateSchedule = async () => {
    setIsAiLoading(true);
    setAiSuggestion("Generating your progress report...");
    setAiSuggestionType("loading");
    try {
      const today = getLocalDateString(new Date());
      const todayStudyHours =
        studyStats.studyHoursLog.find((log) => log.date === today)?.hours || 0;
      const tasksCompletedToday = tasks.filter(
        (task) => task.completed && task.completedDate === today
      );
      const totalTasksCompletedToday = tasksCompletedToday.length;
      
      // Enhanced daily stats
      const highPriorityCompletedToday = tasksCompletedToday.filter(task => task.priority === "High").length;
      const mediumPriorityCompletedToday = tasksCompletedToday.filter(task => task.priority === "Medium").length;
      const lowPriorityCompletedToday = tasksCompletedToday.filter(task => task.priority === "Low").length;
      
      // Calculate points earned today
      const pointsEarnedToday = tasksCompletedToday.reduce((total, task) => {
        return total + (task.priority === "High" ? 30 : task.priority === "Medium" ? 20 : 10);
      }, 0);
      
      // Check remaining tasks for today
      const tasksRemainingToday = tasks.filter(
        (task) => !task.completed && task.dueDate === today
      ).length;
      
      // Check if any badges were earned today (simplified check)
      const currentStreak = studyStats.streak || 0;
      const streakMessage = currentStreak > 0 ? `Current streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}` : "No active streak";

      const timestamp = Date.now();
      const prompt = {
        tasks: [],
        studyStats: {
          todayStudyHours,
          totalTasksCompletedToday,
          streak: studyStats.streak || 0,
          totalHours: studyStats.totalHours || 0,
          completedTasks: tasks.filter((task) => task.completed).length,
        },
        customPrompt: `You are a motivational coach specializing in academic success and student engagement across all fields of study.

TASK: Generate exactly 10 concise motivational messages for a student's daily progress report.

STUDENT'S COMPREHENSIVE ACHIEVEMENTS:
- Study hours completed today: ${todayStudyHours} hours
- Tasks completed today: ${totalTasksCompletedToday} tasks
- Points earned today: ${pointsEarnedToday} points
- Current study streak: ${currentStreak} ${currentStreak === 1 ? 'day' : 'days'}
- Tasks remaining for today: ${tasksRemainingToday}
- Total lifetime study hours: ${studyStats.totalHours || 0} hours
- Total lifetime tasks completed: ${tasks.filter((task) => task.completed).length} tasks
- Total lifetime points: ${points} points

REQUIREMENTS:
- Each message: Maximum 3 sentences, maximum 50 words total
- Reference multiple statistics (daily AND lifetime achievements)
- Be encouraging and highlight both today's progress and cumulative success
- Weave together different stats (hours, tasks, points, streak, totals)
- Applicable to students in any field (science, arts, business, literature, etc.)
- Each message must be unique and varied in approach
- No numbering, bullet points, or labels
- IMPORTANT: Do not include any breakdowns by task priority (High/Medium/Low)
- Make messages substantive but still concise

OUTPUT FORMAT:
Provide exactly 10 messages, each on a separate line, with no additional formatting.

EXAMPLES:
Your ${todayStudyHours} hours of focused study today show real dedication to your goals.
Completing ${totalTasksCompletedToday} tasks demonstrates excellent time management skills.
Every hour you invest in learning brings you closer to mastering your field.

Now generate 10 unique motivational messages: (Request ID: ${timestamp})`,
      };
      const response = await getStudySuggestion(prompt);

      let motivationalMessage;
      if (typeof response === "string") {
        const messages = response
          .split("\n")
          .filter((msg) => msg.trim() !== "");
        motivationalMessage =
          messages.length > 0
            ? messages[0].replace(/^"(.*)"$/, "$1")
            : "Keep up the great effort in your studies!";
      } else if (Array.isArray(response)) {
        motivationalMessage =
          response.length > 0
            ? response[0].replace(/^"(.*)"$/, "$1")
            : "Keep up the great effort in your studies!";
      } else {
        motivationalMessage = "Keep up the great effort in your studies!";
      }

      motivationalMessage = motivationalMessage.replace(/^"(.*)"$/, "$1");
      motivationalMessage = motivationalMessage.replace(/^\d+\.\s*/, "").trim();

      // Make sure the response isn't just "- High Priority:" or another header
      if (
        response === "- High Priority:" ||
        response.trim().startsWith("- High Priority:") ||
        response.trim().startsWith("Here's your progress")
      ) {
        // Determine progress level based on stats
        let progressCategory = "beginner";
        const streak = studyStats.streak || 0;
        const totalHours = studyStats.totalHours || 0;
        const completedTasks = tasks.filter((task) => task.completed).length;

        if (streak > 14 || totalHours > 50 || completedTasks > 30) {
          progressCategory = "advanced";
        } else if (streak > 5 || totalHours > 20 || completedTasks > 10) {
          progressCategory = "intermediate";
        }

        // Use appropriate fallback message based on progress and today's activity
        const noProgressToday =
          todayStudyHours === 0 && totalTasksCompletedToday === 0;

        if (noProgressToday) {
          motivationalMessage =
            "Starting your learning journey is often the hardest part, but you've already taken that crucial first step. Remember that every expert was once a beginner, and your willingness to begin sets you apart from many others. Take pride in your progress today and keep building momentum toward your academic goals!"
        } else if (progressCategory === "beginner") {
          motivationalMessage =
            "Your commitment to learning is truly impressive and shows great character. These early steps you're taking now build the foundation for all your future success and achievements. No matter what field you're studying, this dedication will serve you well throughout your entire academic and professional journey."
        } else if (progressCategory === "intermediate") {
          motivationalMessage =
            "The consistent effort you're showing in your studies demonstrates real dedication and perseverance. This steady progress you're making is exactly how lasting expertise is built in any discipline or field. Your commitment to daily learning will compound over time and lead to remarkable achievements in your chosen area of study."
        } else {
          // advanced
          motivationalMessage =
            "The depth of knowledge you're building through your sustained commitment to learning is truly remarkable and inspiring. Few people achieve this level of dedication and consistency in their studies, which makes your efforts stand out significantly. This exceptional commitment will serve you well throughout your entire life and career, opening doors to opportunities you can't even imagine yet."
        }
      }

      // Ensure we don't accidentally include the date twice
      if (motivationalMessage.includes("progress for today")) {
        motivationalMessage =
          "Your commitment to learning is truly inspiring and demonstrates exceptional character. Keep nurturing your skills and knowledge with the same dedication you've shown so far. With this level of consistency and effort, you'll achieve remarkable results in your field and reach heights you never thought possible."
      }

      // Filter out any references to specific fields like "tech" or "coding"
      if (
        motivationalMessage.includes("coding") ||
        motivationalMessage.includes("programming") ||
        motivationalMessage.includes("tech") ||
        motivationalMessage.includes("IT") ||
        motivationalMessage.includes("developer")
      ) {
        motivationalMessage =
          "Your dedication to learning will open doors to incredible opportunities in your field and beyond. Each study session builds valuable skills and knowledge that will serve you throughout your entire career. Stay focused on your goals and remember that every hour invested in learning is an investment in your future success."
      }

      const progressMessage = `Here's your progress for today (${today}):\n\n📚 Study Hours: ${todayStudyHours} hour${todayStudyHours !== 1 ? "s" : ""}\n✅ Tasks Completed: ${totalTasksCompletedToday}\n${totalTasksCompletedToday > 0 ? `   🔴 High Priority: ${highPriorityCompletedToday}\n   🟡 Medium Priority: ${mediumPriorityCompletedToday}\n   🟢 Low Priority: ${lowPriorityCompletedToday}\n` : ""}🎯 Points Earned: ${pointsEarnedToday}\n🔥 ${streakMessage}\n${tasksRemainingToday > 0 ? `⏰ Tasks Due Today: ${tasksRemainingToday} remaining\n` : "🎉 All today's tasks completed!\n"}\n${motivationalMessage}`;
      setAiSuggestion(progressMessage);
      setAiSuggestionType("progressReport");
    } catch (error) {
      // Create fallback report with actual stats even when AI fails
      const today = getLocalDateString(new Date());
      const todayStudyHours = studyStats.studyHoursLog.find((log) => log.date === today)?.hours || 0;
      const tasksCompletedToday = tasks.filter((task) => task.completed && task.completedDate === today);
      const totalTasksCompletedToday = tasksCompletedToday.length;
      const highPriorityCompletedToday = tasksCompletedToday.filter(task => task.priority === "High").length;
      const mediumPriorityCompletedToday = tasksCompletedToday.filter(task => task.priority === "Medium").length;
      const lowPriorityCompletedToday = tasksCompletedToday.filter(task => task.priority === "Low").length;
      const pointsEarnedToday = tasksCompletedToday.reduce((total, task) => {
        return total + (task.priority === "High" ? 30 : task.priority === "Medium" ? 20 : 10);
      }, 0);
      const tasksRemainingToday = tasks.filter((task) => !task.completed && task.dueDate === today).length;
      const currentStreak = studyStats.streak || 0;
      const streakMessage = currentStreak > 0 ? `Current streak: ${currentStreak} day${currentStreak !== 1 ? 's' : ''}` : "No active streak";
      
      const totalLifetimeHours = studyStats.totalHours || 0;
      const totalLifetimeTasks = tasks.filter((task) => task.completed).length;
      const totalLifetimePoints = points;
      
      const fallbackMessage = `Here's your progress for today (${today}):\n\n📚 Study Hours: ${todayStudyHours} hour${todayStudyHours !== 1 ? "s" : ""}\n✅ Tasks Completed: ${totalTasksCompletedToday}\n${totalTasksCompletedToday > 0 ? `   🔴 High Priority: ${highPriorityCompletedToday}\n   🟡 Medium Priority: ${mediumPriorityCompletedToday}\n   🟢 Low Priority: ${lowPriorityCompletedToday}\n` : ""}🎯 Points Earned: ${pointsEarnedToday}\n🔥 ${streakMessage}\n${tasksRemainingToday > 0 ? `⏰ Tasks Due Today: ${tasksRemainingToday} remaining\n` : "🎉 All today's tasks completed!\n"}\nYour ${todayStudyHours} hours today contribute to your impressive ${totalLifetimeHours} total study hours and demonstrate real commitment to your goals. With ${totalTasksCompletedToday} tasks completed and ${pointsEarnedToday} points earned, you're building toward your ${totalLifetimePoints} lifetime points across ${totalLifetimeTasks} completed tasks. This consistent effort and dedication will lead to remarkable achievements in your field of study.`;
      
      setAiSuggestion(fallbackMessage);
      setAiSuggestionType("error");
    } finally {
      setIsAiLoading(false);
    }
  };

  const addTask = (newTask) => {
    // Convert date from YYYY-MM-DD (HTML date input) to DD-MM-YYYY (database format)
    let formattedDueDate = newTask.dueDate;
    if (newTask.dueDate && newTask.dueDate.includes('-') && newTask.dueDate.split('-')[0].length === 4) {
      const [year, month, day] = newTask.dueDate.split('-');
      formattedDueDate = `${day}-${month}-${year}`;
    }
    
    const task = {
      id: Date.now(),
      ...newTask,
      dueDate: formattedDueDate,
      completedDate: null,
      pointsAwarded: false,
      hours: newTask.hours || 0,
    };
    setTasks([...tasks, task]);
  };

  const deleteTask = (id) => {
    const taskToDelete = tasks.find((task) => task.id === id);
    if (!taskToDelete) return;

    if (taskToDelete.completed) {
      if (taskToDelete.hours > 0 && taskToDelete.completedDate) {
        deductStudyHours(taskToDelete.hours, taskToDelete.completedDate);
      }

      if (taskToDelete.pointsAwarded) {
        const pointsToDeduct =
          taskToDelete.priority === "High"
            ? 30
            : taskToDelete.priority === "Medium"
              ? 20
              : 10;
        setPoints((prevPoints) => prevPoints - pointsToDeduct);
        toast.info(`↩️ -${pointsToDeduct} Points. Task deleted.`, {
          toastId: `delete-task-${id}`,
        });
      }
    }

    setTasks(tasks.filter((task) => task.id !== id));
  };

  const toggleTaskComplete = (id) => {
    const task = tasks.find((task) => task.id === id);
    if (!task) return;

    const today = getLocalDateString(new Date());
    let newPoints = points;
    let newBadges = [...badges];
    let notifications = [];

    const updatedTasks = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            completed: !t.completed,
            completedDate: !t.completed ? today : null,
            pointsAwarded: t.pointsAwarded,
          }
        : t
    );

    const updatedTask = updatedTasks.find((t) => t.id === id);
    const pointsToAddOrDeduct =
      task.priority === "High" ? 30 : task.priority === "Medium" ? 20 : 10;

    if (!task.completed) {
      if (!updatedTask.pointsAwarded) {
        newPoints = points + pointsToAddOrDeduct;
        notifications.push(`🎉 +${pointsToAddOrDeduct} Points! Keep it up!`);
        updatedTask.pointsAwarded = true;
      }

      if (task.hours > 0) {
        logStudyHours(task.hours);
      }

      const highPriorityTasks = updatedTasks.filter(
        (t) => t.priority === "High" && t.completed
      ).length;
      if (highPriorityTasks >= 5 && !badges.includes("Priority Master")) {
        newBadges.push("Priority Master");
        notifications.push("🏆 Badge Earned: Priority Master!");
      }

      const totalCompletedTasks = updatedTasks.filter(
        (t) => t.completed
      ).length;
      if (totalCompletedTasks >= 10 && !badges.includes("Task Titan")) {
        newBadges.push("Task Titan");
        notifications.push("🏆 Badge Earned: Task Titan!");
      }

      // Check for Early Bird badge: tasks completed before their due date
      const earlyTasks = updatedTasks.filter(
        (t) => t.completed && t.completedDate && t.dueDate && t.completedDate < t.dueDate
      ).length;
      if (earlyTasks >= 3 && !badges.includes("Early Bird")) {
        newBadges.push("Early Bird");
        notifications.push("🏆 Badge Earned: Early Bird!");
      }

      updateStreak(today);
    } else {
      if (updatedTask.pointsAwarded) {
        newPoints = points - pointsToAddOrDeduct;
        notifications.push(
          `↩️ -${pointsToAddOrDeduct} Points. Task unmarked as completed.`
        );
        updatedTask.pointsAwarded = false;
      }

      if (task.hours > 0 && task.completedDate) {
        deductStudyHours(task.hours, task.completedDate);
      }
    }

    setTasks(updatedTasks);
    setPoints(newPoints);
    setBadges(newBadges);
    notifications.forEach((msg) => toast.success(msg));
  };

  const updateTask = (updatedTask) => {
    setTasks(
      tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  // Fix for useEffect with missing dependencies
  useEffect(() => {
    if (studyStats.streak >= 7 && !badges.includes("Streak Star")) {
      let newBadges = [...badges, "Streak Star"];
      let newPoints = points + 50;

      setBadges(newBadges);
      setPoints(newPoints);

      toast.success("🏆 Badge Earned: Streak Star!");
      toast.success("🎉 +50 Points for 7-Day Streak!");

      // Save data after awarding streak badge
      const debounceSave = setTimeout(() => {
        saveUserData();
      }, 1000);

      return () => clearTimeout(debounceSave);
    }
  }, [studyStats.streak, badges, points, saveUserData]);

  const nextTheme = getNextTheme();

  return (
    <div className={`min-h-screen flex flex-col ${styles.layoutTheme}`}>
      <ToastContainer />
      <Header
        currentTheme={currentTheme}
        nextTheme={nextTheme}
        onThemeChange={handleThemeChange}
        setActiveTab={setActiveTab}
      />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTheme={currentTheme}
      />
      <MainContent
        activeTab={activeTab}
        loading={loading}
        tasks={tasks}
        studyStats={studyStats}
        aiSuggestion={aiSuggestion}
        getStudyTips={getStudyTips}
        generateSchedule={generateSchedule}
        setActiveTab={setActiveTab}
        toggleTaskComplete={toggleTaskComplete}
        currentTheme={currentTheme}
        logStudyHours={logStudyHours}
        deductStudyHours={deductStudyHours}
        addTask={addTask}
        updateTask={updateTask}
        deleteTask={deleteTask}
        points={points}
        badges={badges}
        onPointsUpdate={handlePointsUpdate}
        onThemeUnlock={handleThemeUnlock}
        unlockedThemes={unlockedThemes}
      />
      <Footer currentTheme={currentTheme} />
    </div>
  );
}

export default Layout;
