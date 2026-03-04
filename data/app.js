// Initialize Lucide Icons
lucide.createIcons();

// Mock Users Data
let users = [
    { username: '0811111111', password: 'password', name: 'คุณสมชาย', role: 'customer', address: '123 ถนนสุขุมวิท กทม 10110' },
    { username: 'admin', password: 'password', name: 'Staff A', role: 'staff', address: '-' }
];
let currentUser = null;

// Mock Data
let orders = [
    { id: 'VN-1001', username: '0811111111', name: 'คุณสมชาย', items: 'ไวนิล 1x1m', status: 'done', date: '2026-02-20', file: 'design_somchai.ai' },
    { id: 'VN-1002', username: '0899999999', name: 'บจก. รวยมาก', items: 'ไวนิล 3x5m', status: 'printing', date: '2026-02-22', file: 'billboard_v2.pdf' },
    { id: 'VN-1010', username: '0888888888', name: 'ร้านกาแฟเอย', items: 'ไวนิล 1.5x2m', status: 'pending', date: '2026-02-23', file: 'menu_new.png' }
];

// --- Authentication & Profile Logic ---
let authMode = 'login';

function openAuthModal() {
    document.getElementById('auth-modal').style.display = 'flex';
    switchAuthTab('login');
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

function switchAuthTab(mode) {
    authMode = mode;
    document.getElementById('tab-login').classList.toggle('active', mode === 'login');
    document.getElementById('tab-register').classList.toggle('active', mode === 'register');
    document.getElementById('reg-fields').classList.toggle('hidden', mode === 'login');
    document.getElementById('auth-title').innerText = mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
    document.getElementById('auth-submit-btn').innerText = mode === 'login' ? 'เข้าสู่ระบบ' : 'ยืนยันสมัครสมาชิก';
}

function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;

    if (authMode === 'login') {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            loginUser(user);
            closeAuthModal();
        } else {
            alert('เบอร์โทรศัพท์ (Username) หรือรหัสผ่านไม่ถูกต้อง');
        }
    } else {
        // Register
        if (users.find(u => u.username === username)) {
            alert('เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว กรุณาเข้าสู่ระบบ');
            return;
        }
        const name = document.getElementById('auth-name').value || 'User';
        const role = document.getElementById('auth-role').value;
        const newUser = { username, password, name, role, address: '' };
        users.push(newUser);
        loginUser(newUser);
        closeAuthModal();
        alert('สมัครสมาชิกสำเร็จ!');
    }
}

function loginUser(user) {
    currentUser = user;
    document.getElementById('nav-login').classList.add('hidden');
    document.getElementById('nav-profile').classList.remove('hidden');
    document.getElementById('nav-logout').classList.remove('hidden');
    document.getElementById('user-display-name').innerText = user.name.split(' ')[0];

    // Auto fill order form
    if (document.getElementById('order-name')) document.getElementById('order-name').value = user.name;
    if (document.getElementById('order-phone')) document.getElementById('order-phone').value = user.username;
}

function logout() {
    currentUser = null;
    document.getElementById('nav-login').classList.remove('hidden');
    document.getElementById('nav-profile').classList.add('hidden');
    document.getElementById('nav-logout').classList.add('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('ออกจากระบบแล้ว');
}

function openProfile() {
    if (!currentUser) return;

    // If the user is staff, route completely to the admin panel directly
    if (currentUser.role === 'staff') {
        openAdminPanel();
        return;
    }

    document.getElementById('profile-section').classList.remove('hidden');
    document.getElementById('admin-panel').classList.add('hidden');

    // Populate form
    document.getElementById('prof-name').value = currentUser.name;
    document.getElementById('prof-phone').value = currentUser.username;
    document.getElementById('prof-address').value = currentUser.address;

    // Populate history table
    const userOrders = orders.filter(o => o.username === currentUser.username);
    const historyBody = document.getElementById('user-history-body');
    historyBody.innerHTML = userOrders.map(o => `
        <tr>
            <td><b>${o.id}</b></td>
            <td>${o.items}</td>
            <td><span class="status-badge status-${o.status}">${statusToThai(o.status)}</span></td>
        </tr>
    `).join('') || `<tr><td colspan="3" style="text-align:center;">ยังไม่มีประวัติการสั่งงาน</td></tr>`;

    // Hide the staff dashboard button since staffs go directly to admin panel now
    const staffBtnContainer = document.getElementById('staff-dashboard-btn-container');
    if (staffBtnContainer) {
        staffBtnContainer.innerHTML = '';
    }

    scrollToId('profile-section');
}

function updateProfile(e) {
    e.preventDefault();
    if (!currentUser) return;
    currentUser.name = document.getElementById('prof-name').value;
    currentUser.address = document.getElementById('prof-address').value;
    document.getElementById('user-display-name').innerText = currentUser.name.split(' ')[0];
    alert('บันทึกข้อมูลส่วนตัวเรียบร้อย');
}

// Price calculation
function calculatePrice() {
    const width = parseFloat(document.getElementById('calc-width').value) || 0;
    const height = parseFloat(document.getElementById('calc-height').value) || 0;
    const rate = parseFloat(document.getElementById('calc-material').value) || 0;

    const area = width * height;
    const total = area * rate;

    document.getElementById('total-price').innerText = Math.max(0, total).toLocaleString();
    return { width, height, total };
}

// Navigation helpers
function scrollToId(id) {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
}

// Modals
function openOrderModal() {
    document.getElementById('order-modal').style.display = 'flex';
}

function closeOrderModal() {
    document.getElementById('order-modal').style.display = 'none';
}

function openOrderModalWithData() {
    const data = calculatePrice();
    document.getElementById('order-width').value = data.width;
    document.getElementById('order-height').value = data.height;
    openOrderModal();
}

// Track Order
function trackOrder() {
    const id = document.getElementById('track-id').value.toUpperCase();
    const resultDiv = document.getElementById('track-result');

    if (!id) return alert('กรุณากรอกเลขที่ออเดอร์');

    // Check mock data
    const order = orders.find(o => o.id === id);

    if (order) {
        resultDiv.classList.remove('hidden');
        let statusHtml = `
            <h3>สถานะออเดอร์: ${id}</h3>
            <div class="track-steps">
                <div class="track-step done"><b>รับออเดอร์แล้ว</b> (ได้รับเมื่อ ${order.date})</div>
                <div class="track-step ${order.status !== 'pending' ? 'done' : 'current'}"><b>กำลังดำเนินการ / ตรวจไฟล์</b></div>
                <div class="track-step ${order.status === 'done' ? 'done' : (order.status === 'printing' ? 'current' : '')}"><b>กำลังผลิต</b></div>
                <div class="track-step ${order.status === 'done' ? 'current' : ''}"><b>พร้อมจัดส่ง / รับเอง</b></div>
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-outline" style="color: white; border-color: rgba(255,255,255,0.3)" onclick="reorder('${id}')">
                    <i data-lucide="refresh-cw" style="width:16px"></i> สั่งซ้ำจากประวัติเดิม
                </button>
            </div>
        `;
        resultDiv.innerHTML = statusHtml;
        lucide.createIcons();
    } else {
        resultDiv.classList.remove('hidden');
        resultDiv.innerHTML = `<p style="color: var(--accent)">ขออภัย ไม่พบเลขที่ออเดอร์นี้ในระบบ</p>`;
    }
}

function reorder(id) {
    const order = orders.find(o => o.id === id);
    if (order) {
        document.getElementById('order-name').value = order.name;
        // Parse items string (e.g., "ไวนิล 1x1m")
        const parts = order.items.match(/(\d+(\.\d+)?)x(\d+(\.\d+)?)/);
        if (parts) {
            document.getElementById('order-width').value = parts[1];
            document.getElementById('order-height').value = parts[3];
        }
        openOrderModal();
        alert('ระบบได้ดึงข้อมูลจากออเดอร์เดิมมาให้แล้ว กรุณาตรวจสอบและอัปโหลดไฟล์ใหม่');
    }
}

// Order Form Submission
document.getElementById('order-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('order-name').value;
    const newId = 'VN-' + (1000 + orders.length + 1);

    // Simulate API call
    const newOrder = {
        id: newId,
        username: currentUser ? currentUser.username : document.getElementById('order-phone').value,
        name: name,
        items: `ไวนิล ${document.getElementById('order-width').value}x${document.getElementById('order-height').value}m`,
        status: 'pending',
        date: new Date().toISOString().split('T')[0],
        file: 'upload_' + Date.now()
    };

    orders.unshift(newOrder); // Add to front

    alert(`สั่งงานสำเร็จ! เลขที่ออเดอร์ของคุณคือ ${newId}\nกรุณาจดจำเลขนี้เพื่อติดตามสถานะ`);
    closeOrderModal();
    updateAdminTable();

    // Auto update history if profile is open
    if (currentUser && !document.getElementById('profile-section').classList.contains('hidden')) {
        openProfile();
    }
});

// --- Admin ---
function openAdminPanel() {
    if (!currentUser || currentUser.role !== 'staff') {
        alert('สิทธิ์การใช้งานนี้สงวนไว้สำหรับพนักงานเท่านั้น');
        return;
    }
    document.getElementById('admin-panel').classList.remove('hidden');
    document.getElementById('profile-section').classList.add('hidden');
    updateAdminTable();
    initChart();
    scrollToId('admin-panel');
}

function updateAdminTable() {
    const body = document.getElementById('admin-orders-body');
    body.innerHTML = orders.map(o => `
        <tr>
            <td><b>${o.id}</b></td>
            <td>${o.name}</td>
            <td>${o.items}</td>
            <td><span class="status-badge status-${o.status}">${statusToThai(o.status)}</span></td>
            <td><a href="#" class="file-link"><i data-lucide="file-down" style="width:16px"></i> ${o.file}</a></td>
            <td>
                <select onchange="updateStatus('${o.id}', this.value)" style="width: auto; padding: 4px;">
                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>รอดำเนินการ</option>
                    <option value="printing" ${o.status === 'printing' ? 'selected' : ''}>กำลังผลิต</option>
                    <option value="done" ${o.status === 'done' ? 'selected' : ''}>เสร็จแล้ว</option>
                </select>
            </td>
        </tr>
    `).join('');
    lucide.createIcons(); // Refresh icons for the table
}

function statusToThai(s) {
    if (s === 'pending') return 'รอดำเนินการ';
    if (s === 'printing') return 'กำลังผลิต';
    if (s === 'done') return 'เสร็จแล้ว';
    return s;
}

function updateStatus(id, newStatus) {
    const order = orders.find(o => o.id === id);
    if (order) order.status = newStatus;
    updateAdminTable();
}

function switchAdminTab(tab) {
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById('admin-' + tab).classList.remove('hidden');
    event.target.classList.add('active');

    if (tab === 'reports') initChart();
}

// Chart Serialization
let salesChart = null;
function initChart() {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (salesChart) salesChart.destroy();

    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'],
            datasets: [{
                label: 'ยอดขาย (บาท)',
                data: [12000, 19000, 3000, 5000, 20000, 30000, 15000],
                borderColor: '#3b82f6',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// File Drop Simulation
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        document.getElementById('file-info').innerText = `ไฟล์ที่เลือก: ${fileInput.files[0].name}`;
        document.getElementById('file-info').classList.remove('hidden');
    }
});
