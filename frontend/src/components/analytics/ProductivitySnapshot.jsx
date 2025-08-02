import React from "react";
import { getCardStyles } from "../utils/themeUtils";

function ProductivitySnapshot({ tasks, past7Days, currentTheme }) {
  const styles = getCardStyles(currentTheme);

  // Helper function to format date from yyyy-mm-dd to dd-mm-yyyy
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  // Helper function to convert DD-MM-YYYY to Date object for comparison
  const parseDDMMYYYY = (ddmmyyyy) => {
    if (!ddmmyyyy) return new Date(0);
    const [day, month, year] = ddmmyyyy.split('-');
    return new Date(year, month - 1, day);
  };

  const nonDeletedTasks = tasks.filter((task) => !task.deleted);

  // Get today's date in DD-MM-YYYY format to match database format
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }); // "2025-08-02" 
  
  // Convert to DD-MM-YYYY format for consistent comparison
  const [todayYear, todayMonth, todayDay] = todayStr.split('-');
  const todayDDMMYYYY = `${todayDay}-${todayMonth}-${todayYear}`;
  const todayDateObj = parseDDMMYYYY(todayDDMMYYYY);

  const overdueTasks = nonDeletedTasks.filter(
    (task) => !task.completed && task.dueDate && parseDDMMYYYY(task.dueDate) < todayDateObj
  );
  const incompleteHighPriorityTasks = nonDeletedTasks.filter(
    (task) => !task.completed && task.priority === "High"
  ).length;

  // Calculate completed tasks and total hours per day, with full day names
  const completedTasksByDay = past7Days.map((dayObj) => {
    // Convert YYYY-MM-DD to DD-MM-YYYY for comparison with database dates
    const [year, month, day] = dayObj.date.split('-');
    const ddmmyyyy = `${day}-${month}-${year}`;
    
    const completedTasksOnDay = nonDeletedTasks.filter(
      (task) => task.completed && task.completedDate === ddmmyyyy
    );
    const count = completedTasksOnDay.length;
    const hours = completedTasksOnDay.reduce(
      (sum, task) => sum + (task.hours || 0),
      0
    );
    // Derive the full day name from the date
    const date = new Date(dayObj.date);
    const dayName = date.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Kolkata",
    });
    return {
      day: dayName,
      date: dayObj.date,
      count,
      hours,
    };
  });

  // Find the most productive day(s) by task count, then by least hours
  const maxTasks = Math.max(...completedTasksByDay.map((day) => day.count));
  const daysWithMaxTasks = completedTasksByDay.filter(
    (day) => day.count === maxTasks
  );

  let mostProductiveDays;
  if (daysWithMaxTasks.length === 1) {
    mostProductiveDays = daysWithMaxTasks;
  } else {
    // If multiple days have the same task count, prefer the day with fewer hours
    const minHours = Math.min(...daysWithMaxTasks.map((day) => day.hours));
    mostProductiveDays = daysWithMaxTasks.filter(
      (day) => day.hours === minHours
    );
  }

  // Format the insight message
  let mostProductiveInsight;
  if (maxTasks === 0) {
    mostProductiveInsight =
      "You're just getting started—complete your first task today to build your streak!";
  } else {
    const dayNames =
      mostProductiveDays.length === 1
        ? mostProductiveDays[0].day
        : mostProductiveDays
            .map((day) => day.day)
            .join(", ")
            .replace(/, (?=[^,]*$)/, " and "); // Replace last comma with "and"
    const dates =
      mostProductiveDays.length === 1
        ? formatDateForDisplay(mostProductiveDays[0].date)
        : mostProductiveDays
            .map((day) => formatDateForDisplay(day.date))
            .join(", ")
            .replace(/, (?=[^,]*$)/, " and ");
    mostProductiveInsight = `You're most productive on ${dayNames}, with ${maxTasks} task${
      maxTasks !== 1 ? "s" : ""
    } completed on ${dates}.`;
  }

  const overdueInsight =
    overdueTasks.length > 0
      ? `You have ${overdueTasks.length} overdue task${
          overdueTasks.length !== 1 ? "s" : ""
        }. Focus on completing these to stay on track!`
      : "Great job! You have no overdue tasks.";
  const priorityInsight =
    incompleteHighPriorityTasks > 0
      ? `You have ${incompleteHighPriorityTasks} incomplete high-priority task${
          incompleteHighPriorityTasks !== 1 ? "s" : ""
        }. Prioritize these to maximize your productivity.`
      : "No high-priority tasks pending. Keep up the good work!";

  return (
    <div className={styles.snapshotCard}>
      <h4
        className={`text-lg font-semibold mb-4 tracking-tight ${styles.text}`}
      >
        Productivity Snapshot
      </h4>
      <ul className="space-y-3 text-sm">
        <li className="flex items-start">
          <div className="w-5 h-5 rounded-full bg-green-500 mt-1 mr-3 shadow-sm"></div>
          <p className={`leading-relaxed ${styles.mutedText}`}>
            {mostProductiveInsight}
          </p>
        </li>
        <li className="flex items-start">
          <div className="w-5 h-5 rounded-full bg-yellow-500 mt-1 mr-3 shadow-sm"></div>
          <p className={`leading-relaxed ${styles.mutedText}`}>
            {overdueInsight}
          </p>
        </li>
        <li className="flex items-start">
          <div className="w-5 h-5 rounded-full bg-blue-500 mt-1 mr-3 shadow-sm"></div>
          <p className={`leading-relaxed ${styles.mutedText}`}>
            {priorityInsight}
          </p>
        </li>
      </ul>
    </div>
  );
}

export default ProductivitySnapshot;
