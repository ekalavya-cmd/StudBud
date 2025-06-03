# StudBud 

StudBud is an AI-powered study planner designed to help students manage their study schedules, track their progress, and stay motivated. It offers a range of features including task management, study analytics, a rewards system, and AI-generated study suggestions to enhance productivity and learning efficiency.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Task Management**: Add, edit, delete, and mark tasks as complete. Tasks can have priorities, due dates, and associated study hours.
- **Study Analytics**: Visualize task completion rates, study hours trends, priority breakdown and productivity snapshots.
- **Rewards System**: Earn points and badges for completing tasks and maintaining study streaks. Redeem points for different themes.
- **AI Study Assistant**: Get personalized study suggestions and motivational messages powered by AI.
- **Calendar View**: View tasks on a calendar and manage them by date.
- **Theme Customization**: Switch between different themes to personalize the user interface.

## Technologies Used

- **Frontend**:
  - React.js
  - Tailwind CSS
  - Lucide React for icons
  - React Calendar
  - React Toastify for notifications
- **Backend**:
  - Node.js with Express.js
  - MongoDB with Mongoose
  - Hugging Face Inference API for AI suggestions
- **Other Tools**:
  - ESLint and Prettier for code linting and formatting
  - Nodemon for development

## Setup Instructions

Follow these steps to set up the project locally:

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Hugging Face API Key (for AI suggestions)

### Clone the Repository

```bash
git clone https://github.com/ekalavya-cmd/StudBud.git
cd StudBud
```

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:

   ```env
   MONGO_URI=mongodb://localhost:27017/studyBuddy
   PORT=5000
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   TZ=Asia/Kolkata
   ```
4. Start the backend server:

   ```bash
   node server.js
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```
2. Install dependencies:

   ```bash
   npm install
   ```
3. Start the frontend development server:

   ```bash
   npm start
   ```

### Access the Application

- Open your browser and go to `http://localhost:3000`

## Usage

- **Dashboard**: View AI suggestions, study hours, tasks completed, and study streak.
- **Tasks**: Manage your study tasks with options to add, edit, delete, and mark as complete.
- **Analytics**: Analyze your study patterns with various charts and graphs.
- **Rewards**: Check your points, badges, and redeem themes.
- **Calendar**: View and manage tasks on a calendar interface.

## API Documentation

The backend provides the following key API endpoints:

- **GET /api/user/:userId**: Fetch user data.
- **POST /api/user/:userId**: Save user data.
- **POST /api/ai-suggestion**: Get AI-generated study suggestions.

For more details, refer to the backend code in `server.js`.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a feature branch:
   
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit changes:
   
   ```bash
   git commit -m 'Add your feature'
   ```
4. Push to the branch:
   
   ```bash
   git push origin feature/your-feature
   ```
5. Open a pull request.

## License

This project is licensed under the MIT License.
