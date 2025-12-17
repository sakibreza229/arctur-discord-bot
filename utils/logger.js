// utils/logger.js - IMPROVED VERSION

function getTimestamp() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function info(msg, ...args) {
    console.log(`[${getTimestamp()}] [INFO] ${msg}`, ...args);
}

function error(msg, err = null) {
    const timestamp = getTimestamp();
    
    if (err) {
        if (err instanceof Error) {
            console.error(`[${timestamp}] [ERROR] ${msg}`, '\nStack:', err.stack);
        } else {
            console.error(`[${timestamp}] [ERROR] ${msg}`, '\nDetails:', err);
        }
    } else {
        console.error(`[${timestamp}] [ERROR] ${msg}`);
    }
}

function warn(msg, ...args) {
    console.warn(`[${getTimestamp()}] [WARN] ${msg}`, ...args);
}

function success(msg, ...args) {
    console.log(`[${getTimestamp()}] [SUCCESS] ${msg}`, ...args);
}

// Optional: Add debug level for development
function debug(msg, ...args) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[${getTimestamp()}] [DEBUG] ${msg}`, ...args);
    }
}

// Optional: Bot-specific logging helpers
function command(user, commandName, guild = null) {
    const guildInfo = guild ? ` in "${guild}"` : '';
    info(`User "${user}" used command: ${commandName}${guildInfo}`);
}

function interaction(type, user, customId, guild = null) {
    const guildInfo = guild ? ` in "${guild}"` : '';
    info(`User "${user}" triggered ${type}: ${customId}${guildInfo}`);
}

module.exports = {
    info,
    error,
    warn,
    success,
    debug,
    command,
    interaction
};