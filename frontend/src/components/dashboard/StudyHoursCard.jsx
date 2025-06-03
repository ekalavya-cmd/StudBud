import React, { useState } from "react";
import { Clock } from "lucide-react";
import { getCardStyles } from "../utils/themeUtils";

function StudyHoursCard({
  studyStats,
  logStudyHours,
  deductStudyHours,
  currentTheme,
}) {
  const styles = getCardStyles(currentTheme);
  const [hoursInput, setHoursInput] = useState("");

  const handleLogHours = () => {
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours <= 0) {
      return;
    }
    logStudyHours(hours);
    setHoursInput("");
  };

  const handleReduceHours = () => {
    const hours = parseFloat(hoursInput);
    if (isNaN(hours) || hours <= 0) {
      return;
    }
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    }); // YYYY-MM-DD in IST
    deductStudyHours(hours, today);
    setHoursInput("");
  };

  return (
    <div className={`${styles.card} ${styles.hoverShadow} p-6`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-sm font-medium tracking-wide ${styles.subtitle}`}>
          Study Hours
        </h3>
        <Clock className={styles.icon} />
      </div>
      <p className={`text-4xl font-extrabold tracking-tight ${styles.text}`}>
        {studyStats.totalHours}h
      </p>
      <div className="flex mt-5 space-x-3">
        <input
          type="number"
          placeholder="Hours"
          className={`${styles.input} w-24 py-1.5 px-3 text-sm`}
          value={hoursInput}
          onChange={(e) => setHoursInput(e.target.value)}
          min="0"
          step="0.5"
        />
        <button
          onClick={handleLogHours}
          className={`${styles.buttonPrimary} px-4 py-1.5 text-sm`}
        >
          Log Hours
        </button>
        <button
          onClick={handleReduceHours}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold text-white shadow-md transition-all duration-200 transform hover:scale-105 ${
            styles.isDarkMode
              ? "bg-red-600 hover:bg-red-700"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          Reduce Hours
        </button>
      </div>
    </div>
  );
}

export default StudyHoursCard;
