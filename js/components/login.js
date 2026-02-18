// ============================================================
// PEA-AIMS Login Component
// ============================================================

import { store } from '../store.js';
import { auth } from '../services/auth.js';

export function renderLogin() {
    return `
    <div class="login-page" id="loginPage">
        <div class="login-background">
            <div class="login-bg-shape shape-1"></div>
            <div class="login-bg-shape shape-2"></div>
            <div class="login-bg-shape shape-3"></div>
        </div>
        <div class="login-card">
            <div class="login-header">
                <div class="login-logo">
                    <svg viewBox="0 0 80 80" class="pea-logo-svg large">
                        <circle cx="40" cy="40" r="38" fill="#103889" stroke="#FFD700" stroke-width="3"/>
                        <path d="M40 12 L46 32 L64 32 L50 44 L55 64 L40 53 L25 64 L30 44 L16 32 L34 32 Z" fill="#FFD700"/>
                    </svg>
                </div>
                <h1 class="login-title">PEA-Serialization</h1>
                <p class="login-subtitle">Road to Recloser 22kV Serialization</p>
            </div>
            <form class="login-form" id="loginForm">
                <div class="form-group">
                    <label for="loginUsername">
                        <i data-lucide="user"></i>
                        Username
                    </label>
                    <input type="text" id="loginUsername" placeholder="Enter username" required autocomplete="username" />
                </div>
                <div class="form-group">
                    <label for="loginPassword">
                        <i data-lucide="lock"></i>
                        Password
                    </label>
                    <div class="password-wrapper">
                        <input type="password" id="loginPassword" placeholder="Enter password" required autocomplete="current-password" />
                        <button type="button" class="password-toggle" id="passwordToggle">
                            <i data-lucide="eye"></i>
                        </button>
                    </div>
                </div>
                <div class="login-error" id="loginError" style="display:none;">
                    <i data-lucide="alert-circle"></i>
                    <span id="loginErrorText"></span>
                </div>
                <button type="submit" class="btn btn-primary btn-login" id="btnLogin">
                    <i data-lucide="log-in"></i>
                    <span>Sign In</span>
                    <div class="btn-loader" id="loginLoader" style="display:none;">
                        <div class="spinner"></div>
                    </div>
                </button>
            </form>
            <div class="login-footer">
                <p>Provincial Electricity Authority</p>
                <p class="login-demo-hint">Powered by สหกรณ์'90</p>
            </div>
        </div>
    </div>
    `;
}

export function initLogin() {
    const form = document.getElementById('loginForm');
    const passwordToggle = document.getElementById('passwordToggle');

    if (passwordToggle) {
        passwordToggle.addEventListener('click', () => {
            const input = document.getElementById('loginPassword');
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            // Toggle icon
            const icon = passwordToggle.querySelector('i');
            if (icon) icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
            if (window.lucide) lucide.createIcons();
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            const errorText = document.getElementById('loginErrorText');
            const loader = document.getElementById('loginLoader');
            const btnText = document.querySelector('#btnLogin span');

            if (!username || !password) {
                errorDiv.style.display = 'flex';
                errorText.textContent = 'Please enter both username and password';
                return;
            }

            // Show loading
            errorDiv.style.display = 'none';
            loader.style.display = 'block';
            if (btnText) btnText.textContent = 'Signing in...';

            const result = await auth.login(username, password);

            loader.style.display = 'none';
            if (btnText) btnText.textContent = 'Sign In';

            if (result.success) {
                store.set('currentView', 'dashboard');
            } else {
                errorDiv.style.display = 'flex';
                errorText.textContent = result.message || 'Login failed';
                // Shake animation
                document.querySelector('.login-card')?.classList.add('shake');
                setTimeout(() => document.querySelector('.login-card')?.classList.remove('shake'), 600);
            }
        });
    }
}
