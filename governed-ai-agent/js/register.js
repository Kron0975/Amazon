
const registerForm = document.getElementById("registerForm");
const registerName = document.getElementById("registerName");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const confirmPassword = document.getElementById("confirmPassword");
const registerMessage = document.getElementById("registerMessage");

async function hashPassword(password) {
    const data = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    return Array.from(new Uint8Array(hashBuffer))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

registerForm.addEventListener("submit", async event => {
    event.preventDefault();
    registerMessage.textContent = "";

    const name = registerName.value.trim();
    const email = registerEmail.value.trim().toLowerCase();
    const password = registerPassword.value;
    const confirm = confirmPassword.value;

    if (password.length < 8) {
        registerMessage.textContent = "Password must be at least 8 characters.";
        return;
    }

    if (password !== confirm) {
        registerMessage.textContent = "Passwords do not match.";
        return;
    }

    const users = JSON.parse(localStorage.getItem("shieldaiUsers") || "[]");

    if (users.some(user => user.email === email)) {
        registerMessage.textContent = "An account with this email already exists.";
        return;
    }

    const passwordHash = await hashPassword(password);

    users.push({
        name,
        email,
        passwordHash,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem("shieldaiUsers", JSON.stringify(users));

    registerMessage.style.color = "#8be0b0";
    registerMessage.textContent = "Account created successfully. Redirecting to login...";

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1000);
});
