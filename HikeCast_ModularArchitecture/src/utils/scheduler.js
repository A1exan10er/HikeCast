// This file contains utility functions for scheduling tasks, such as sending notifications at specific times.

const schedule = require('node-schedule');

// Function to schedule a notification
function scheduleNotification(date, callback) {
    return schedule.scheduleJob(date, callback);
}

// Function to cancel a scheduled notification
function cancelScheduledNotification(job) {
    if (job) {
        job.cancel();
    }
}

// Function to schedule a recurring notification
function scheduleRecurringNotification(cronExpression, callback) {
    return schedule.scheduleJob(cronExpression, callback);
}

module.exports = {
    scheduleNotification,
    cancelScheduledNotification,
    scheduleRecurringNotification
};