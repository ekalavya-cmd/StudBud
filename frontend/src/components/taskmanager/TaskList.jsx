import React, { useRef, useState } from "react";
import { Calendar, CheckCircle, Trash2, Edit3, Save, X } from "lucide-react";
import { toast } from "react-toastify";
import { getCardStyles } from "../utils/themeUtils";

function TaskList({
  tasks,
  updateTask,
  deleteTask,
  toggleTaskComplete,
  currentTheme,
}) {
  const styles = getCardStyles(currentTheme);
  const [editingTask, setEditingTask] = useState(null);
  const [hasInteractedWithDate, setHasInteractedWithDate] = useState(false);

  const editTitleInputRef = useRef(null);
  const editDueDateInputRef = useRef(null);
  const editPrioritySelectRef = useRef(null);
  const editHoursInputRef = useRef(null);
  const saveButtonRef = useRef(null);

  const currentYear = new Date().getFullYear();

  // Helper function to format date - already in DD-MM-YYYY format from database
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    // Database already stores in DD-MM-YYYY format, so return as-is
    return dateString;
  };

  // Helper function to convert DD-MM-YYYY to YYYY-MM-DD for HTML date input
  const convertToHTMLDateFormat = (ddmmyyyy) => {
    if (!ddmmyyyy) return '';
    const [day, month, year] = ddmmyyyy.split('-');
    return `${year}-${month}-${day}`;
  };

  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) {
      return false;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return false;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    return (
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day
    );
  };

  const handleStartEdit = (task) => {
    if (task.completed) {
      toast.info("Cannot edit a completed task.");
      return;
    }
    // Convert DD-MM-YYYY to YYYY-MM-DD for HTML date input
    const htmlFormatDate = convertToHTMLDateFormat(task.dueDate);
    setEditingTask({ ...task, dueDate: htmlFormatDate, hours: task.hours || 0 });
    setHasInteractedWithDate(false);
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;

    if (
      hasInteractedWithDate &&
      (editingTask.dueDate === "" || !isValidDate(editingTask.dueDate))
    ) {
      toast.error("Invalid due date. Please enter a valid date.");
      return;
    }

    if (
      !editingTask.title ||
      !editingTask.dueDate ||
      editingTask.hours === ""
    ) {
      toast.error(
        "Please fill in all required fields (title, due date, and hours)."
      );
      return;
    }

    const parsedHours = parseFloat(editingTask.hours);
    if (isNaN(parsedHours) || parsedHours < 0) {
      toast.error("Please enter a valid number of hours (0 or greater).");
      return;
    }

    // Convert date from YYYY-MM-DD (HTML date input) to DD-MM-YYYY (database format)
    let formattedDueDate = editingTask.dueDate;
    if (editingTask.dueDate && editingTask.dueDate.includes('-') && editingTask.dueDate.split('-')[0].length === 4) {
      const [year, month, day] = editingTask.dueDate.split('-');
      formattedDueDate = `${day}-${month}-${year}`;
    }
    
    updateTask({ ...editingTask, dueDate: formattedDueDate, hours: parsedHours });
    setEditingTask(null);
    setHasInteractedWithDate(false);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setHasInteractedWithDate(false);
  };

  const validateAndCorrectYear = (dateValue) => {
    if (!dateValue || !isValidDate(dateValue)) return;
    const [year, month, day] = dateValue.split("-");
    const inputYear = parseInt(year);
    
    // Only warn for past years, allow future years
    if (inputYear < currentYear) {
      const correctedDate = `${currentYear}-${month}-${day}`;
      setEditingTask((prev) => ({ ...prev, dueDate: correctedDate }));
      toast.info(`Year corrected to ${currentYear}. Past years are not allowed.`);
    }
  };

  const handleEditTaskKeyPress = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  const handleDeleteTaskWithConfirmation = (task) => {
    const message = task.completed
      ? `Are you sure? Deleting "${task.title}" will remove all progress (points, hours).`
      : `Are you sure you want to delete "${task.title}"?`;

    toast.warn(
      ({ closeToast }) => (
        <div>
          <p>{message}</p>
          <div className="mt-2 flex space-x-2">
            <button
              onClick={() => {
                deleteTask(task.id);
                closeToast();
              }}
              className={styles.buttonDeleteToastConfirm}
            >
              Yes, Delete
            </button>
            <button
              onClick={closeToast}
              className={styles.buttonDeleteToastCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        toastId: `delete-confirm-${task.id}`,
      }
    );
  };

  const customStyles = `
    .task-card:hover .calendar-icon {
      transform: scale(1) !important;
    }
    input[type="date"] {
      padding-right: 8px;
    }
    input[type="date"]::-webkit-calendar-picker-indicator {
      ${currentTheme === "Dark Mode" ? `
        filter: invert(1);
        opacity: 0.8;
      ` : ""}
      cursor: pointer;
      margin-left: 4px;
    }
  `;

  return (
    <div className={`divide-y ${styles.divider}`}>
      <style>{customStyles}</style>
      {tasks.length === 0 ? (
        <div className={`py-12 text-center ${styles.noTasksText}`}>
          No tasks to display. Add a new task to get started!
        </div>
      ) : (
        tasks.map((task) => (
          <div
            key={task.id}
            className={`p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${styles.hoverCard} task-card`}
          >
            {editingTask && editingTask.id === task.id ? (
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  className={`flex-grow ${styles.input}`}
                  value={editingTask.title}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  onKeyDown={(e) =>
                    handleEditTaskKeyPress(e, editDueDateInputRef)
                  }
                  ref={editTitleInputRef}
                />
                <input
                  type="date"
                  className={styles.input}
                  value={editingTask.dueDate}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    setEditingTask({ ...editingTask, dueDate: newDate });
                    setHasInteractedWithDate(true);
                    validateAndCorrectYear(newDate);
                  }}
                  onKeyDown={(e) =>
                    handleEditTaskKeyPress(e, editPrioritySelectRef)
                  }
                  ref={editDueDateInputRef}
                  min={`${currentYear}-01-01`}
                />
                <select
                  className={styles.input}
                  value={editingTask.priority}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, priority: e.target.value })
                  }
                  onKeyDown={(e) =>
                    handleEditTaskKeyPress(e, editHoursInputRef)
                  }
                  ref={editPrioritySelectRef}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
                <input
                  type="number"
                  className={styles.input}
                  value={editingTask.hours}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, hours: e.target.value })
                  }
                  onKeyDown={(e) => handleEditTaskKeyPress(e, saveButtonRef)}
                  ref={editHoursInputRef}
                  min="0"
                  step="0.1"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveEdit}
                    className={styles.buttonSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                    }}
                    ref={saveButtonRef}
                  >
                    <Save className="w-4 h-4 mr-1 inline" /> Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className={styles.buttonCancel}
                  >
                    <X className="w-4 h-4 mr-1 inline" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center space-x-3 flex-grow cursor-pointer"
                  onClick={() => toggleTaskComplete(task.id)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTaskComplete(task.id);
                    }}
                    className={`p-1 rounded-full transition-all duration-200 ${
                      task.completed
                        ? styles.taskComplete
                        : styles.taskIncomplete
                    }`}
                  >
                    <CheckCircle
                      className={`w-5 h-5 ${task.completed ? "fill-current" : ""}`}
                    />
                  </button>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3
                        className={`text-base font-semibold ${
                          task.completed
                            ? `line-through ${styles.completedText}`
                            : styles.text
                        }`}
                      >
                        {task.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === "High"
                            ? styles.isDarkMode
                              ? "bg-red-600 text-white"
                              : "bg-red-500 text-white"
                            : task.priority === "Medium"
                              ? styles.isDarkMode
                                ? "bg-orange-600 text-white"
                                : "bg-orange-500 text-white"
                              : styles.isDarkMode
                                ? "bg-green-600 text-white"
                                : "bg-green-500 text-white"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div>
                      <p
                        className={`text-sm flex items-center space-x-1 ${styles.secondaryText}`}
                      >
                        <Calendar
                          className={`${styles.smallIcon} calendar-icon`}
                        />
                        <span>Due: {formatDateForDisplay(task.dueDate)}</span>
                        <span className="ml-2">Hours: {task.hours || 0}</span>
                      </p>
                      {task.completed && task.completedDate && (
                        <p className={`text-xs mt-1 flex items-center space-x-1 ${styles.mutedText}`}>
                          <span className={`${styles.smallIcon}`}></span>
                          <span>Completed on: {formatDateForDisplay(task.completedDate)}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(task);
                    }}
                    className={`${styles.editButton} ${
                      task.completed ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    disabled={task.completed}
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTaskWithConfirmation(task);
                    }}
                    className={styles.deleteButton}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default TaskList;
