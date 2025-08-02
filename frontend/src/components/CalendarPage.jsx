// frontend/src/components/CalendarPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Calendar from "react-calendar";
import {
  CheckCircle,
  Calendar as CalendarIcon,
  PlusCircle,
} from "lucide-react";
import { getCardStyles } from "../components/utils/themeUtils";

function CalendarPage({
  tasks,
  toggleTaskComplete,
  currentTheme,
  setActiveTab,
}) {
  const styles = getCardStyles(currentTheme);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const today = new Date(); // Store today's date for comparison

  // Function to get local date string in YYYY-MM-DD format with timezone normalization
  const getLocalDateString = useCallback((date) => {
    try {
      if (!date || isNaN(new Date(date).getTime())) {
        console.warn('Invalid date provided to getLocalDateString:', date);
        return null;
      }
      const normalizedDate = new Date(date);
      // Normalize to local timezone to avoid UTC/local time issues
      const year = normalizedDate.getFullYear();
      const month = String(normalizedDate.getMonth() + 1).padStart(2, "0");
      const day = String(normalizedDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  }, []);

  // Handle date selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Reset selectedDate to today when clicking outside relevant areas
  const handleClickOutside = useCallback((event) => {
    const calendarElement = document.querySelector(".react-calendar");
    const isClickInsideCalendar =
      calendarElement && calendarElement.contains(event.target);

    // Check if the click is on a date tile
    const isTileClick = event.target.closest(".react-calendar__tile");

    // Check if the click is on a task card (including the checkmark button)
    const isTaskCardClick = event.target.closest(".task-card");

    // Reset to today if the click is outside calendar and not on task cards
    if (!isClickInsideCalendar && !isTaskCardClick && !isTileClick) {
      setSelectedDate(new Date());
    }
  }, []);

  // Add and remove the click event listener
  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // Filter tasks for the selected date (both completed and incomplete)
  const tasksForSelectedDate = useMemo(() => {
    const selectedDateString = getLocalDateString(selectedDate);
    if (!selectedDateString) return [];
    
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDueDate = getLocalDateString(new Date(task.dueDate));
      return taskDueDate === selectedDateString;
    }).sort((a, b) => {
      // Sort by completion status (incomplete first) then by priority
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const priorityOrder = { High: 0, Medium: 1, Low: 2 };
      return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
    });
  }, [tasks, selectedDate, getLocalDateString]);

  // Check if the selected date is today
  const isSelectedDateToday = useMemo(() => {
    const selectedDateString = getLocalDateString(selectedDate);
    const todayString = getLocalDateString(today);
    return selectedDateString === todayString;
  }, [selectedDate, today, getLocalDateString]);

  // Define gradient styles for each theme based on themeUtils.js
  const getThemeGradient = useCallback((type) => {
    const gradients = {
      "Dark Mode": {
        current: isSelectedDateToday
          ? "linear-gradient(135deg, #1E40AF, #1976D2)"
          : "linear-gradient(135deg, #1976D2, #60A5FA)",
        selected: "linear-gradient(135deg, #1E40AF, #1976D2)"
      },
      "Ocean Breeze": {
        current: "linear-gradient(135deg, #A5F3FC, #22D3EE)",
        selected: "linear-gradient(135deg, #5EEAD4, #14B8A6)"
      },
      "Sunset Glow": {
        current: "linear-gradient(135deg, #FED7AA, #FDBA74)",
        selected: "linear-gradient(135deg, #FCA5A5, #F87171)"
      },
      "Forest Whisper": {
        current: "linear-gradient(135deg, #BBF7D0, #86EFAC)",
        selected: "linear-gradient(135deg, #6EE7B7, #10B981)"
      },
      "Light Mode": {
        current: "linear-gradient(135deg, #C7D2FE, #A5B4FC)",
        selected: "linear-gradient(135deg, #818CF8, #4F46E5)"
      }
    };
    
    return gradients[currentTheme]?.[type] || gradients["Light Mode"][type];
  }, [currentTheme, isSelectedDateToday]);

  // Memoized custom styles for the calendar, including theme-based gradients
  const calendarStyles = useMemo(() => `
    .react-calendar {
      margin-left: 25px;
    }
    .react-calendar__navigation button {
      font-size: 1.25rem;
    }
    .dark-mode-calendar {
      background-color: #1F2937; /* bg-gray-800 */
      color: #ffffff; /* Default text to white */
      border-radius: 0.75rem; /* Match rounded-xl from styles.card */
    }
    .dark-mode-calendar .react-calendar__navigation {
      background-color: #1F2937; /* bg-gray-800 */
      margin-bottom: 0.5rem;
    }
    .dark-mode-calendar .react-calendar__navigation button {
      color: #ffffff; /* Navigation arrows and labels to white */
      background: none;
      font-size: 1.25rem; /* Increase navigation button font size */
    }
    .dark-mode-calendar .react-calendar__navigation button:hover,
    .dark-mode-calendar .react-calendar__navigation button:focus {
      background: #374151; /* bg-gray-700 on hover/focus */
    }
    .dark-mode-calendar .react-calendar__month-view__weekdays__weekday {
      color: #ffffff; /* Days of the week to white */
      font-size: 1.1rem; /* Increase weekday label font size */
    }
    .dark-mode-calendar .react-calendar__month-view__days__day {
      color: #ffffff; /* Current month's dates to white */
      font-size: 1.1rem; /* Increase date font size */
    }
    .dark-mode-calendar .react-calendar__month-view__days__day--weekend {
      color: #d10000; /* Match the default red shade used in other themes */
    }
    .dark-mode-calendar .react-calendar__month-view__days__day--neighboringMonth {
      color: #9CA3AF; /* Gray-400 for previous/next month dates (default) */
    }
    .dark-mode-calendar .react-calendar__tile--active,
    .dark-mode-calendar .react-calendar__tile--active:hover,
    .dark-mode-calendar .react-calendar__tile--hasActive {
      background: ${getThemeGradient("selected")} !important;
      color: #ffffff !important;
    }
    .dark-mode-calendar .react-calendar__tile:hover {
      background: #374151; /* bg-gray-700 on hover */
    }
    .react-calendar {
      width: 100%; /* Ensure calendar takes full width of its container */
    }
    .react-calendar__tile {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 48px; /* Increase tile height for larger size */
      font-size: 1.1rem; /* Increase tile font size */
    }
    .task-dot {
      position: absolute;
      bottom: 2px;
      width: 10px; /* Slightly increase dot size for proportionality */
      height: 10px;
      border-radius: 50%;
      ${currentTheme === "Dark Mode" ? "background-color: #6366F1;" : ""}
      ${currentTheme === "Ocean Breeze" ? "background-color: #14B8A6;" : ""}
      ${currentTheme === "Sunset Glow" ? "background-color: #F97316;" : ""}
      ${currentTheme === "Forest Whisper" ? "background-color: #10B981;" : ""}
      ${currentTheme === "Light Mode" ? "background-color: #4F46E5;" : ""}
    }
    .react-calendar__tile--now {
      background: ${getThemeGradient("current")} !important;
      color: ${currentTheme === "Dark Mode" ? "#ffffff" : "#000000"} !important;
    }
    .dark-mode-calendar .react-calendar__tile--now {
      background: ${getThemeGradient("current")} !important;
      color: #ffffff !important;
    }
    .react-calendar__tile--active,
    .react-calendar__tile--active:hover,
    .react-calendar__tile--hasActive {
      background: ${getThemeGradient("selected")} !important;
      color: #ffffff !important;
    }
    .react-calendar__tile:hover {
      background: ${
        currentTheme === "Dark Mode"
          ? "#374151"
          : currentTheme === "Ocean Breeze"
            ? "#E5F6F5"
            : currentTheme === "Sunset Glow"
              ? "#FEF3E8"
              : currentTheme === "Forest Whisper"
                ? "#E8F8EF"
                : "#E8F0FE"
      }; /* Light hover effect matching each theme */
    }
    .react-calendar__tile--now:hover {
      background: ${getThemeGradient("current")} !important;
      filter: brightness(1.1); /* Slightly brighten on hover */
    }
    .dark-mode-calendar .react-calendar__tile--now:hover {
      background: ${getThemeGradient("current")} !important;
      filter: brightness(1.1);
    }
    .react-calendar__navigation {
      margin-bottom: 0.5rem;
    }
    .react-calendar__month-view__weekdays__weekday {
      font-size: 1.1rem; /* Increase weekday label font size for all themes */
    }
    .react-calendar__month-view__days__day {
      font-size: 1.1rem; /* Increase date font size for all themes */
    }
    .task-card:hover .calendar-icon {
      transform: scale(1) !important; /* Prevent scaling on hover */
    }
  `, [currentTheme, getThemeGradient]);

  return (
    <div className="space-y-6">
      <h2 className={`text-2xl font-bold ${styles.title}`}>Calendar</h2>
      <div className="grid grid-cols-1 gap-6">
        <div className="flex justify-center">
          <div className="max-w-xl w-full">
            <style>{calendarStyles}</style>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              className={`${styles.card} p-4 border-none ${
                currentTheme === "Dark Mode" ? "dark-mode-calendar" : ""
              }`}
              aria-label="Task calendar - select a date to view tasks"
              navigationLabel={({ date, label, locale, view }) => 
                `Navigate calendar: ${label}`
              }
              next2Label="Go to next year"
              nextLabel="Go to next month"
              prev2Label="Go to previous year"
              prevLabel="Go to previous month"
              tileContent={({ date }) => {
                const dateString = getLocalDateString(date);
                if (!dateString) return null;
                
                const dayTasks = tasks.filter((task) => {
                  if (!task.dueDate) return false;
                  const taskDueDate = getLocalDateString(new Date(task.dueDate));
                  return taskDueDate === dateString;
                });
                
                if (dayTasks.length === 0) return null;
                
                const hasIncomplete = dayTasks.some(task => !task.completed);
                const hasCompleted = dayTasks.some(task => task.completed);
                
                return (
                  <div className="task-indicators" style={{ position: 'absolute', bottom: '2px', display: 'flex', gap: '2px', justifyContent: 'center' }}>
                    {hasIncomplete && (
                      <div 
                        className="task-dot task-dot-incomplete" 
                        style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          backgroundColor: currentTheme === "Dark Mode" ? "#6366F1" : 
                                         currentTheme === "Ocean Breeze" ? "#14B8A6" : 
                                         currentTheme === "Sunset Glow" ? "#F97316" : 
                                         currentTheme === "Forest Whisper" ? "#10B981" : "#4F46E5"
                        }}
                        title={`${dayTasks.filter(t => !t.completed).length} incomplete task(s)`}
                      />
                    )}
                    {hasCompleted && (
                      <div 
                        className="task-dot task-dot-complete" 
                        style={{ 
                          width: '6px', 
                          height: '6px', 
                          borderRadius: '50%', 
                          backgroundColor: '#10B981',
                          opacity: 0.7
                        }}
                        title={`${dayTasks.filter(t => t.completed).length} completed task(s)`}
                      />
                    )}
                  </div>
                );
              }}
            />
          </div>
        </div>
        <div className="md:col-span-3">
          <div className={`${styles.card} p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${styles.subtitle}`}>
              Tasks for{" "}
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h3>
            {tasksForSelectedDate.length === 0 ? (
              <div>
                <p className={`py-4 text-center ${styles.noTasksText}`}>
                  No tasks for this date.
                </p>
                <div className={`p-5 border-t ${styles.border}`}>
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className={styles.buttonTertiary}
                    aria-label="Navigate to tasks page to add a new task"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" aria-hidden="true" />
                    Add New Task
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {tasksForSelectedDate.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${styles.hoverCard} task-card`}
                  >
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleTaskComplete(task.id)}
                        className={`p-1 rounded-full transition-all duration-200 ${
                          task.completed
                            ? styles.taskComplete
                            : styles.taskIncomplete
                        }`}
                        aria-label={`Mark task "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                      >
                        <CheckCircle
                          className={`w-5 h-5 ${
                            task.completed ? "fill-current" : ""
                          }`}
                        />
                      </button>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3
                            className={`text-base font-semibold ${
                              task.completed 
                                ? `${styles.text} line-through opacity-60` 
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
                        <p
                          className={`text-sm flex items-center space-x-1 ${styles.secondaryText}`}
                        >
                          <CalendarIcon
                            className={`${styles.smallIcon} calendar-icon`}
                            aria-hidden="true"
                          />
                          <span>Due: {task.dueDate}</span>
                          <span className="ml-2">Hours: {task.hours || 0}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;