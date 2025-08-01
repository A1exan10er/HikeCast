// HikeCast Dashboard JavaScript

let currentEditingUser = null;
let allUsers = [];
let originalUserData = {}; // Store original values

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    loadStats();
    toggleConditionalFields(); // Initialize field visibility
    
    // Add input event listeners to detect user modifications
    document.getElementById('telegram_chat_id').addEventListener('input', function() {
        if (this.value && this.value !== originalUserData.telegram_chat_id) {
            const requirement = document.getElementById('telegram-requirement');
            requirement.textContent = '(Using your entered value)';
            requirement.style.color = '#17a2b8';
            highlightUserInput(this, requirement);
        }
    });
    
    document.getElementById('email').addEventListener('input', function() {
        if (this.value && this.value !== originalUserData.email) {
            const requirement = document.getElementById('email-requirement');
            requirement.textContent = '(Using your entered value)';
            requirement.style.color = '#17a2b8';
            highlightUserInput(this, requirement);
        }
    });
    
    document.getElementById('whatsapp').addEventListener('input', function() {
        if (this.value && this.value !== originalUserData.whatsapp) {
            const requirement = document.getElementById('whatsapp-requirement');
            requirement.textContent = '(Using your entered value)';
            requirement.style.color = '#17a2b8';
            highlightUserInput(this, requirement);
        }
    });
    
    // Add event listener for extreme weather alerts checkbox
    document.getElementById('enable-extreme-weather-alerts').addEventListener('change', toggleConditionalFields);
    
    // Add event listener for extreme weather interval select
    document.getElementById('extreme-weather-check-interval').addEventListener('change', function() {
        const customGroup = document.getElementById('custom-interval-group');
        if (this.value === 'custom') {
            customGroup.style.display = 'block';
            document.getElementById('custom-extreme-weather-interval').required = true;
        } else {
            customGroup.style.display = 'none';
            document.getElementById('custom-extreme-weather-interval').required = false;
            clearFieldError('custom-extreme-weather-interval');
        }
    });
    
    // Add validation for custom extreme weather interval input
    document.getElementById('custom-extreme-weather-interval').addEventListener('input', function() {
        const value = this.value.trim();
        if (value) {
            const validation = validateCronExpression(value);
            if (!validation.valid) {
                showFieldError('custom-extreme-weather-interval', validation.error);
            } else {
                clearFieldError('custom-extreme-weather-interval');
            }
        } else {
            clearFieldError('custom-extreme-weather-interval');
        }
    });
});

function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    status.innerHTML = message;
    status.className = 'status ' + type;
    status.style.display = 'block';
    setTimeout(() => status.style.display = 'none', 5000);
}

// Enhanced function to toggle conditional fields based on selected channels
function toggleConditionalFields() {
    const telegramChecked = document.getElementById('channel-telegram').checked;
    const emailChecked = document.getElementById('channel-email').checked;
    const whatsappChecked = document.getElementById('channel-whatsapp').checked;
    
    console.log('Toggle fields - Telegram:', telegramChecked, 'Email:', emailChecked, 'WhatsApp:', whatsappChecked);
    console.log('Available original data:', originalUserData);
    
    // Clear channels error if at least one channel is selected
    if (telegramChecked || emailChecked || whatsappChecked) {
        clearFieldError('channels');
    }
    
    // Toggle Telegram field
    const telegramField = document.getElementById('telegram-field');
    const telegramInput = document.getElementById('telegram_chat_id');
    const telegramRequirement = document.getElementById('telegram-requirement');
    
    if (telegramChecked) {
        telegramField.classList.remove('hidden');
        telegramField.classList.add('required');
        telegramInput.required = true;
        
        // Check if field has a value and show appropriate message
        if (telegramInput.value) {
            if (telegramInput.value === originalUserData.telegram_chat_id) {
                telegramRequirement.textContent = '✓ Using saved value';
                telegramRequirement.style.color = '#28a745'; // Green
            } else {
                telegramRequirement.textContent = '(Using your entered value)';
                telegramRequirement.style.color = '#17a2b8'; // Blue
            }
        } else {
            telegramRequirement.textContent = '(Required for Telegram notifications)';
            telegramRequirement.style.color = '#667eea'; // Default
        }
    } else {
        telegramField.classList.add('hidden');
        telegramField.classList.remove('required');
        telegramInput.required = false;
        telegramRequirement.textContent = '';
        clearFieldError('telegram');
    }
    
    // Toggle Email field  
    const emailField = document.getElementById('email-field');
    const emailInput = document.getElementById('email');
    const emailRequirement = document.getElementById('email-requirement');
    
    if (emailChecked) {
        emailField.classList.remove('hidden');
        emailField.classList.add('required');
        emailInput.required = true;
        
        // Check if field has a value and show appropriate message
        if (emailInput.value) {
            if (emailInput.value === originalUserData.email) {
                emailRequirement.textContent = '✓ Using saved value';
                emailRequirement.style.color = '#28a745'; // Green
            } else {
                emailRequirement.textContent = '(Using your entered value)';
                emailRequirement.style.color = '#17a2b8'; // Blue
            }
        } else {
            emailRequirement.textContent = '(Required for Email notifications)';
            emailRequirement.style.color = '#667eea'; // Default
        }
    } else {
        emailField.classList.add('hidden');
        emailField.classList.remove('required');
        emailInput.required = false;
        emailRequirement.textContent = '';
        clearFieldError('email');
    }
    
    // Toggle WhatsApp field
    const whatsappField = document.getElementById('whatsapp-field');
    const whatsappInput = document.getElementById('whatsapp');
    const whatsappRequirement = document.getElementById('whatsapp-requirement');
    
    if (whatsappChecked) {
        whatsappField.classList.remove('hidden');
        whatsappField.classList.add('required');
        whatsappInput.required = true;
        
        // Check if field has a value and show appropriate message
        if (whatsappInput.value) {
            if (whatsappInput.value === originalUserData.whatsapp) {
                whatsappRequirement.textContent = '✓ Using saved value';
                whatsappRequirement.style.color = '#28a745'; // Green
            } else {
                whatsappRequirement.textContent = '(Using your entered value)';
                whatsappRequirement.style.color = '#17a2b8'; // Blue
            }
        } else {
            whatsappRequirement.textContent = '(Required for WhatsApp notifications)';
            whatsappRequirement.style.color = '#667eea'; // Default
        }
    } else {
        whatsappField.classList.add('hidden');
        whatsappField.classList.remove('required');
        whatsappInput.required = false;
        whatsappRequirement.textContent = '';
        clearFieldError('whatsapp');
    }
    
    // Toggle extreme weather interval field
    const extremeWeatherEnabled = document.getElementById('enable-extreme-weather-alerts').checked;
    const intervalGroup = document.getElementById('extreme-weather-interval-group');
    const intervalSelect = document.getElementById('extreme-weather-check-interval');
    
    if (extremeWeatherEnabled) {
        intervalGroup.style.display = 'block';
        intervalSelect.required = true;
    } else {
        intervalGroup.style.display = 'none';
        intervalSelect.required = false;
        document.getElementById('custom-interval-group').style.display = 'none';
    }
}

// Function to validate conditional fields
function validateConditionalFields() {
    let isValid = true;
    
    // Clear all previous errors
    clearFieldError('telegram');
    clearFieldError('email');
    clearFieldError('whatsapp');
    clearFieldError('channels');
    
    // First check if at least one notification channel is selected
    const selectedChannels = document.querySelectorAll('input[name="channels"]:checked');
    if (selectedChannels.length === 0) {
        showFieldError('channels', 'Please select at least one notification channel');
        isValid = false;
        return isValid; // Return early if no channels selected
    }
    
    // Validate Telegram
    if (document.getElementById('channel-telegram').checked) {
        const telegramValue = document.getElementById('telegram_chat_id').value.trim();
        if (!telegramValue) {
            showFieldError('telegram', 'Telegram Chat ID is required when Telegram channel is selected');
            isValid = false;
        }
    }
    
    // Validate Email
    if (document.getElementById('channel-email').checked) {
        const emailValue = document.getElementById('email').value.trim();
        if (!emailValue) {
            showFieldError('email', 'Email address is required when Email channel is selected');
            isValid = false;
        } else if (!isValidEmail(emailValue)) {
            showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }
    }
    
    // Validate WhatsApp
    if (document.getElementById('channel-whatsapp').checked) {
        const whatsappValue = document.getElementById('whatsapp').value.trim();
        if (!whatsappValue) {
            showFieldError('whatsapp', 'WhatsApp number is required when WhatsApp channel is selected');
            isValid = false;
        }
    }
    
    // Validate extreme weather custom interval if needed
    if (document.getElementById('enable-extreme-weather-alerts').checked) {
        const intervalSelect = document.getElementById('extreme-weather-check-interval');
        if (intervalSelect.value === 'custom') {
            const customIntervalValue = document.getElementById('custom-extreme-weather-interval').value.trim();
            if (!customIntervalValue) {
                showFieldError('custom-extreme-weather-interval', 'Custom interval is required when "Custom" is selected');
                isValid = false;
            } else {
                const validation = validateCronExpression(customIntervalValue);
                if (!validation.valid) {
                    showFieldError('custom-extreme-weather-interval', validation.error);
                    isValid = false;
                }
            }
        }
    }
    
    return isValid;
}

function showFieldError(fieldType, message) {
    if (fieldType === 'channels') {
        // For channels, show error below the checkbox group
        const checkboxGroup = document.querySelector('.checkbox-group');
        let errorDiv = document.getElementById('channels-error');
        
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'channels-error';
            errorDiv.className = 'error-message';
            checkboxGroup.parentNode.appendChild(errorDiv);
        }
        
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#dc3545';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
    } else {
        let inputId = fieldType;
        if (fieldType === 'telegram') {
            inputId = 'telegram_chat_id';
        } else if (fieldType === 'custom-extreme-weather-interval') {
            inputId = 'custom-extreme-weather-interval';
        }
        
        const input = document.getElementById(inputId);
        const errorDiv = document.getElementById(fieldType + '-error');
        
        if (input) {
            input.classList.add('validation-error');
        }
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
}

function clearFieldError(fieldType) {
    if (fieldType === 'channels') {
        const errorDiv = document.getElementById('channels-error');
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
    } else {
        let inputId = fieldType;
        if (fieldType === 'telegram') {
            inputId = 'telegram_chat_id';
        } else if (fieldType === 'custom-extreme-weather-interval') {
            inputId = 'custom-extreme-weather-interval';
        }
        
        const input = document.getElementById(inputId);
        const errorDiv = document.getElementById(fieldType + '-error');
        
        if (input) {
            input.classList.remove('validation-error');
        }
        if (errorDiv) {
            errorDiv.textContent = '';
            errorDiv.style.display = 'none';
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to convert cron intervals to human-readable descriptions
function getIntervalDescription(interval) {
    if (!interval) return 'Default (Every 2 hours)';
    
    const descriptions = {
        '*/30 * * * *': 'Every 30 minutes',
        '0 * * * *': 'Every hour',
        '0 */2 * * *': 'Every 2 hours',
        '0 */4 * * *': 'Every 4 hours',
        '0 8,20 * * *': 'Twice daily (8 AM & 8 PM)',
        '0 8 * * *': 'Once daily (8 AM)'
    };
    
    return descriptions[interval] || `Custom (${interval})`;
}

// Validate cron expression for custom extreme weather interval
function validateCronExpression(expression) {
    if (!expression || typeof expression !== 'string') {
        return { valid: false, error: 'Cron expression is required' };
    }
    
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
        return { valid: false, error: 'Cron expression must have exactly 5 parts (minute hour day month weekday)' };
    }
    
    const [minute, hour, day, month, weekday] = parts;
    
    // Basic validation for each part
    const validations = [
        { part: minute, name: 'minute', min: 0, max: 59 },
        { part: hour, name: 'hour', min: 0, max: 23 },
        { part: day, name: 'day', min: 1, max: 31 },
        { part: month, name: 'month', min: 1, max: 12 },
        { part: weekday, name: 'weekday', min: 0, max: 6 }
    ];
    
    for (const { part, name, min, max } of validations) {
        if (part === '*' || part.includes('/') || part.includes(',') || part.includes('-')) {
            // Complex expressions - just basic check
            if (!/^[\d*,\-\/]+$/.test(part)) {
                return { valid: false, error: `Invalid ${name} part: ${part}` };
            }
        } else {
            const num = parseInt(part);
            if (isNaN(num) || num < min || num > max) {
                return { valid: false, error: `${name} must be between ${min} and ${max}, got: ${part}` };
            }
        }
    }
    
    return { valid: true };
}

async function loadStats() {
    try {
        const response = await fetch('/database/stats');
        const data = await response.json();
        if (data.status === 'success') {
            document.getElementById('total-users').textContent = data.stats.totalUsers;
            document.getElementById('telegram-users').textContent = data.stats.telegramUsers;
            document.getElementById('email-users').textContent = data.stats.emailUsers;
            document.getElementById('whatsapp-users').textContent = data.stats.whatsappUsers;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadUsers() {
    try {
        const response = await fetch('/users');
        const data = await response.json();
        if (data.status === 'success') {
            allUsers = data.users;
            displayUsers(data.users);
        } else {
            showStatus('Failed to load users: ' + data.message, 'error');
        }
    } catch (error) {
        showStatus('Error loading users: ' + error.message, 'error');
    }
}

function translateCronSchedule(cronSchedule, timezone) {
    if (!cronSchedule) return 'Not set';
    
    const parts = cronSchedule.split(' ');
    if (parts.length !== 5) return cronSchedule; // Invalid format, return as-is
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // Helper functions
    const formatHours = (hourStr) => {
        if (hourStr === '*') return 'every hour';
        const hours = hourStr.split(',').map(h => {
            const num = parseInt(h);
            if (num === 0) return '12:00 AM';
            if (num < 12) return `${num}:00 AM`;
            if (num === 12) return '12:00 PM';
            return `${num - 12}:00 PM`;
        });
        return hours.join(' and ');
    };
    
    const formatDaysOfWeek = (dayStr) => {
        if (dayStr === '*') return 'every day';
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const days = dayStr.split(',').map(d => {
            const num = parseInt(d);
            return dayNames[num] || `Day ${num}`;
        });
        
        if (days.length === 7) return 'every day';
        if (days.length === 5 && !days.includes('Saturday') && !days.includes('Sunday')) {
            return 'weekdays (Monday-Friday)';
        }
        if (days.length === 2 && days.includes('Saturday') && days.includes('Sunday')) {
            return 'weekends';
        }
        
        return days.join(', ');
    };
    
    const formatFrequency = (dayOfMonth, month) => {
        if (dayOfMonth === '*' && month === '*') return '';
        if (dayOfMonth !== '*') return ` on day ${dayOfMonth} of the month`;
        if (month !== '*') return ` in month ${month}`;
        return '';
    };
    
    // Build the natural language description
    const timeDescription = formatHours(hour);
    const dayDescription = formatDaysOfWeek(dayOfWeek);
    const frequencyDescription = formatFrequency(dayOfMonth, month);
    
    let description = `${timeDescription} on ${dayDescription}${frequencyDescription}`;
    
    // Add timezone if provided
    if (timezone && timezone !== 'UTC') {
        description += ` (${timezone} time)`;
    }
    
    return description.charAt(0).toUpperCase() + description.slice(1);
}

function displayUsers(users) {
    const container = document.getElementById('users-container');
    if (users.length === 0) {
        container.innerHTML = '<div class="loading">No users found. Add your first user!</div>';
        return;
    }

    container.innerHTML = users.map(user => `
        <div class="user-card">
            <div class="user-header">
                <span>${user.name}</span>
                <div>
                    <button class="btn btn-info" onclick="testUser('${user.name}')" title="Test Notification">🧪</button>
                    <button class="btn btn-success" onclick="editUser('${user.name}')" title="Edit User">✏️</button>
                    <button class="btn btn-danger" onclick="deleteUser('${user.name}')" title="Delete User">🗑️</button>
                </div>
            </div>
            <div class="user-details">
                <div class="detail-row">
                    <span class="detail-label">📍 Locations:</span>
                    <div class="detail-value">
                        <div class="locations">
                            ${user.locations.map(loc => `<span class="tag location-tag">${loc}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📱 Channels:</span>
                    <div class="detail-value">
                        <div class="channels">
                            ${user.channels.map(ch => `<span class="tag channel-${ch}">${ch}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">⏰ Schedule:</span>
                    <div class="detail-value">
                        <div style="margin-bottom: 5px;">
                            <strong>${translateCronSchedule(user.schedule, user.timezone)}</strong>
                        </div>
                        <div style="font-size: 0.85em; color: #666;">
                            <code>${user.schedule}</code> (${user.timezone})
                        </div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Forecast Days:</span>
                    <div class="detail-value">
                        <div class="forecast-days">
                            ${(user.forecastDays || []).map(day => `<span class="tag day-tag">${day}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🤖 AI Analysis:</span>
                    <div class="detail-value">
                        ${user.enableAIAnalysis !== false ? '✅ Enabled' : '❌ Disabled'}
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🚨 Extreme Weather Alerts:</span>
                    <div class="detail-value">
                        ${user.enableExtremeWeatherAlerts !== false ? '✅ Enabled' : '❌ Disabled'}
                        ${user.enableExtremeWeatherAlerts !== false ? 
                            `<br><small class="form-help">Check interval: ${getIntervalDescription(user.extremeWeatherCheckInterval)}</small>` : 
                            ''
                        }
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🔗 Status:</span>
                    <div class="detail-value">
                        Telegram: ${user.hasValidTelegramId ? '✅' : '❌'}
                        <span class="status-indicator ${user.hasValidTelegramId ? 'status-online' : 'status-offline'}"></span>
                        | Email: ${user.hasValidEmail ? '✅' : '❌'}
                        <span class="status-indicator ${user.hasValidEmail ? 'status-online' : 'status-offline'}"></span>
                        | WhatsApp: ${user.hasValidWhatsApp ? '✅' : '❌'}
                        <span class="status-indicator ${user.hasValidWhatsApp ? 'status-online' : 'status-offline'}"></span>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📊 Created:</span>
                    <div class="detail-value">
                        ${new Date(user.created_at).toLocaleDateString()} ${user.updated_at !== user.created_at ? '(Updated: ' + new Date(user.updated_at).toLocaleDateString() + ')' : ''}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function openAddUserModal() {
    currentEditingUser = null;
    originalUserData = {}; // Clear original data for new user
    document.getElementById('modal-title').textContent = 'Add New User';
    document.getElementById('save-btn').textContent = 'Add User';
    resetForm();
    document.getElementById('userModal').style.display = 'block';
    toggleConditionalFields(); // Initialize field visibility
}

async function editUser(userName) {
    try {
        const response = await fetch(`/users/${encodeURIComponent(userName)}`);
        const data = await response.json();
        if (data.status === 'success') {
            currentEditingUser = data.user;
            
            // Store ALL original values FIRST before populating form
            originalUserData = {
                telegram_chat_id: data.user.telegram_chat_id,
                email: data.user.email,
                whatsapp: data.user.whatsapp,
                originalChannels: [...data.user.channels]
            };
            
            console.log('Original user data stored:', originalUserData); // Debug log
            
            document.getElementById('modal-title').textContent = 'Edit User: ' + userName;
            document.getElementById('save-btn').textContent = 'Update User';
            
            // Show modal first
            document.getElementById('userModal').style.display = 'block';
            
            // Populate form
            populateForm(data.user);
            
            // Toggle fields after populating to ensure proper validation state
            setTimeout(() => {
                toggleConditionalFields();
                
                // Force a final population to ensure values are definitely there
                setTimeout(() => {
                    if (data.user.channels.includes('telegram') && data.user.telegram_chat_id) {
                        document.getElementById('telegram_chat_id').value = data.user.telegram_chat_id;
                    }
                    if (data.user.channels.includes('email') && data.user.email) {
                        document.getElementById('email').value = data.user.email;
                    }
                    if (data.user.channels.includes('whatsapp') && data.user.whatsapp) {
                        document.getElementById('whatsapp').value = data.user.whatsapp;
                    }
                    console.log('Final field check completed');
                }, 50);
            }, 200);
        } else {
            showStatus('Failed to load user data: ' + data.message, 'error');
        }
    } catch (error) {
        showStatus('Error loading user: ' + error.message, 'error');
    }
}

function populateForm(user) {
    console.log('Populating form with user:', user); // Debug log
    console.log('Original data available:', originalUserData); // Debug log
    
    document.getElementById('name').value = user.name;
    document.getElementById('locations').value = user.locations.join('\n');
    
    document.getElementById('schedule').value = user.schedule || '0 7 * * *';
    document.getElementById('timezone').value = user.timezone || 'Europe/Berlin';
    
    // Set channels FIRST
    document.querySelectorAll('input[name="channels"]').forEach(checkbox => {
        checkbox.checked = user.channels.includes(checkbox.value);
    });
    
    // Set forecast days
    document.querySelectorAll('input[name="forecastDays"]').forEach(checkbox => {
        checkbox.checked = (user.forecastDays || []).includes(checkbox.value);
    });
    
    // Set AI analysis setting (default to enabled for existing users if not specified)
    document.getElementById('enable-ai-analysis').checked = user.enableAIAnalysis !== false;
    
    // Set extreme weather alerts setting (default to enabled for existing users if not specified)
    document.getElementById('enable-extreme-weather-alerts').checked = user.enableExtremeWeatherAlerts !== false;
    
    // Set extreme weather check interval
    const intervalSelect = document.getElementById('extreme-weather-check-interval');
    const customIntervalInput = document.getElementById('custom-extreme-weather-interval');
    const interval = user.extremeWeatherCheckInterval || '0 */2 * * *';
    
    // Check if it's a predefined interval
    let foundPredefined = false;
    for (let option of intervalSelect.options) {
        if (option.value === interval) {
            intervalSelect.value = interval;
            foundPredefined = true;
            break;
        }
    }
    
    // If not predefined, set to custom
    if (!foundPredefined && interval !== '0 */2 * * *') {
        intervalSelect.value = 'custom';
        customIntervalInput.value = interval;
        document.getElementById('custom-interval-group').style.display = 'block';
    } else {
        document.getElementById('custom-interval-group').style.display = 'none';
    }
    
    // Toggle conditional fields
    toggleConditionalFields();
    
    // IMPORTANT: Populate contact fields AFTER setting channels
    // This ensures the fields are properly visible and populated
    setTimeout(() => {
        // Force populate ALL contact fields with database values if they exist
        if (user.telegram_chat_id) {
            document.getElementById('telegram_chat_id').value = user.telegram_chat_id;
        }
        if (user.email) {
            document.getElementById('email').value = user.email;
        }
        if (user.whatsapp) {
            document.getElementById('whatsapp').value = user.whatsapp;
        }
        
        console.log('Contact fields populated:', {
            telegram: document.getElementById('telegram_chat_id').value,
            email: document.getElementById('email').value,
            whatsapp: document.getElementById('whatsapp').value
        });
    }, 100);
}

function resetForm() {
    document.getElementById('userForm').reset();
    document.getElementById('schedule').value = '0 7 * * *';
    document.getElementById('timezone').value = 'Europe/Berlin';
    
    // Set default forecast days (Saturday, Sunday)
    document.getElementById('day-saturday').checked = true;
    document.getElementById('day-sunday').checked = true;
    
    // Enable AI analysis by default for new users
    document.getElementById('enable-ai-analysis').checked = true;
    
    // Enable extreme weather alerts by default for new users
    document.getElementById('enable-extreme-weather-alerts').checked = true;
    
    // Set default extreme weather check interval
    document.getElementById('extreme-weather-check-interval').value = '0 */2 * * *';
    document.getElementById('custom-interval-group').style.display = 'none';
    
    // Clear all validation errors
    clearFieldError('telegram');
    clearFieldError('email');
    clearFieldError('whatsapp');
    clearFieldError('channels');
}

function closeModal() {
    document.getElementById('userModal').style.display = 'none';
    currentEditingUser = null;
    originalUserData = {};
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeModal();
    }
}

document.getElementById('userForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate conditional fields first
    if (!validateConditionalFields()) {
        showStatus('Please fill in all required contact information for selected notification channels', 'error');
        return;
    }
    
    const formData = new FormData(this);
    
    // Get extreme weather check interval
    let extremeWeatherCheckInterval = formData.get('extremeWeatherCheckInterval');
    if (extremeWeatherCheckInterval === 'custom') {
        extremeWeatherCheckInterval = formData.get('customExtremeWeatherInterval').trim();
    }
    
    const userData = {
        name: formData.get('name').trim(),
        locations: formData.get('locations').split('\n').map(l => l.trim()).filter(l => l),
        channels: Array.from(formData.getAll('channels')),
        telegram_chat_id: formData.get('telegram_chat_id').trim() || null,
        email: formData.get('email').trim() || null,
        whatsapp: formData.get('whatsapp').trim() || null,
        schedule: formData.get('schedule').trim() || '0 7 * * *',
        timezone: formData.get('timezone') || 'Europe/Berlin',
        forecastDays: Array.from(formData.getAll('forecastDays')),
        enableAIAnalysis: document.getElementById('enable-ai-analysis').checked,
        enableExtremeWeatherAlerts: document.getElementById('enable-extreme-weather-alerts').checked,
        extremeWeatherCheckInterval: extremeWeatherCheckInterval || '0 */2 * * *'
    };

    try {
        const url = currentEditingUser ? `/users/${encodeURIComponent(currentEditingUser.name)}` : '/users';
        const method = currentEditingUser ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showStatus(result.message, 'success');
            closeModal();
            await loadUsers();
            await loadStats();
        } else {
            showStatus('Error: ' + (result.errors ? result.errors.join(', ') : result.message), 'error');
        }
    } catch (error) {
        showStatus('Error saving user: ' + error.message, 'error');
    }
});

async function deleteUser(userName) {
    if (!confirm(`Are you sure you want to delete user "${userName}"?\n\nThis action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/users/${encodeURIComponent(userName)}`, { 
            method: 'DELETE' 
        });
        const data = await response.json();
        
        showStatus(data.message, data.status === 'success' ? 'success' : 'error');
        
        if (data.status === 'success') {
            await loadUsers();
            await loadStats();
        }
    } catch (error) {
        showStatus('Error deleting user: ' + error.message, 'error');
    }
}

async function testUser(userName) {
    showStatus('Sending test notification to ' + userName + '...', 'info');
    
    try {
        const response = await fetch(`/users/${encodeURIComponent(userName)}/test`, { 
            method: 'POST' 
        });
        const data = await response.json();
        showStatus(data.message, data.status === 'success' ? 'success' : 'error');
    } catch (error) {
        showStatus('Error testing user: ' + error.message, 'error');
    }
}

async function testAllUsers() {
    showStatus('Sending test notifications to all users...', 'info');
    
    try {
        const response = await fetch('/test-notify');
        const result = await response.text();
        showStatus('Test notifications sent to all users', 'success');
    } catch (error) {
        showStatus('Error testing all users: ' + error.message, 'error');
    }
}

async function checkExtremeWeather() {
    showStatus('Checking extreme weather for all users...', 'info');
    
    try {
        const response = await fetch('/check-extreme-weather', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        showStatus(data.message, data.status === 'success' ? 'success' : 'error');
    } catch (error) {
        showStatus('Error checking extreme weather: ' + error.message, 'error');
    }
}

async function backupDatabase() {
    showStatus('Creating database backup...', 'info');
    
    try {
        const response = await fetch('/database/backup', { method: 'POST' });
        const data = await response.json();
        showStatus(data.message + (data.backupPath ? ' (' + data.backupPath + ')' : ''), 
                  data.status === 'success' ? 'success' : 'error');
    } catch (error) {
        showStatus('Error creating backup: ' + error.message, 'error');
    }
}

async function refreshData() {
    showStatus('Refreshing data...', 'info');
    await loadUsers();
    await loadStats();
    showStatus('Data refreshed successfully', 'success');
}

function highlightRestoredField(inputElement, requirementElement) {
    // Add visual feedback for restored values
    inputElement.classList.add('input-restored');
    requirementElement.classList.add('restored');
    
    // Remove highlight after animation
    setTimeout(() => {
        inputElement.classList.remove('input-restored');
        requirementElement.classList.remove('restored');
    }, 2000);
}

function highlightUserInput(inputElement, requirementElement) {
    // Add visual feedback for user-modified values
    inputElement.classList.add('input-user-modified');
    requirementElement.classList.add('user-input');
    
    // Remove highlight after animation
    setTimeout(() => {
        inputElement.classList.remove('input-user-modified');
        requirementElement.classList.remove('user-input');
    }, 2000);
}
