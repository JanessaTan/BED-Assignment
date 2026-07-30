const API_BASE = '/api/auth';

const registerForm = document.getElementById('registerForm');
const errorEl = document.getElementById('registerError');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (password !== confirmPassword) {
    errorEl.textContent = 'Passwords do not match.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.message || 'Registration failed.';
      return;
    }

    window.location.href = 'login.html';
  } catch (err) {
    console.error(err);
    errorEl.textContent = 'Something went wrong. Please try again.';
  }
});