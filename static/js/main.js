// State Management
let updatesState = [];
let filteredUpdates = [];
let activeCategory = 'all';
let searchQuery = '';
let selectedUpdateId = null;

// DOM Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshSpinner = document.getElementById('refresh-spinner');
const lastUpdatedTimeEl = document.getElementById('last-updated-time');
const feedContainer = document.getElementById('feed-container');
const shimmerLoader = document.getElementById('shimmer-loader');
const emptyState = document.getElementById('empty-state');
const resultsCountEl = document.getElementById('results-count');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const categoryPillsContainer = document.getElementById('category-pills');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Stats Elements
const statTotal = document.getElementById('stat-total');
const statFeatures = document.getElementById('stat-features');
const statAnnouncements = document.getElementById('stat-announcements');
const statIssues = document.getElementById('stat-issues');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const copyTweetBtn = document.getElementById('copy-tweet-btn');
const copyBtnText = document.getElementById('copy-btn-text');
const copyIcon = document.getElementById('copy-icon');
const submitTweetBtn = document.getElementById('submit-tweet-btn');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const limitWarning = document.getElementById('limit-warning');
const previewTypeBadge = document.getElementById('preview-type-badge');
const previewDate = document.getElementById('preview-date');

// Toast Element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    fetchReleases(false);
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        fetchReleases(true);
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        filterAndRenderFeed();
    });

    // Clear Search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        filterAndRenderFeed();
        searchInput.focus();
    });

    // Reset filters empty state button
    resetFiltersBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        activeCategory = 'all';
        
        // Reset category pills
        document.querySelectorAll('#category-pills .pill').forEach(p => {
            p.classList.remove('active');
            if (p.dataset.filter === 'all') p.classList.add('active');
        });
        
        filterAndRenderFeed();
    });

    // Category Pills
    categoryPillsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.pill');
        if (!pill) return;

        // Toggle active class
        document.querySelectorAll('#category-pills .pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        activeCategory = pill.dataset.filter;
        filterAndRenderFeed();
    });

    // Modal Close
    closeModalBtn.addEventListener('click', closeTweetModal);
    cancelTweetBtn.addEventListener('click', closeTweetModal);
    
    // Close modal when clicking outside
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Character Counter & Validation in Composer
    tweetTextarea.addEventListener('input', () => {
        updateCharacterCount();
    });

    // Copy Tweet to Clipboard
    copyTweetBtn.addEventListener('click', () => {
        copyTweetToClipboard();
    });

    // Post to Twitter/X
    submitTweetBtn.addEventListener('click', () => {
        postToTwitter();
    });

    // Export to CSV
    exportCsvBtn.addEventListener('click', () => {
        exportToCSV();
    });

    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
        toggleTheme();
    });
}

// Fetch Release Notes
async function fetchReleases(forceRefresh = false) {
    // Set UI Loading state
    refreshBtn.classList.add('loading');
    refreshBtn.disabled = true;
    
    if (forceRefresh) {
        feedContainer.style.opacity = '0.3';
    } else {
        shimmerLoader.style.display = 'flex';
        feedContainer.style.display = 'none';
    }
    emptyState.style.display = 'none';

    try {
        const response = await fetch(`/api/releases?refresh=${forceRefresh}`);
        const result = await response.json();

        if (result.success) {
            updatesState = result.updates;
            lastUpdatedTimeEl.textContent = result.last_updated;
            
            // Calculate and show statistics
            updateStatistics();
            
            // Filter and render
            filterAndRenderFeed();
        } else {
            showToast(`Error: ${result.error || 'Failed to fetch release notes.'}`);
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Network error while fetching release notes.');
    } finally {
        // Clear UI Loading state
        refreshBtn.classList.remove('loading');
        refreshBtn.disabled = false;
        shimmerLoader.style.display = 'none';
        feedContainer.style.display = 'flex';
        feedContainer.style.opacity = '1';
    }
}

// Update Statistics Counter Dashboard
function updateStatistics() {
    statTotal.textContent = updatesState.length;
    
    const featuresCount = updatesState.filter(u => u.type.toLowerCase().includes('feature')).length;
    const announcementsCount = updatesState.filter(u => u.type.toLowerCase().includes('announcement')).length;
    const issuesCount = updatesState.filter(u => {
        const type = u.type.toLowerCase();
        return type.includes('issue') || type.includes('fix') || type.includes('deprecation') || type.includes('changed');
    }).length;
    
    animateNumber('stat-total', 0, updatesState.length, 600);
    animateNumber('stat-features', 0, featuresCount, 600);
    animateNumber('stat-announcements', 0, announcementsCount, 600);
    animateNumber('stat-issues', 0, issuesCount, 600);
}

// Animate numbers for dashboards
function animateNumber(id, start, end, duration) {
    if (start === end) return;
    const obj = document.getElementById(id);
    const range = end - start;
    const minTimer = 50;
    let stepTime = Math.abs(Math.floor(duration / range));
    stepTime = Math.max(stepTime, minTimer);
    
    const startTime = new Date().getTime();
    const endTime = startTime + duration;
    let timer;
    
    function run() {
        const now = new Date().getTime();
        const remaining = Math.max((endTime - now) / duration, 0);
        const value = Math.round(end - (remaining * range));
        obj.textContent = value;
        if (value == end) {
            clearInterval(timer);
        }
    }
    
    timer = setInterval(run, stepTime);
    run();
}

// Filter and Render Feed
function filterAndRenderFeed() {
    filteredUpdates = updatesState.filter(update => {
        // Category filter
        let matchesCategory = true;
        const type = update.type.toLowerCase();
        
        if (activeCategory === 'feature') {
            matchesCategory = type.includes('feature');
        } else if (activeCategory === 'announcement') {
            matchesCategory = type.includes('announcement');
        } else if (activeCategory === 'changed') {
            matchesCategory = type.includes('changed');
        } else if (activeCategory === 'deprecation') {
            matchesCategory = type.includes('deprecation');
        } else if (activeCategory === 'issue') {
            matchesCategory = type.includes('issue') || type.includes('fix');
        }
        
        // Search filter
        let matchesSearch = true;
        if (searchQuery) {
            const dateText = update.date.toLowerCase();
            const bodyText = update.text.toLowerCase();
            const typeText = update.type.toLowerCase();
            matchesSearch = dateText.includes(searchQuery) || bodyText.includes(searchQuery) || typeText.includes(searchQuery);
        }
        
        return matchesCategory && matchesSearch;
    });

    resultsCountEl.textContent = `Showing ${filteredUpdates.length} update${filteredUpdates.length === 1 ? '' : 's'}`;

    if (filteredUpdates.length === 0) {
        feedContainer.innerHTML = '';
        emptyState.style.display = 'flex';
    } else {
        emptyState.style.display = 'none';
        renderFeedList();
    }
}

// Map category types to style badges
function getBadgeClass(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'badge-feature';
    if (t.includes('announcement')) return 'badge-announcement';
    if (t.includes('changed')) return 'badge-changed';
    if (t.includes('deprecation')) return 'badge-deprecation';
    if (t.includes('issue') || t.includes('fix')) return 'badge-issue';
    return 'badge-update';
}

// Render feed list HTML
function renderFeedList() {
    feedContainer.innerHTML = '';
    
    filteredUpdates.forEach(update => {
        const badgeClass = getBadgeClass(update.type);
        const card = document.createElement('article');
        card.className = `note-card glass-panel ${badgeClass}`;
        card.id = `card-${update.id.replace(/[^\w-]/g, '_')}`;
        
        if (selectedUpdateId === update.id) {
            card.classList.add('selected-highlight');
        }

        // Setup Card Body HTML
        card.innerHTML = `
            <div class="note-header">
                <span class="note-badge-type">${update.type}</span>
                <span class="note-date">${update.date}</span>
            </div>
            <div class="note-content">
                ${update.html}
            </div>
            <div class="note-actions" style="gap: 8px;">
                <button class="btn btn-copy-card-action" onclick="copyCardTextToClipboard('${update.id.replace(/'/g, "\\'")}', this)">
                    <svg viewBox="0 0 24 24" class="icon">
                        <path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />
                    </svg>
                    <span>Copy Text</span>
                </button>
                <button class="btn btn-tweet-action" onclick="handleCardSelect('${update.id.replace(/'/g, "\\'")}')">
                    <svg viewBox="0 0 24 24" class="icon">
                        <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Tweet This Update
                </button>
            </div>
        `;
        
        feedContainer.appendChild(card);
    });
}

// Handle Select for Tweet
window.handleCardSelect = function(updateId) {
    const prevSelected = selectedUpdateId;
    selectedUpdateId = updateId;
    
    // Toggle class indicators in UI
    if (prevSelected) {
        const prevCard = document.getElementById(`card-${prevSelected.replace(/[^\w-]/g, '_')}`);
        if (prevCard) prevCard.classList.remove('selected-highlight');
    }
    
    const activeCard = document.getElementById(`card-${updateId.replace(/[^\w-]/g, '_')}`);
    if (activeCard) activeCard.classList.add('selected-highlight');
    
    // Open composer modal
    openTweetComposer(updateId);
}

// Generate the Tweet Draft text
function generateTweetText(update) {
    const header = `📢 #BigQuery ${update.type} (${update.date}):\n\n`;
    const footer = `\n\nRead details: https://cloud.google.com/bigquery/docs/release-notes #GCP #DataWarehouse`;
    
    const maxDescLength = 280 - header.length - footer.length;
    let description = update.text;
    
    if (description.length > maxDescLength) {
        description = description.substring(0, maxDescLength - 3) + "...";
    }
    
    return `${header}${description}${footer}`;
}

// Open Tweet Composer Modal
function openTweetComposer(updateId) {
    const update = updatesState.find(u => u.id === updateId);
    if (!update) return;
    
    // Fill badge metadata in composer
    previewTypeBadge.textContent = update.type;
    previewTypeBadge.className = `badge ${getBadgeClass(update.type)}`;
    previewDate.textContent = update.date;
    
    // Set Draft Text
    const draftText = generateTweetText(update);
    tweetTextarea.value = draftText;
    
    // Open Overlay
    tweetModal.classList.add('active');
    
    // Reset copy state
    copyBtnText.textContent = 'Copy Text';
    copyIcon.innerHTML = '<path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />';
    
    updateCharacterCount();
    tweetTextarea.focus();
    tweetTextarea.setSelectionRange(0, 0); // scroll to top
}

// Close Tweet Composer Modal
function closeTweetModal() {
    tweetModal.classList.remove('active');
}

// Update Character count indicator
function updateCharacterCount() {
    const currentLength = tweetTextarea.value.length;
    charCounter.textContent = `${currentLength} / 280`;
    
    if (currentLength > 280) {
        charCounter.className = 'character-counter danger';
        limitWarning.style.display = 'block';
        submitTweetBtn.disabled = true;
        submitTweetBtn.style.opacity = '0.5';
    } else if (currentLength > 250) {
        charCounter.className = 'character-counter warning';
        limitWarning.style.display = 'none';
        submitTweetBtn.disabled = false;
        submitTweetBtn.style.opacity = '1';
    } else {
        charCounter.className = 'character-counter';
        limitWarning.style.display = 'none';
        submitTweetBtn.disabled = false;
        submitTweetBtn.style.opacity = '1';
    }
}

// Copy Tweet text to Clipboard
function copyTweetToClipboard() {
    const textToCopy = tweetTextarea.value;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        // Visual Success Feedback in Button
        copyBtnText.textContent = 'Copied!';
        copyIcon.innerHTML = '<path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />';
        
        showToast('Tweet copied to clipboard!');
        
        // Revert back after 3 seconds
        setTimeout(() => {
            if (tweetModal.classList.contains('active')) {
                copyBtnText.textContent = 'Copy Text';
                copyIcon.innerHTML = '<path fill="currentColor" d="M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z" />';
            }
        }, 3000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy to clipboard.');
    });
}

// Post tweet to Twitter/X via Web Intent
function postToTwitter() {
    const text = tweetTextarea.value;
    if (text.length > 280) {
        showToast('Tweet is too long to post!');
        return;
    }
    
    const encodedText = encodeURIComponent(text);
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    window.open(twitterIntentUrl, '_blank', 'width=550,height=420,menubar=no,toolbar=no,status=no');
    closeTweetModal();
    showToast('Redirected to X (Twitter) compose intent!');
}

// Display Toast Notifications
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3500);
}

// Copy card text to clipboard
window.copyCardTextToClipboard = function(updateId, btnEl) {
    const update = updatesState.find(u => u.id === updateId);
    if (!update) return;
    
    const formattedText = `📢 BigQuery Release Note [${update.type}] (${update.date}):\n\n${update.text}\n\nRead details: https://cloud.google.com/bigquery/docs/release-notes`;
    
    navigator.clipboard.writeText(formattedText).then(() => {
        const span = btnEl.querySelector('span');
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        btnEl.classList.add('copied');
        
        showToast('Release note text copied!');
        
        setTimeout(() => {
            span.textContent = originalText;
            btnEl.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Clipboard copy failed.');
    });
};

// Export filtered release notes to CSV file
function exportToCSV() {
    if (filteredUpdates.length === 0) {
        showToast('No updates to export!');
        return;
    }
    
    // CSV headers
    const headers = ['Date', 'Type', 'Description Text'];
    
    // Prepare rows and escape double quotes
    const rows = filteredUpdates.map(u => [
        u.date,
        u.type,
        u.text.replace(/"/g, '""')
    ]);
    
    // Assemble CSV content string
    const csvString = [
        headers.join(','),
        ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');
    
    // Download Blob trigger
    try {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Format file name based on filter & timestamp
        const categoryLabel = activeCategory.replace(/\s+/g, '_');
        const dateString = new Date().toISOString().slice(0, 10);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_releases_${categoryLabel}_${dateString}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast('CSV downloaded successfully!');
    } catch (err) {
        console.error('CSV export failed:', err);
        showToast('Failed to export CSV.');
    }
}

// Initialize theme from localStorage
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const iconMoon = themeToggleBtn.querySelector('.icon-moon');
    const iconSun = themeToggleBtn.querySelector('.icon-sun');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        iconMoon.style.display = 'none';
        iconSun.style.display = 'block';
    } else {
        document.body.classList.remove('light-mode');
        iconMoon.style.display = 'block';
        iconSun.style.display = 'none';
    }
}

// Toggle page color theme
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    const iconMoon = themeToggleBtn.querySelector('.icon-moon');
    const iconSun = themeToggleBtn.querySelector('.icon-sun');
    
    if (isLight) {
        localStorage.setItem('theme', 'light');
        iconMoon.style.display = 'none';
        iconSun.style.display = 'block';
        showToast('Swapped to Light Mode ☀️');
    } else {
        localStorage.setItem('theme', 'dark');
        iconMoon.style.display = 'block';
        iconSun.style.display = 'none';
        showToast('Swapped to Dark Mode 🌙');
    }
}
