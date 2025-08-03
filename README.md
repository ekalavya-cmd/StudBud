# StudBud - AI-Powered Study Planner

<div align="center">
  
🎓 **A Comprehensive Study Management Application** 🎓

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-blue.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

StudBud is a modern, comprehensive study management application that helps students organize their tasks, track study hours, maintain study streaks, and get AI-powered study suggestions using Google's Gemini AI. Built with React, Node.js, and MongoDB, it provides a seamless and intuitive experience for academic productivity.

## ✨ Key Features

### 📊 **Smart Dashboard**
- **Study Hours Tracking**: Monitor daily and total study hours with detailed priority breakdowns
- **Task Management Overview**: Track completed vs incomplete tasks by priority with color-coded indicators
- **Study Streak System**: Maintain consecutive study days with visual progress indicators
- **Upcoming Tasks Preview**: Quick view of your next 3 most important tasks
- **AI Study Assistant**: Get personalized study tips and comprehensive progress reports

### ✅ **Advanced Task Management**
- **Intuitive Task Creation**: Add tasks with priority levels (High/Medium/Low), due dates, and estimated hours
- **Smart Sorting & Filtering**: Sort by due date or priority with ascending/descending options
- **Real-time Updates**: Live task completion with immediate point rewards and notifications
- **Click-to-Complete**: Click anywhere on a task card to mark it complete
- **Consistent Date Format**: DD-MM-YYYY format throughout the application
- **Task Analytics**: Track completion patterns and productivity insights

### 📈 **Comprehensive Analytics**
- **Completion Rate Visualization**: Beautiful circular progress indicators for task completion
- **7-Day Timeline**: Daily task completion patterns with interactive charts
- **Priority Breakdown**: Pie charts showing distribution of completed tasks by priority
- **Study Hours Trends**: Weekly trends of daily study hours with detailed statistics
- **Productivity Insights**: Comprehensive analysis including overdue tasks and high-priority items

### 🏆 **Gamified Rewards System**
- **Points System**: Earn points for completing tasks (High=30, Medium=20, Low=10 points)
- **Achievement Badges**: Unlock milestones for various accomplishments
  - 🏅 **Priority Master**: Complete 5+ high-priority tasks
  - 🏅 **Task Titan**: Complete 10+ total tasks
  - 🏅 **Early Bird**: Complete 3+ tasks before their due date
  - 🏅 **Streak Star**: Maintain a 7+ day study streak
- **Theme Unlocking**: Redeem points for beautiful themes
  - 🌙 **Dark Mode**: 100 points
  - 🌊 **Ocean Breeze**: 200 points  
  - 🌅 **Sunset Glow**: 300 points
  - 🌲 **Forest Whisper**: 400 points

### 📅 **Interactive Calendar**
- **Visual Task Distribution**: See your tasks laid out across dates
- **Date Selection**: Click any date to view tasks due that day
- **Task Overview**: Distinguish between completed and incomplete tasks
- **Theme Integration**: Calendar adapts beautifully to your selected theme
- **Task Indicators**: Color-coded dots show task status at a glance

### 🤖 **AI Integration (Google Gemini 2.5 Flash Lite)**
- **Personalized Study Tips**: Get tailored study advice for any academic field
- **Comprehensive Progress Reports**: Daily reports with motivational messaging and statistics
- **Intelligent Fallback System**: Local suggestions when AI is unavailable
- **Real-time Logging**: Terminal logs show AI response status for developers
- **Field-Agnostic Advice**: Works for science, arts, business, literature, and more

## 🛠 Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **Tailwind CSS**: Utility-first CSS framework for beautiful, responsive design
- **Lucide React**: Beautiful, customizable icons for enhanced UX
- **React Calendar**: Interactive calendar component with full customization
- **React Toastify**: Elegant notifications and real-time feedback

### Backend
- **Node.js**: JavaScript runtime for efficient server-side development
- **Express.js**: Fast, unopinionated web application framework
- **MongoDB Atlas**: Cloud database for reliable data persistence and scalability
- **Mongoose**: Elegant MongoDB object modeling for Node.js
- **Google Gemini AI**: State-of-the-art AI for intelligent study suggestions

### Development Tools
- **ESLint**: Code linting and style enforcement for clean code
- **Create React App**: Optimized development environment and build tooling
- **Git**: Version control with comprehensive .gitignore for clean repositories

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher) - [Download here](https://nodejs.org/)
- npm (comes with Node.js)
- MongoDB Atlas account (free tier available) - [Sign up here](https://www.mongodb.com/atlas)
- Google Gemini API key (free tier available) - [Get one here](https://ai.google.dev/)

### ⚡ One-Command Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/StudBud.git
   cd StudBud
   ```

2. **Install all dependencies:**
   ```bash
   # Install backend dependencies
   cd backend && npm install
   
   # Install frontend dependencies  
   cd ../frontend && npm install && cd ..
   ```

3. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp backend/.env.example backend/.env
   
   # Edit with your credentials (see configuration section below)
   ```

4. **Start both servers:**
   ```bash
   # Terminal 1: Start backend (from project root)
   cd backend && npm start
   
   # Terminal 2: Start frontend (from project root)  
   cd frontend && npm start
   ```

5. **Open your browser:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## ⚙️ Configuration

### Environment Variables

Create `/backend/.env` with the following:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/studyBuddy?retryWrites=true&w=majority&appName=MyCluster

# Google Gemini API key
GEMINI_API_KEY=your_gemini_api_key_here

# Server configuration
PORT=5000
NODE_ENV=development

# Timezone (optional)
TZ=Asia/Kolkata
```

### 🔑 Getting API Keys

#### MongoDB Atlas (Free)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Navigate to Database → Connect → Connect your application
4. Copy the connection string and replace `<username>` and `<password>`

#### Google Gemini API (Free)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a free account
3. Generate an API key
4. Copy the key to your `.env` file

## 📖 Usage Guide

### Getting Started
1. **Dashboard**: Your central hub showing AI suggestions, study hours, completed tasks, and study streak
2. **Add Your First Task**: Click "Add New Task" and fill in title, due date, priority, and estimated hours
3. **Complete Tasks**: Click anywhere on a task card to mark it complete and earn points
4. **Get AI Help**: Use "Get Study Tips" for personalized advice or "Generate Report" for progress analysis
5. **Track Progress**: Visit Analytics to see detailed charts and insights
6. **Earn Rewards**: Complete tasks to earn points and unlock new themes

### Advanced Features
- **Smart Sorting**: Use the sort and filter controls in Tasks to organize by priority or due date
- **Calendar View**: Switch to Calendar to see your tasks distributed across dates
- **Theme Customization**: Visit Rewards to unlock and switch between beautiful themes
- **Progress Tracking**: Check Analytics for detailed insights into your study patterns

## 📱 Responsive Design

StudBud is fully responsive and works beautifully on:
- 🖥️ **Desktop**: Full feature experience with spacious layouts
- 💻 **Laptop**: Optimized for productivity and extended use
- 📱 **Mobile**: Touch-friendly interface with intuitive navigation
- 📟 **Tablet**: Perfect balance of desktop features and mobile convenience

## 🎨 Themes

StudBud includes 5 stunning themes unlockable through the rewards system:

- 🌞 **Light Mode** (Default): Clean, professional light theme
- 🌙 **Dark Mode** (100 pts): Easy on the eyes for late-night study sessions
- 🌊 **Ocean Breeze** (200 pts): Calming blue gradients for focused studying
- 🌅 **Sunset Glow** (300 pts): Warm orange and pink gradients for motivation  
- 🌲 **Forest Whisper** (400 pts): Natural green gradients for peaceful productivity

## 🏗️ Project Structure

```
StudBud/
├── frontend/                 # React application
│   ├── public/              # Static files
│   └── src/
│       ├── components/      # React components
│       │   ├── analytics/   # Analytics page components
│       │   ├── dashboard/   # Dashboard cards
│       │   ├── layout/      # Layout components
│       │   ├── rewards/     # Rewards system
│       │   ├── taskmanager/ # Task management
│       │   └── utils/       # Utility functions
│       └── services/        # API services
├── backend/                 # Node.js server
│   ├── server.js           # Main server file
│   ├── db-config.js        # Database configuration
│   └── .env.example        # Environment template
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🔧 API Reference

### User Data
- `GET /api/user/:userId` - Fetch user data and preferences
- `POST /api/user/:userId` - Save user data and sync across devices

### AI Suggestions
- `POST /api/ai-suggestion` - Get AI-powered study suggestions and reports

### Database Schema
```javascript
{
  userId: String,
  tasks: [{
    id: Number,
    title: String,
    dueDate: String,        // DD-MM-YYYY format
    priority: String,       // "High", "Medium", "Low"
    completed: Boolean,
    completedDate: String,
    pointsAwarded: Boolean,
    hours: Number
  }],
  studyStats: {
    totalHours: Number,
    completedTasks: Number,
    streak: Number,
    lastActiveDate: String,
    studyHoursLog: [{ date: String, hours: Number }]
  },
  points: Number,
  badges: [String],
  currentTheme: String,
  unlockedThemes: [String]
}
```

## 🚀 Deployment

### Frontend Build
```bash
cd frontend
npm run build
```

### Production Considerations
- Set `NODE_ENV=production` in your environment
- Use proper MongoDB Atlas cluster for production
- Configure CORS settings for your domain
- Set up HTTPS for secure connections
- Implement proper error logging and monitoring

### Deployment Platforms
- **Frontend**: Vercel, Netlify, GitHub Pages
- **Backend**: Heroku, Railway, DigitalOcean
- **Database**: MongoDB Atlas (already cloud-based)

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit with clear messages**: `git commit -m 'Add amazing feature'`
5. **Push to your branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request** with a detailed description

### Development Guidelines
- Follow the existing code style and structure
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed
- Ensure responsive design compatibility

## 🐛 Troubleshooting

### Common Issues

**Frontend won't start:**
- Ensure Node.js v18+ is installed
- Delete `node_modules` and run `npm install`
- Check for port conflicts (default: 3000)

**Backend connection errors:**
- Verify MongoDB Atlas connection string
- Check if your IP is whitelisted in MongoDB Atlas
- Ensure Gemini API key is valid

**AI features not working:**
- Verify Gemini API key in `.env` file
- Check internet connection
- Look at backend terminal for error logs

**Tasks not saving:**
- Check browser console for errors
- Verify backend is running on port 5000
- Test API endpoints directly

### Cache Issues
If you experience any unusual behavior, visit `/clear-cache.html` to clear all browser data.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

### Coming Soon
- [ ] Study session timer with break reminders
- [ ] Subject-specific task categorization  
- [ ] Advanced analytics with goal setting
- [ ] Mobile app for iOS and Android
- [ ] Collaborative study groups
- [ ] Export/import functionality
- [ ] Offline mode support
- [ ] Dark mode scheduling

## 💖 Acknowledgments

- **Google Gemini AI** for intelligent study suggestions
- **MongoDB Atlas** for reliable cloud database services
- **React Community** for excellent documentation and support
- **Tailwind CSS** for beautiful, utility-first styling
- **Lucide** for clean, consistent icons

## 📞 Support

For support, questions, or feature requests:
- 📧 **Email**: Open an issue on GitHub
- 🐛 **Bug Reports**: Use the GitHub issue tracker
- 💡 **Feature Requests**: Submit detailed proposals via GitHub issues
- 📖 **Documentation**: Check this README and inline code comments

---

<div align="center">

**Made with ❤️ for students worldwide**

⭐ **Star this repo if StudBud helps you stay productive!** ⭐

</div>