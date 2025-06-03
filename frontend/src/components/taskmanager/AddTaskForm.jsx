import React, { useRef } from "react";
import { PlusCircle } from "lucide-react";
import { toast } from "react-toastify";
import { getCardStyles } from "../utils/themeUtils";

function AddTaskForm({ addTask, currentTheme }) {
  const styles = getCardStyles(currentTheme);
  const [newTask, setNewTask] = React.useState({
    title: "",
    dueDate: "",
    priority: "Medium",
    completed: false,
    hours: "",
  });

  const titleInputRef = useRef(null);
  const dueDateInputRef = useRef(null);
  const prioritySelectRef = useRef(null);
  const hoursInputRef = useRef(null);
  const addButtonRef = useRef(null);

  const currentYear = new Date().getFullYear();

  const handleAddTask = () => {
    if (!newTask.title || !newTask.dueDate || !newTask.hours) {
      toast.error(
        "Please fill in all required fields (title, due date, and hours)."
      );
      return;
    }
    const parsedHours = parseFloat(newTask.hours);
    if (isNaN(parsedHours) || parsedHours < 0) {
      toast.error("Please enter a valid number of hours (0 or greater).");
      return;
    }
    addTask({ ...newTask, hours: parsedHours });
    setNewTask({
      title: "",
      dueDate: "",
      priority: "Medium",
      completed: false,
      hours: "",
    });
    titleInputRef.current.focus();
  };

  const validateAndCorrectYear = (dateValue) => {
    if (!dateValue) return;
    const [year, month, day] = dateValue.split("-");
    if (parseInt(year) !== currentYear) {
      const correctedDate = `${currentYear}-${month}-${day}`;
      setNewTask((prev) => ({ ...prev, dueDate: correctedDate }));
      toast.info(`Year corrected to ${currentYear}, the current year.`);
    }
  };

  const handleAddTaskKeyPress = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  return (
    <div className={styles.formSection}>
      <div className="flex flex-wrap md:flex-nowrap gap-3">
        <input
          type="text"
          placeholder="Task title"
          className={`flex-grow ${styles.input}`}
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          onKeyDown={(e) => handleAddTaskKeyPress(e, dueDateInputRef)}
          ref={titleInputRef}
        />
        <input
          type="date"
          className={styles.input}
          value={newTask.dueDate}
          onChange={(e) => {
            const newDate = e.target.value;
            setNewTask({ ...newTask, dueDate: newDate });
            validateAndCorrectYear(newDate);
          }}
          onKeyDown={(e) => handleAddTaskKeyPress(e, prioritySelectRef)}
          ref={dueDateInputRef}
          min={`${currentYear}-01-01`}
          max={`${currentYear}-12-31`}
        />
        <select
          className={styles.input}
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
          onKeyDown={(e) => handleAddTaskKeyPress(e, hoursInputRef)}
          ref={prioritySelectRef}
        >
          <option value="Low">Low Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="High">High Priority</option>
        </select>
        <input
          type="number"
          placeholder="Hours"
          className={styles.input}
          value={newTask.hours}
          onChange={(e) => setNewTask({ ...newTask, hours: e.target.value })}
          onKeyDown={(e) => handleAddTaskKeyPress(e, addButtonRef)}
          ref={hoursInputRef}
          min="0"
          step="0.1"
        />
        <button
          className={`px-4 py-2 ${styles.buttonPrimary}`}
          onClick={handleAddTask}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTask();
            }
          }}
          ref={addButtonRef}
        >
          <PlusCircle className="w-4 h-4 mr-1 inline" /> Add Task
        </button>
      </div>
    </div>
  );
}

export default AddTaskForm;
