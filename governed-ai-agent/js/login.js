// js/login.js

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMeCheckbox = document.getElementById("rememberMe");
const togglePasswordButton = document.getElementById("togglePassword");
const errorMessage = document.getElementById("errorMessage");

// Restore remembered email, if available
const rememberedEmail = localStorage.getItem("shieldaiRememberedEmail");

if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;

    if (rememberMeCheckbox) {
        rememberMeCheckbox.checked = true;
    }
}

// Show or hide password
if (togglePasswordButton && passwordInput) {
    togglePasswordButton.addEventListener("click", () => {
        const isPasswordHidden = passwordInput.type === "password";

        passwordInput.type = isPasswordHidden ? "text" : "password";
        togglePasswordButton.textContent = isPasswordHidden ? "Hide" : "Show";
    });
}

// Convert password to SHA-256 hash
async function hashPassword(password) {
    const encodedPassword = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedPassword);

    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// Display login error
function showLoginError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = "block";
    } else {
        alert(message);
    }
}

// Handle login
if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value;

        if (errorMessage) {
            errorMessage.textContent = "";
            errorMessage.style.display = "none";
        }

        if (!email || !password) {
            showLoginError("Please enter your email and password.");
            return;
        }

        try {
            const users = JSON.parse(
                localStorage.getItem("shieldaiUsers") || "[]"
            );

            const user = users.find(
                account => account.email.toLowerCase() === email
            );

            if (!user) {
                showLoginError("No account found with this email.");
                return;
            }

            const enteredPasswordHash = await hashPassword(password);

            if (enteredPasswordHash !== user.passwordHash) {
                showLoginError("Incorrect password. Please try again.");
                return;
            }

            // Store login state only for this browser tab session
            sessionStorage.setItem("shieldaiLoggedIn", "true");
            sessionStorage.setItem(
                "shieldaiCurrentUser",
                JSON.stringify({
                    name: user.name,
                    email: user.email
                })
            );

            // Remember email only, not the login session
            if (rememberMeCheckbox && rememberMeCheckbox.checked) {
                localStorage.setItem("shieldaiRememberedEmail", email);
            } else {
                localStorage.removeItem("shieldaiRememberedEmail");
            }

            window.location.href = "index.html";
        } catch (error) {
            console.error("Login error:", error);
            showLoginError("Something went wrong. Please try again.");
        }
    });
}