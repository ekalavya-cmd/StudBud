import React from "react";
import { getCardStyles } from "../utils/themeUtils";

function ProductivitySnapshot({ tasks, past7Days, currentTheme }) {
  const styles = getCardStyles(currentTheme);

  const nonDeletedTasks = tasks.filter((task) => !task.deleted);

  // Ensure todayStr is in IST
  const today = new Date();
  const todayStr = today.toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  }); // "2025-06-03"

  const overdueTasks = nonDeletedTasks.filter(
    (task) => !task.completed && task.dueDate && task.dueDate < todayStr
  );
  const incompleteHighPriorityTasks = nonDeletedTasks.filter(
    (task) => !task.completed && task.priority === "High"
  ).length;

  const completedTasksByDay = past7Days.map((dayObj) => {
    const count = nonDeletedTasks.filter(
      (task) => task.completed && task.completedDate === dayObj.date
    ).length;
    return {
      day: dayObj.day,
      date: dayObj.date,
      count,
    };
  });

  const mostProductiveDay = completedTasksByDay.reduce(
    (max, day) => (day.count > max.count ? day : max),
    { day: "", date: "", count: 0 }
  );

  const mostProductiveInsight =
    mostProductiveDay.count > 0
      ? `You're most productive on ${mostProductiveDay.day}s, with ${
          mostProductiveDay.count
        } task${mostProductiveDay.count !== 1 ? "s" : ""} completed on ${
          mostProductiveDay.date
        }.`
      : "You're just getting started—complete your first task today to build your streak!";
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
