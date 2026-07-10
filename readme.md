# AuraTask ⚡️ AI-Powered Task Reminder Automation System
AuraTask is a premium, client-side single-page web application (SPA) designed to automate daily task scheduling, remind you of upcoming deadlines, and boost your daily workflow with an interactive AI productivity coach. AuraTask features a blue-and-white visual layout, complete responsiveness, glassmorphic dashboards, dark mode support, and offline-first security.
## 🚀 Key Features
### 🧠 AI Smart Input Parser
*   **Natural Language Processing (NLP):** Schedule tasks directly by typing a single natural sentence (e.g., *"Publish release notes tomorrow at 11 AM high priority"*).
*   **Auto-Structuring:** AuraTask extracts the Title, Due Date, Time, and Priority status on-the-fly and stores the structured task instantly.
### 🤖 AI Productivity Coach Chatbot
*   **Workload Analysis:** Request a status report (e.g., *"Summarize my tasks"*) to get a conversational breakdown of pending, completed, and overdue items, complete with the coach's recommendation.
*   **Subtask Breakdowns:** Type *"Break down [task topic]"* to receive step-by-step guides on how to execute complex projects.
*   **Time Management & Motivation:** Ask about productivity techniques like *Pomodoro*, *Eisenhower Matrix*, or *Time Blocking* to get real-time coaching.
### 🔔 Automated Reminders & Alarm Popups
*   **Precision Polling:** A background worker reviews upcoming deadlines every 10 seconds.
*   **Interactive Alarm Modal:** Plays an audio chime alert, sends a system desktop notification, and opens a modal popup so you can mark a task as completed or dismiss the alert.
*   **Overdue Highlighting:** Backlogged or overdue tasks are styled with a soft red container, overdue status badge, and glowing pulse boundaries.
### 📋 Full CRUD Dashboard & Filtering
*   **Visual Grid Columns:** Scopes pending tasks into **Due Today** (which includes backlogged overdue tasks) and **Upcoming**, with completed items placed in a separate archive column.
*   **Interactive Statistics Widget:** Tracks Total, Pending, Completed, and Overdue tasks.
*   **Dynamic Search & Filtering:** Search by text or filter task board grids by priority (High, Medium, Low) and status (Pending, Completed, Overdue) in real time.
### 🔒 Client-Side Auth & Offline Security
*   **Private Isolation:** User profiles, login hashes, and task records are kept strictly in your local sandbox storage (`localStorage`). No servers, no network tracking, 100% private.
*   **Cross-Session persistence:** Refreshing or returning to the page keeps your active session intact.
---
## 🛠️ Technologies Used
1.  **Frontend Markup:** HTML5 (semantic layout with view structures).
2.  **Styling Engine:** Vanilla CSS (flex grids, custom variables, keyframe animations, responsive media viewports, glassmorphic styling, and dark mode toggles). No external libraries (like TailwindCSS) were used to maintain styling control.
3.  **Core Logic:** Modern ES6 JavaScript (routing engine, DOM renderer, NLP regex parser, localStorage state synchronization, audio context, and interval reminder clocks).
4.  **Icons:** [Lucide Icons Library](https://lucide.dev) (loaded via CDN for visual consistency).
5.  **Fonts:** Google Fonts (*Inter*).
---
## 📂 Folder Structure
```
task-reminder-app/
├── index.html                  # Main client-side entry page
├── README.md                   # Complete developer & user documentation
├── css/
│   └── styles.css              # Custom variables, theme styling & animations
└── js/
    ├── app.js                  # Main app controller, event binders & view router
    ├── auth.js                 # Local storage registration, login & sessions
    ├── tasks.js                # Task CRUD models & alarm engine polling loops
    └── ai.js                   # NLP parsing parser & chatbot coach logic
```
---
## ⚡ Installation & Quick Start
AuraTask runs completely client-side in any modern web browser. There are no server dependencies or package installations required.
### Step 1: Open the Application
You can run AuraTask locally in two ways:
1.  **Direct Browser Run:** Locate the folder and double-click `index.html` to open it in your browser of choice.
2.  **Dev Server (Recommended):** Run a local web server to enable browser audio chimes and native system notification APIs (some browsers restrict features on raw `file://` protocols).
    *   If you have Python installed, run:
        ```bash
        python -m http.server 8000
        ```
        Then navigate to `http://localhost:8000` in your web browser.
    *   Alternatively, if you use Node.js and have VS Code, you can use the **Live Server** extension or run:
        ```bash
        npx -y serve ./
        ```
### Step 2: Register & Log In
1.  Navigate to **Login** or click the **Get Started** button.
2.  Register a new account (or use local credentials if you've already registered).
3.  Upon first login, the app automatically pre-populates your board with three mock tasks (Overdue, Due Today, and Upcoming) so you can test all dashboard systems immediately!
---
## 🔮 Future Enhancements
*   **Custom Alarm Sounds:** Allow users to upload or select their preferred alert sounds.
*   **Subtask Support:** Implement nested checklists inside each task card.
*   **Recurring Tasks:** Add options for daily, weekly, or monthly automatic task repetition.
*   **Calendar View:** Integrate a monthly layout block for full visual timeline planning.
*   **Cloud Sync Optional:** Add voluntary profile syncing with a Firestore or MongoDB backend while maintaining local storage as a fallback.
