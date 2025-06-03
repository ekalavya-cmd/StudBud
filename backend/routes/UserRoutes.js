const express = require("express");
const router = express.Router();
const UserData = require("../models/UserData");

// Helper function to get the current date in IST as YYYY-MM-DD
const getISTDateString = () => {
  const date = new Date();
  return date.toISOString().split("T")[0]; // YYYY-MM-DD in IST (since TZ is set to Asia/Kolkata)
};

// GET user data
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const userData = await UserData.findOne({ userId });
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(userData);
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// PUT to update user data
router.put("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { tasks, studyStats, points, badges, currentTheme } = req.body;

    // Ensure any date fields in the update are in IST
    if (studyStats) {
      if (studyStats.lastActiveDate) {
        studyStats.lastActiveDate = new Date(studyStats.lastActiveDate)
          .toISOString()
          .split("T")[0];
      }
      if (studyStats.lastStreakUpdate) {
        studyStats.lastStreakUpdate = new Date(studyStats.lastStreakUpdate)
          .toISOString()
          .split("T")[0];
      }
      if (studyStats.studyHoursLog) {
        studyStats.studyHoursLog = studyStats.studyHoursLog.map((log) => ({
          ...log,
          date: new Date(log.date).toISOString().split("T")[0],
        }));
      }
    }

    if (tasks) {
      tasks.forEach((task) => {
        if (task.dueDate) {
          task.dueDate = new Date(task.dueDate).toISOString().split("T")[0];
        }
        if (task.completedDate) {
          task.completedDate = new Date(task.completedDate)
            .toISOString()
            .split("T")[0];
        }
      });
    }

    const updatedData = await UserData.findOneAndUpdate(
      { userId },
      { tasks, studyStats, points, badges, currentTheme },
      { new: true, upsert: true }
    );

    res.status(200).json(updatedData);
  } catch (err) {
    console.error("Error saving user data:", err);
    res.status(500).json({ error: "Failed to save user data" });
  }
});

module.exports = router;
