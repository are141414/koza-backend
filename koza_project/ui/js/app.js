const TOTAL_PREGNANCY_DAYS = 280;

// Mock User Settings (In real app, fetch from /api/user/me)
// Setting LMP to 100 days ago for demo
const MOCK_LMP = new Date();
MOCK_LMP.setDate(MOCK_LMP.getDate() - 85);
const LMP_STRING = MOCK_LMP.toISOString().split('T')[0];

document.addEventListener('DOMContentLoaded', async () => {
    // 0. Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW Registered', reg))
            .catch(err => console.log('SW Failed', err));
    }

    // 1. Splash Screen Logic
    const urlParams = new URLSearchParams(window.location.search);
    const skipSplash = urlParams.get('splash') === 'false';

    const splash = document.getElementById('splash-screen');

    if (skipSplash && splash) {
        // Skip Immediately
        splash.style.display = 'none';
        checkAuth();
    } else {
        // Show Animation
        setTimeout(() => {
            if (splash) {
                splash.style.opacity = '0';
                setTimeout(() => {
                    splash.style.display = 'none';
                    // 2. Auth Check after Splash
                    checkAuth();
                }, 500);
            } else {
                checkAuth();
            }
        }, 3000); // 3 Seconds
    }
});

function checkAuth() {
    // Basic Mock Auth
    const startAuth = document.getElementById('auth-overlay');
    const appContainer = document.getElementById('app-container');
    const bottomNav = document.querySelector('.bottom-nav');

    // Check if user is logged in (Mock ID 1)
    const user = localStorage.getItem('user_id'); // We set this on login

    if (!user) {
        if (startAuth) startAuth.style.display = 'flex';
        if (appContainer) appContainer.style.display = 'none';
        if (bottomNav) bottomNav.style.display = 'none';
    } else {
        if (startAuth) startAuth.style.display = 'none';
        if (appContainer) appContainer.style.display = 'block';
        if (bottomNav) bottomNav.style.display = 'flex';

        // 1. Initial Data Load
        // loadPregnancyData(); -> MOVING INSIDE PROFILE CHECK
        // loadForumPreview();

        // Check Profile
        checkProfileCompleteness(user).then(isComplete => {
            if (isComplete) {
                if (startAuth) startAuth.style.display = 'none';
                if (appContainer) appContainer.style.display = 'block';
                if (bottomNav) bottomNav.style.display = 'flex';

                loadPregnancyData();
                loadForumPreview();
            } else {
                // Redirect to setup
                // Prevent redirect loop if we are already on setup page?
                // app.js is typically only included in main pages. setup_profile.html has its own script.
                window.location.href = 'setup_profile.html';
            }
        });
    }
}

async function checkProfileCompleteness(userId) {
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/pregnancy/profile/${userId}`);
        if (!res.ok) return false;
        const data = await res.json();
        return !!data.last_period_date; // True if date exists
    } catch (e) {
        console.error("Profile check failed", e);
        return false;
    }
}

function handleLogin() {
    const email = document.getElementById('login-email').value;
    if (email) {
        localStorage.setItem('user_id', 1); // Mock ID
        localStorage.setItem('user_email', email);
        location.reload();
    } else {
        alert("Lütfen e-posta girin.");
    }
}

function switchMainTab(tabName) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');

    // Show selected
    const view = document.getElementById(`view-${tabName}`);
    if (view) view.style.display = 'block';

    // Update Nav Active State
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const navs = document.querySelectorAll('.nav-item');
    // Simple index mapping or class based
    // Assuming order: Home, Forum, Tools, Profile
    if (tabName === 'home' && navs[0]) navs[0].classList.add('active');
    if (tabName === 'forum' && navs[1]) navs[1].classList.add('active');
    if (tabName === 'tools' && navs[2]) navs[2].classList.add('active');

    if (tabName === 'forum') {
        loadForumPreview(); // Reload posts
    }
}

// OLD LOAD (Removed from top but used in checkAuth)
async function loadPregnancyData() {
    try {
        // A. Calculate Status
        const calcResponse = await fetch('http://127.0.0.1:8000/api/pregnancy/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lmp_date: LMP_STRING })
        });
        const statusData = await calcResponse.json();

        updateProgressUI(statusData);

        // B. Get Weekly Info
        const devResponse = await fetch(`http://127.0.0.1:8000/api/pregnancy/development/${statusData.current_week}`);
        const devData = await devResponse.json();

        updateDevelopmentUI(devData);

    } catch (error) {
        console.error("API Error:", error);
        document.getElementById('dev-description').textContent = "Could not load data. Ensure backend is running.";
    }
}

function updateProgressUI(data) {
    // Elements
    document.getElementById('week-display').textContent = `${data.current_week}. Hafta`;
    document.getElementById('trimester-display').textContent = `${data.trimester}. Trimester`;
    document.getElementById('exact-progress').textContent = data.week_day_string;
    document.getElementById('days-left').textContent = `${data.days_remaining} gün kaldı`;

    // 3. Update Progress Bar (Percentage of 40 weeks)
    const progressPercent = (data.current_week / 40) * 100;
    // Cap at 100%
    const finalPercent = Math.min(Math.max(progressPercent, 0), 100);

    document.getElementById('week-progress-bar').style.width = `${finalPercent}%`;
    document.getElementById('progress-text').textContent = `%${Math.floor(finalPercent)}`;

    // Mock summary for demo if backend doesn't provide
    document.getElementById('dev-short-summary').textContent = `Bebeğiniz yaklaşık ${Math.floor(data.baby_weight_grams)}g ağırlığında ve ${Math.floor(data.baby_length_mm / 10)}cm uzunluğunda. Parmak izleri oluşuyor!`;

    // 4. Update Weekly Insights Summary
    // Note: data.description is for baby, mother_advice for mom. Nutrition might be missing in older mocks.
    document.getElementById('insight-baby-short').textContent = data.description ? data.description.substring(0, 40) + "..." : "Yükleniyor...";
    document.getElementById('insight-mom-short').textContent = data.mother_advice ? data.mother_advice.substring(0, 40) + "..." : "Yükleniyor...";
    document.getElementById('insight-nutrition-short').textContent = data.nutrition_advice ? data.nutrition_advice.substring(0, 40) + "..." : "Sağlıklı beslenin!";
}

function openInsightModal(type) {
    // Navigate to the Article Detail page with type parameter
    window.location.href = `article_detail.html?type=${type}`;
}

function updateDevelopmentUI(data) {
    document.getElementById('fruit-name').textContent = data.baby_size_comparison || "Unknown Info";
    document.getElementById('dev-description').textContent = data.description || "No description available for this week.";

    // Map some fruits to emojis for the demo if image_url is just a mock
    const emojiMap = { "Lemon": "🍋", "Avocado": "🥑", "Lime": "🍈", "Lentil": "🥚" };
    // Just for demo purposes, picking a random fruit emoji if not mapped
    const randomFruits = ["🥝", "🍇", "🍑", "🥭"];
    const emoji = emojiMap[data.baby_size_comparison] || randomFruits[data.week % randomFruits.length];

    document.getElementById('fruit-icon').textContent = emoji;
}

async function loadForumPreview(category = null, query = null, authorId = null) {
    const container = document.getElementById('forum-container');
    container.innerHTML = '<p style="text-align:center; color:#999; grid-column: 1/-1;">Loading discussions...</p>';

    try {
        let url = 'http://127.0.0.1:8000/api/forum/posts?';
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (query) params.append('q', query);
        if (authorId) params.append('author_id', authorId);

        const response = await fetch(url + params.toString());
        if (!response.ok) throw new Error('Failed to fetch posts');

        const posts = await response.json();

        renderForumPosts(posts);

    } catch (error) {
        console.error("Forum Error:", error);
        container.innerHTML = '<p style="text-align:center; color:red; grid-column: 1/-1;">Connection error. Backend running?</p>';
    }
}

function renderForumPosts(posts) {
    const container = document.getElementById('forum-container');
    container.innerHTML = '';

    if (posts.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; width: 100%;">No topics found.</p>';
        return;
    }

    posts.forEach(post => {
        const card = document.createElement('div');
        card.className = 'forum-card';
        card.onclick = () => onCardPress(post.id); // onPress event

        // Random avatar color
        const avatarColor = '#' + Math.floor(Math.random() * 16777215).toString(16);

        // Time Algo
        const timeAgo = getTimeAgo(new Date(post.created_at));

        // Comments count (mock for now if not in list endpoint, or assume 0)
        // In real feed, use post.replies_count if available
        const commentCount = Math.floor(Math.random() * 20);

        card.innerHTML = `
            < div class="card-header" >
                <div class="author-avatar" style="background:${avatarColor}"></div>
                <div style="flex:1;">
                    <span class="author-name">User #${post.author_id}</span>
                </div>
                
                <div class="menu-container" onclick="event.stopPropagation()">
                    <button class="btn-menu-dots" onclick="toggleMenu('menu-post-${post.id}')">⋮</button>
                    <div id="menu-post-${post.id}" class="menu-dropdown">
                        <button class="menu-item danger" onclick="openReportModal('post', ${post.id})">⚠️ Report Content</button>
                        <button class="menu-item" onclick="blockUser(${post.author_id})">🚫 Block User</button>
                    </div>
                </div>
            </div >
             <div class="post-meta-time" style="font-size:0.75rem; color:#ccc; margin-left: 3.5rem; margin-top:-0.5rem; margin-bottom:0.5rem;">
                ${timeAgo}
             </div>
            
            <h4 class="post-title">${post.title}</h4>
            
            <div class="post-footer">
                <div class="comment-count">
                    <span>💬</span> ${commentCount} Comments
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl önce";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay önce";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün önce";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " saat önce";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dk önce";
    return Math.floor(seconds) + " sn önce";
}

function onCardPress(postId) {
    // Navigate to detail page
    window.location.href = `post_detail.html ? id = ${postId} `;
}

async function loadPostDetails(postId) {
    try {
        // 1. Get Post Info (Currently we don't have single post endpoint, reusing list for demo or using mock)
        // Ideally: fetch(`http://127.0.0.1:8000/api/forum/posts/${postId}`)
        // For now, we will Mock if API is not extended, OR fetch list and find.
        // Let's assume we can fetch list for now as a workaround
        const response = await fetch('http://127.0.0.1:8000/api/forum/posts'); // Simple hack for demo
        const posts = await response.json();
        const post = posts.find(p => p.id == postId) || posts[0]; // Fallback

        if (post) {
            document.getElementById('detail-title').textContent = post.title;
            document.getElementById('detail-content').textContent = post.content;
            document.getElementById('detail-author').textContent = `User #${post.author_id}`;
            document.getElementById('detail-time').textContent = new Date(post.created_at).toLocaleString();
        }

        // 2. Get Comments
        const commentsResp = await fetch(`http://127.0.0.1:8000/api/forum/posts/${postId}/comments`);
        const comments = await commentsResp.json();
        renderComments(comments);

    } catch (e) { console.error(e); }
}

function renderComments(comments) {
    const list = document.getElementById('comments-list');
    list.innerHTML = '';

    if (comments.length === 0) {
        list.innerHTML = '<p class="center-text" style="color:#999; margin-top:1rem;">Be the first to comment!</p>';
        return;
    }

    comments.forEach(c => {
        const div = document.createElement('div');
        div.className = 'comment-card';
        div.innerHTML = `
            <span class="comment-author-name">User #${c.author_id}</span>
            <p class="comment-text">${c.content}</p>
        `;
        list.appendChild(div);
    });
}

async function submitComment() {
    const input = document.getElementById('comment-input');
    const content = input.value.trim();
    if (!content) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    // MOCK User ID 1
    const body = {
        post_id: parseInt(postId),
        user_id: 1,
        content: content
    };

    try {
        const res = await fetch('http://127.0.0.1:8000/api/forum/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            input.value = '';
            loadPostDetails(postId); // Refresh
        }
    } catch (e) { alert("Error sending comment"); }
}

function filterForum(category) {
    loadForumPreview(category);
}

// Debounce search
let searchTimeout;
function searchForum(query) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadForumPreview(null, query);
    }, 500);
}

function filterMyTopics() {
    // Mocking logged in user as User ID 1 for now
    loadForumPreview(null, null, 1);
}

function openNewTopicModal() {
    document.getElementById('create-topic-modal').style.display = 'flex';
}

function closeNewTopicModal() {
    document.getElementById('create-topic-modal').style.display = 'none';
}

async function submitNewTopic() {
    const title = document.getElementById('new-topic-title').value;
    const content = document.getElementById('new-topic-content').value;
    const category = document.getElementById('new-topic-category').value;
    const isAnon = document.getElementById('new-topic-anon').checked;

    if (!title || !content) {
        alert("Please fill in all fields");
        return;
    }

    const body = {
        title: title,
        content: content,
        category_id: category,
        user_id: 1 // Mock User ID
        // Note: isAnon logic isn't in backend model yet, but front-end is ready.
    };

    try {
        const res = await fetch('http://127.0.0.1:8000/api/forum/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (res.ok) {
            alert("Konu başarıyla oluşturuldu!");
            closeNewTopicModal();
            loadForumPreview(null); // Refresh list

            // Clear inputs
            document.getElementById('new-topic-title').value = '';
            document.getElementById('new-topic-content').value = '';
        } else {
            console.error(await res.text());
            alert("Konu oluşturulamadı");
        }
    } catch (e) {
        console.error(e);
        alert("Bağlantı hatası");
    }
}

function navigateTo(screen) {
    console.log("Navigating to:", screen);
    if (screen === 'forum') {
        // Scroll to forum section or distinct page if we had one
        document.querySelector('.forum-section').scrollIntoView({ behavior: 'smooth' });
    } else if (screen === 'water') {
        window.location.href = 'water_tracker.html';
    } else if (screen === 'settings') {
        window.location.href = 'settings.html';
    } else if (screen === 'kick') {
        window.location.href = 'kick_counter.html';
    } else if (screen === 'weight') {
        window.location.href = 'weight_tracker.html';
    } else if (screen === 'profile') {
        window.location.href = 'profile.html';
    } else if (screen === 'hospital') {
        window.location.href = 'hospital_bag.html';
    } else if (screen === 'names') {
        window.location.href = 'baby_names.html';
    } else if (screen === 'gallery') {
        window.location.href = 'gallery.html';
    } else if (screen === 'nutrition') {
        window.location.href = 'nutrition.html';
    } else if (screen === 'diary') {
        window.location.href = 'diary.html';
    } else {
        alert(`Navigating to ${screen.charAt(0).toUpperCase() + screen.slice(1)} Module... (Coming Soon)`);
    }
}

// --- Menu & Reporting ---
function toggleMenu(menuId) {
    // Close all other menus first
    document.querySelectorAll('.menu-dropdown').forEach(m => {
        if (m.id !== menuId) m.classList.remove('show');
    });

    const menu = document.getElementById(menuId);
    if (menu) menu.classList.toggle('show');
}

// Close menus when clicking outside
window.onclick = function (event) {
    if (!event.target.matches('.btn-menu-dots')) {
        document.querySelectorAll('.menu-dropdown').forEach(m => m.classList.remove('show'));
    }
}

function openReportModal(type, id) {
    document.getElementById('report-target-type').value = type;
    document.getElementById('report-target-id').value = id;
    document.getElementById('report-modal').style.display = 'flex';
}

function closeReportModal() {
    document.getElementById('report-modal').style.display = 'none';
}

async function submitReport() {
    const type = document.getElementById('report-target-type').value;
    const id = document.getElementById('report-target-id').value;

    // Get selected radio
    const radios = document.getElementsByName('report_reason');
    let reason = "Unspecified";
    for (const r of radios) {
        if (r.checked) {
            reason = r.value;
            break;
        }
    }

    const endpoint = type === 'post' ? `/posts/${id}/report` : `/comments/${id}/report`;

    try {
        const res = await fetch(`http://127.0.0.1:8000/api/forum${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: reason })
        });

        if (res.ok) {
            alert("Thank you. The content has been flagged for review.");
            closeReportModal();
        } else {
            alert("Failed to report.");
        }
    } catch (e) {
        alert("Connection error.");
    }
}
