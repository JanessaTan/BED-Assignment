// ============================================
// Login page logic
// Role is NEVER sent by the client as a choice -
// it only decides WHICH endpoint to call. The
// server independently verifies the account
// exists in the matching table before issuing
// a token with the role embedded in it.
// ============================================

const API_BASE = '/api/auth';

const roleTabs = document.querySelectorAll('.role-tab');
const customerForm = document.getElementById('customerForm');
const vendorForm = document.getElementById('vendorForm');
const guestBtn = document.getElementById('guestBtn');

// ---- Tab switching (just shows/hides the right form) ----
roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        roleTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const role = tab.dataset.role;
        customerForm.classList.toggle('active', role === 'customer');
        vendorForm.classList.toggle('active', role === 'vendor');
    });
});

// ---- Customer login ----
customerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('customerError');
    errorEl.textContent = '';

    const email = document.getElementById('customerEmail').value.trim();
    const password = document.getElementById('customerPassword').value;

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.message || 'Login failed';
            return;
        }

        // Save session info. Role comes from the SERVER response, not chosen here.
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('name', data.customer.name);
        sessionStorage.removeItem('guest');

        window.location.href = 'stalls.html';
    } catch (err) {
        console.error(err);
        errorEl.textContent = 'Something went wrong. Please try again.';
    }
});

// ---- Vendor login ----
vendorForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('vendorError');
    errorEl.textContent = '';

    const email = document.getElementById('vendorEmail').value.trim();
    const password = document.getElementById('vendorPassword').value;

    try {
        const res = await fetch(`${API_BASE}/vendor-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            errorEl.textContent = data.message || 'Login failed';
            return;
        }

        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('role', data.role);
        sessionStorage.setItem('name', data.vendor.name);
        sessionStorage.removeItem('guest');

        window.location.href = 'analytics.html';
    } catch (err) {
        console.error(err);
        errorEl.textContent = 'Something went wrong. Please try again.';
    }
});

// ---- Guest mode ----
// No account, no token. Just a flag so pages know to hide
// account-only features (order history, likes, etc.)
guestBtn.addEventListener('click', () => {
    sessionStorage.setItem('guest', 'true');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    window.location.href = 'stalls.html';
});