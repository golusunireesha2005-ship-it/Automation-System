/**
 * AuraTask AI Assistant and Natural Language Parser Module
 * Implements rule-based parsing and contextual productivity chat coaching.
 */
const AI = {
    /**
     * Parses natural language string into structured task properties
     * @param {string} inputText - Raw input text from user
     * @returns {Object} { title, dueDate, dueTime, priority, success }
     */
    parseTaskString(inputText) {
        if (!inputText || !inputText.trim()) {
            return { success: false };
        }
        const text = inputText.toLowerCase().trim();
        
        let priority = 'Medium';
        let dueDate = '';
        let dueTime = '12:00'; // Default to noon
        let title = inputText; // We will strip keywords to find the title
        // 1. Parse Priority
        if (/\b(high|critical|urgent)\b/i.test(text)) {
            priority = 'High';
        } else if (/\b(low|trivial|minor)\b/i.test(text)) {
            priority = 'Low';
        } else if (/\b(medium|moderate|normal)\b/i.test(text)) {
            priority = 'Medium';
        }
        // 2. Parse Date
        const today = new Date();
        let targetDate = new Date(today);
        const weekdayMap = {
            'sunday': 0, 'sun': 0,
            'monday': 1, 'mon': 1,
            'tuesday': 2, 'tue': 2,
            'wednesday': 3, 'wed': 3,
            'thursday': 4, 'thu': 4,
            'friday': 5, 'fri': 5,
            'saturday': 6, 'sat': 6
        };
        let dateFound = false;
        if (/\btoday\b/i.test(text)) {
            // targetDate is already today
            dateFound = true;
        } else if (/\btomorrow\b/i.test(text)) {
            targetDate.setDate(today.getDate() + 1);
            dateFound = true;
        } else if (/\bnext week\b/i.test(text)) {
            targetDate.setDate(today.getDate() + 7);
            dateFound = true;
        } else {
            // Check for weekdays: "on monday", "this friday", "next monday", etc.
            for (const [dayName, dayNum] of Object.entries(weekdayMap)) {
                const regex = new RegExp(`\\b(this|next|on)?\\s*${dayName}\\b`, 'i');
                if (regex.test(text)) {
                    const currentDay = today.getDay();
                    let daysToAdd = (dayNum + 7 - currentDay) % 7;
                    
                    // If it is today and they said "on [today]", or if it's in the past relative to this week,
                    // we assume next week's weekday.
                    if (daysToAdd === 0 && (/\bnext\b/i.test(text) || text.includes('on'))) {
                        daysToAdd = 7;
                    } else if (daysToAdd === 0) {
                        daysToAdd = 0; // Means today
                    }
                    
                    // If they specifically said "next [day]" (e.g. next Friday, when today is Monday, we add 7 more if needed)
                    if (/\bnext\b/i.test(text) && daysToAdd < 7) {
                        daysToAdd += 7;
                    }
                    
                    targetDate.setDate(today.getDate() + daysToAdd);
                    dateFound = true;
                    break;
                }
            }
        }
        // Format Date as YYYY-MM-DD
        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        dueDate = `${year}-${month}-${day}`;
        // 3. Parse Time (e.g., 9 am, 3:30 pm, 16:00, at 5, at 11:30)
        // Match expressions like "at 9:30 pm", "9am", "16:00", "at 4"
        const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/gi;
        let match;
        let bestTimeMatch = null;
        // Iterate matches to find the best match that actually indicates time
        while ((match = timeRegex.exec(inputText)) !== null) {
            const hourStr = match[1];
            const minStr = match[2];
            const ampm = match[3];
            // Filter out numbers that represent priorities or dates (e.g. high/low priority, or day counts)
            const num = parseInt(hourStr, 10);
            if (num > 24) continue; // Not a valid hour
            
            // If it matches a standalone number without AM/PM or separator, let's make sure it is preceded by "at" or is not a noise digit
            if (!minStr && !ampm) {
                const matchIndex = match.index;
                const prefix = inputText.substring(Math.max(0, matchIndex - 6), matchIndex).toLowerCase();
                if (!prefix.includes('at') && !prefix.includes('by') && !prefix.includes('time') && !prefix.includes('@')) {
                    continue; // Skip noise numbers like priority ratings or lists
                }
            }
            bestTimeMatch = {
                hour: num,
                minute: minStr ? parseInt(minStr, 10) : 0,
                ampm: ampm ? ampm.toLowerCase() : null
            };
            break;
        }
        if (bestTimeMatch) {
            let parsedHour = bestTimeMatch.hour;
            const parsedMinute = String(bestTimeMatch.minute).padStart(2, '0');
            if (bestTimeMatch.ampm === 'pm' && parsedHour < 12) {
                parsedHour += 12;
            } else if (bestTimeMatch.ampm === 'am' && parsedHour === 12) {
                parsedHour = 0;
            } else if (!bestTimeMatch.ampm) {
                // Heuristics for times without am/pm. E.g., "at 5" -> 5 PM (17:00), "at 9" -> 9 AM (09:00)
                if (parsedHour >= 1 && parsedHour < 8) {
                    parsedHour += 12; // Assume evening for small hours (1-7)
                }
            }
            dueTime = `${String(parsedHour).padStart(2, '0')}:${parsedMinute}`;
        }
        // 4. Extract Clean Title by removing date/time/priority qualifiers from the string
        // We will remove typical date, time, and priority keywords
        let cleanTitle = inputText
            // Remove priority phrases
            .replace(/\b(high|medium|low|critical|urgent|trivial|normal|minor|moderate)\s*priority\b/gi, '')
            .replace(/\bwith\s+(high|medium|low|critical|urgent|trivial|normal|minor|moderate)\s*priority\b/gi, '')
            .replace(/\b(high|medium|low|critical|urgent|trivial|normal|minor|moderate)\b/gi, '')
            // Remove dates
            .replace(/\b(today|tomorrow|next week)\b/gi, '')
            .replace(/\b(on|this|next)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, '')
            // Remove times (e.g. at 9:30 am, at 4pm, 16:00, at 5)
            .replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(am|pm)?\b/gi, '')
            // Clean up connector noise words and spacing
            .replace(/\b(at|on|by|due|with|for)\s*$/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        // Capitalize first letter
        if (cleanTitle) {
            cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
        } else {
            cleanTitle = "AI Auto-Scheduled Task";
        }
        // If the date wasn't explicitly found, keep it as today
        return {
            title: cleanTitle,
            dueDate,
            dueTime,
            priority,
            success: true
        };
    },
    /**
     * Generates a conversational response from the AI Productivity Coach
     * @param {string} userMessage - Message sent to chat
     * @param {Array} tasksList - List of all user's tasks
     * @returns {string} Coach's reply
     */
    generateCoachResponse(userMessage, tasksList) {
        const msg = userMessage.toLowerCase().trim();
        const pending = tasksList.filter(t => !t.completed);
        const completed = tasksList.filter(t => t.completed);
        const overdue = pending.filter(t => {
            const due = new Date(`${t.dueDate}T${t.dueTime}`);
            return due < new Date();
        });
        const highPriority = pending.filter(t => t.priority === 'High');
        // Context 1: Workload analysis request
        if (msg.includes('status') || msg.includes('summarize') || msg.includes('workload') || msg.includes('tasks') || msg.includes('report')) {
            if (tasksList.length === 0) {
                return "Your task board is completely clear! What a perfect canvas. You can schedule a new task by typing in the AI parser box above. What goals can we set today?";
            }
            let response = `Here is your workload analysis:\n\n` +
                `• **Total tasks tracked:** ${tasksList.length}\n` +
                `• **Pending tasks:** ${pending.length}\n` +
                `• **Completed tasks:** ${completed.length} (Great job! 🎉)\n`;
            if (overdue.length > 0) {
                response += `• **⚠️ Overdue tasks:** ${overdue.length}. These require immediate attention!\n`;
            }
            if (highPriority.length > 0) {
                response += `• **🔥 High Priority pending:** ${highPriority.length} items.\n`;
            }
            response += `\n**Coach's Recommendation:**\n`;
            if (overdue.length > 0) {
                response += `Start by tackling your overdue tasks first, specifically **"${overdue[0].title}"**. This will lift the backlog pressure.`;
            } else if (highPriority.length > 0) {
                response += `Focus on your high-priority items. I recommend scheduling a 45-minute focus block for **"${highPriority[0].title}"** today.`;
            } else if (pending.length > 0) {
                response += `Your schedule is in good shape. Pick the quickest task **"${pending[0].title}"** and execute it using the Pomodoro technique (25 mins work, 5 mins break) to build momentum.`;
            } else {
                response += `All pending tasks are complete! You are ahead of schedule. Enjoy your productive momentum!`;
            }
            return response;
        }
        // Context 2: Time management advice / coaching theories
        if (msg.includes('pomodoro') || msg.includes('technique') || msg.includes('method') || msg.includes('time') || msg.includes('focus') || msg.includes('manage')) {
            return `Here are three proven time-management frameworks you can implement today:\n\n` +
                `1. **The Pomodoro Technique:** Work with intense focus for 25 minutes, then take a 5-minute break. Repeat 4 times, then take a 20-minute break. Great for beating procrastination.\n` +
                `2. **Eisenhower Matrix:** Divide your tasks into 4 quadrants: Important/Urgent (Do first), Important/Not Urgent (Schedule), Not Important/Urgent (Delegate), and Not Important/Not Urgent (Eliminate).\n` +
                `3. **Time Blocking:** Carve out specific hours in your day dedicated *only* to a single task. Put away all notifications during this block.`;
        }
        // Context 3: Task breakdown request (e.g. "break down plan marketing", "break down project", "break down clean room")
        if (msg.includes('break down') || msg.includes('subtasks') || msg.includes('steps') || msg.includes('split')) {
            // Try to extract the task name
            const taskQuery = userMessage.replace(/break down|subtasks|steps|split/gi, '').trim();
            const subject = taskQuery ? `"${taskQuery}"` : "your project";
            
            return `Here is a step-by-step breakdown for ${subject}:\n\n` +
                `1. 🔍 **Research & Plan:** Spend 15 minutes defining the clear requirements and resources needed.\n` +
                `2. 📝 **Draft Outline:** Sketch a rough framework or bullet points of the deliverables.\n` +
                `3. 🛠️ **Execute Core Work:** Focus on the main section without worrying about perfection.\n` +
                `4. 👁️ **Review & Refine:** Step away for 5 minutes, then review and edit for quality.\n` +
                `5. ✅ **Finalize & Check Off:** Complete the final adjustments and submit/conclude.\n\n` +
                `Would you like me to schedule these sub-steps as tasks for you?`;
        }
        // Context 4: Greeting
        if (msg.includes('hello') || msg.includes('hi ') || msg.includes('hey') || msg.includes('greetings')) {
            return `Hello! Ready to conquer your schedule? Ask me to **"summarize my workload"** or type **"break down [task name]"** to get structured subtasks.`;
        }
        // Context 5: Motivation
        if (msg.includes('motivation') || msg.includes('lazy') || msg.includes('procrastinating') || msg.includes('stuck') || msg.includes('tired')) {
            return `Procrastination is just fear of starting. Here is a challenge:\n\n` +
                `Commit to working on **"${pending.length > 0 ? pending[0].title : 'your tasks'}"** for exactly **5 minutes**. That's it. If you want to stop after 5 minutes, you have permission to stop.\n\n` +
                `90% of the time, the hardest part is just crossing the starting line. You've got this!`;
        }
        // Fallback response
        return `I hear you! As your productivity coach, I suggest we review your current task list. Try typing **"summarize my tasks"** or ask about **"time management techniques"** for suggestions.`;
    }
};
// Export to window scope
window.AI = AI;