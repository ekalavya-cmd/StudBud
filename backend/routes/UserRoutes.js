const express = require("express");
const router = express.Router();
const UserData = require("../models/UserData");

// Helper function to get the current date in IST as DD-MM-YYYY
const getISTDateString = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}-${month}-${year}`; // DD-MM-YYYY in IST (since TZ is set to Asia/Kolkata)
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

    // Ensure any date fields in the update are in DD-MM-YYYY format
    if (studyStats) {
      if (studyStats.lastActiveDate) {
        const date = new Date(studyStats.lastActiveDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        studyStats.lastActiveDate = `${day}-${month}-${year}`;
      }
      if (studyStats.lastStreakUpdate) {
        const date = new Date(studyStats.lastStreakUpdate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        studyStats.lastStreakUpdate = `${day}-${month}-${year}`;
      }
      if (studyStats.studyHoursLog) {
        studyStats.studyHoursLog = studyStats.studyHoursLog.map((log) => {
          const date = new Date(log.date);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return {
            ...log,
            date: `${day}-${month}-${year}`,
          };
        });
      }
    }

    if (tasks) {
      tasks.forEach((task) => {
        if (task.dueDate) {
          const date = new Date(task.dueDate);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          task.dueDate = `${day}-${month}-${year}`;
        }
        if (task.completedDate) {
          const date = new Date(task.completedDate);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          task.completedDate = `${day}-${month}-${year}`;
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
