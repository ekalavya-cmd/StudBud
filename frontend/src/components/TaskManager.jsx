import React, { useState } from "react";
import AddTaskForm from "./taskmanager/AddTaskForm";
import SortFilterControls from "./taskmanager/SortFilterControls";
import TaskList from "./taskmanager/TaskList";
import { getCardStyles } from "./utils/themeUtils";

function TaskManager({
  tasks,
  addTask,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  currentTheme,
}) {
  const styles = getCardStyles(currentTheme);
  const [sortBy, setSortBy] = useState("dueDateAsc");
  const [filterBy, setFilterBy] = useState("all");

  const priorityValue = { High: 3, Medium: 2, Low: 1 };

  // Helper function to convert DD-MM-YYYY to Date object for proper sorting
  const parseDate = (ddmmyyyy) => {
    if (!ddmmyyyy) return new Date(0);
    const [day, month, year] = ddmmyyyy.split('-');
    return new Date(year, month - 1, day);
  };

  const sortedAndFilteredTasks = [...tasks]
    .filter((task) => {
      if (filterBy === "completed") return task.completed;
      if (filterBy === "incomplete") return !task.completed;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "dueDateAsc") {
        return parseDate(a.dueDate) - parseDate(b.dueDate);
      } else if (sortBy === "dueDateDesc") {
        return parseDate(b.dueDate) - parseDate(a.dueDate);
      } else if (sortBy === "priorityAsc") {
        return priorityValue[a.priority] - priorityValue[b.priority];
      } else if (sortBy === "priorityDesc") {
        return priorityValue[b.priority] - priorityValue[a.priority];
      }
      return 0;
    });

  return (
    <div className={styles.card}>
      <div className={`p-4 border-b ${styles.border}`}>
        <h2 className={`text-xl font-bold tracking-tight ${styles.title}`}>
          Manage Tasks
        </h2>
      </div>
      <AddTaskForm addTask={addTask} currentTheme={currentTheme} />
      <SortFilterControls
        sortBy={sortBy}
        setSortBy={setSortBy}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        currentTheme={currentTheme}
      />
      <TaskList
        tasks={sortedAndFilteredTasks}
        updateTask={updateTask}
        deleteTask={deleteTask}
        toggleTaskComplete={toggleTaskComplete}
        currentTheme={currentTheme}
      />
    </div>
  );
}

export default TaskManager;
