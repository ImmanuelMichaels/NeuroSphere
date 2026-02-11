/**
 * MotivationEngine.jsx
 * Evidence-based positive reinforcement system
 * Provides contextual encouragement based on time of day and user actions
 */

/**
 * Evidence-based motivation messages organized by time of day
 * References from positive psychology and behavioral activation research
 */
const MOTIVATION_MESSAGES = [
    // Morning Messages (5 AM - 11 AM)
    {
        id: 'm1',
        text: 'Small steps today lead to big health tomorrow. You\'ve got this! 🌅',
        category: 'morning',
        evidenceBase: 'Behavioral activation theory - incremental progress builds self-efficacy',
        icon: '🌅'
    },
    {
        id: 'm2',
        text: 'Starting your day with self-care sets a positive tone. Great job taking your medication! ✨',
        category: 'morning',
        evidenceBase: 'Morning routines improve executive function and reduce decision fatigue',
        icon: '✨'
    },
    {
        id: 'm3',
        text: 'Your body is thanking you for this healthy choice. Keep building momentum! 💪',
        category: 'morning',
        evidenceBase: 'Positive reinforcement strengthens health behaviors (Skinner, operant conditioning)',
        icon: '💪'
    },
    {
        id: 'm4',
        text: 'Every meal logged is data that helps you understand your body better. Well done! 📊',
        category: 'morning',
        evidenceBase: 'Self-monitoring increases awareness and adherence (Kanfer\'s self-regulation model)',
        icon: '📊'
    },

    // Afternoon Messages (11 AM - 5 PM)
    {
        id: 'a1',
        text: 'Consistency is the secret ingredient. You\'re building healthy habits one choice at a time. 🌿',
        category: 'afternoon',
        evidenceBase: 'Habit formation research - repetition strengthens neural pathways (Lally et al., 2010)',
        icon: '🌿'
    },
    {
        id: 'a2',
        text: 'Taking care of your health is an act of self-respect. You\'re worth this effort! 💚',
        category: 'afternoon',
        evidenceBase: 'Self-compassion improves health outcomes (Neff & Germer)',
        icon: '💚'
    },
    {
        id: 'a3',
        text: 'Your commitment to tracking vitals is empowering. Knowledge is health! 🎯',
        category: 'afternoon',
        evidenceBase: 'Patient empowerment through data literacy improves outcomes',
        icon: '🎯'
    },
    {
        id: 'a4',
        text: 'Midday self-care isn\'t selfish - it\'s essential. Keep prioritizing yourself! 🌟',
        category: 'afternoon',
        evidenceBase: 'Self-care prevents burnout and improves long-term adherence',
        icon: '🌟'
    },

    // Evening Messages (5 PM - 10 PM)
    {
        id: 'e1',
        text: 'You showed up for yourself today. That\'s real strength. Rest well! 🌙',
        category: 'evening',
        evidenceBase: 'Positive affirmations before sleep improve self-concept and reduce anxiety',
        icon: '🌙'
    },
    {
        id: 'e2',
        text: 'Ending your day with self-care creates a foundation for tomorrow. Sleep well! 😌',
        category: 'evening',
        evidenceBase: 'Evening routines improve sleep quality and next-day functioning',
        icon: '😌'
    },
    {
        id: 'e3',
        text: 'Every healthy choice compounds over time. You\'re investing in your future! 🌱',
        category: 'evening',
        evidenceBase: 'Temporal discounting - present actions create future health capital',
        icon: '🌱'
    },
    {
        id: 'e4',
        text: 'You managed your health today despite everything else. That\'s remarkable! ⭐',
        category: 'evening',
        evidenceBase: 'Acknowledging effort (not just outcomes) builds intrinsic motivation',
        icon: '⭐'
    },

    // General Achievement Messages
    {
        id: 'g1',
        text: 'Progress, not perfection. You\'re doing great! 🎉',
        category: 'achievement',
        evidenceBase: 'Growth mindset theory - effort is more important than perfection',
        icon: '🎉'
    },
    {
        id: 'g2',
        text: 'Your health journey is uniquely yours. Trust the process! 🧭',
        category: 'achievement',
        evidenceBase: 'Patient-centered care improves adherence and satisfaction',
        icon: '🧭'
    },
    {
        id: 'g3',
        text: 'Data shows that small, consistent actions create lasting change. You\'re proof! 📈',
        category: 'achievement',
        evidenceBase: 'Meta-analysis: incremental behavior change > dramatic interventions',
        icon: '📈'
    },
    {
        id: 'g4',
        text: 'Every log entry is a vote for the person you\'re becoming. Keep voting! 🗳️',
        category: 'achievement',
        evidenceBase: 'Identity-based habits (James Clear) - actions reinforce self-concept',
        icon: '🗳️'
    },
    {
        id: 'g5',
        text: 'You\'re not just managing a condition - you\'re mastering self-care. Powerful! 💎',
        category: 'achievement',
        evidenceBase: 'Reframing illness as opportunity for growth (post-traumatic growth)',
        icon: '💎'
    }
];

/**
 * Determine time of day category
 * @returns {string} - 'morning', 'afternoon', or 'evening'
 */
const getTimeCategory = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 11) {
        return 'morning';
    } else if (hour >= 11 && hour < 17) {
        return 'afternoon';
    } else {
        return 'evening';
    }
};

/**
 * Select appropriate motivation message based on context
 * @param {Object} userAction - The action the user just completed
 * @param {string} userAction.type - Type of action ('medication', 'meal', 'vitals', etc.)
 * @param {Date} userAction.timestamp - When the action occurred
 * @param {Object} userAction.metadata - Optional additional data
 * @param {string} timeOverride - Optional time category override for testing
 * @returns {Object} - Selected motivation message
 */
export const selectMotivationMessage = (userAction, timeOverride = null) => {
    const timeCategory = timeOverride || getTimeCategory();
    
    // Filter messages by time of day, with fallback to achievement messages
    const relevantMessages = MOTIVATION_MESSAGES.filter(
        msg => msg.category === timeCategory || msg.category === 'achievement'
    );
    
    // Randomly select from relevant messages
    const randomIndex = Math.floor(Math.random() * relevantMessages.length);
    return relevantMessages[randomIndex];
};

/**
 * Get streak-based bonus messages
 * @param {number} streakCount - Number of consecutive days of adherence
 * @returns {string|null} - Streak message or null if no milestone
 */
export const getStreakMessage = (streakCount) => {
    if (streakCount === 3) {
        return '🔥 3-day streak! Habits are forming!';
    } else if (streakCount === 7) {
        return '🔥 One week strong! You\'re building real momentum!';
    } else if (streakCount === 14) {
        return '🔥 Two weeks! Research shows you\'re in the habit-formation zone!';
    } else if (streakCount === 30) {
        return '🔥 30 days! This is lifestyle change, not just a phase. Incredible!';
    } else if (streakCount === 60) {
        return '🔥 60 days! You\'ve rewired your brain. This is transformation!';
    } else if (streakCount === 90) {
        return '🔥 90 days! Clinical studies show sustained behavior change. You did it!';
    }
    
    return null;
};

/**
 * Log motivation event for analytics
 * @param {Object} message - The motivation message that was shown
 * @param {Object} userAction - The user action that triggered it
 * @param {boolean} userEngaged - Whether user manually dismissed (true) or auto-dismissed (false)
 */
export const logMotivationEvent = (message, userAction, userEngaged) => {
    // In production, this would send to analytics service
    const event = {
        timestamp: new Date().toISOString(),
        messageId: message.id,
        category: message.category,
        actionType: userAction.type,
        userEngaged,
        timeOfDay: getTimeCategory()
    };
    
    console.log('[MotivationEngine] Event:', event);
    
    // Could integrate with Mixpanel, Amplitude, or custom analytics
    // Example:
    // if (window.analytics) {
    //     window.analytics.track('motivation_shown', event);
    // }
};

/**
 * Personalization: Get user's most effective message categories
 * (Would use historical engagement data in production)
 * @param {string} userId - The user's unique identifier
 * @returns {Array<string>} - Categories sorted by historical engagement rate
 */
export const getUserPreferredCategories = (userId) => {
    // Placeholder - would query user engagement database
    // Return categories sorted by historical engagement rate
    
    // In production:
    // const engagementData = await fetch(`/api/users/${userId}/motivation-preferences`);
    // return engagementData.preferredCategories;
    
    return ['achievement', 'morning', 'afternoon', 'evening'];
};

/**
 * Get all available motivation messages (for testing/preview)
 * @returns {Array<Object>} - All motivation messages
 */
export const getAllMessages = () => {
    return MOTIVATION_MESSAGES;
};

/**
 * Get messages by category
 * @param {string} category - Message category to filter by
 * @returns {Array<Object>} - Filtered messages
 */
export const getMessagesByCategory = (category) => {
    return MOTIVATION_MESSAGES.filter(msg => msg.category === category);
};

// Default export with all functions
export default {
    selectMotivationMessage,
    getStreakMessage,
    logMotivationEvent,
    getUserPreferredCategories,
    getAllMessages,
    getMessagesByCategory,
    MOTIVATION_MESSAGES
};
