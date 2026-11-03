 const authView = document.getElementById("authView");
const appShell = document.getElementById("appShell");

const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authSubmit = document.getElementById("authSubmit");

const nameGroup = document.getElementById("nameGroup");
const authName = document.getElementById("authName");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authError = document.getElementById("authError");

const authSwitchText = document.getElementById("authSwitchText");
const authSwitchButton = document.getElementById("authSwitchButton");
const logoutButton = document.getElementById("logoutButton");
const userDisplayName = document.getElementById("userDisplayName");
const userAvatar = document.getElementById("userAvatar");

let authMode = "login";

function getUsers() {
    return JSON.parse(localStorage.getItem("shieldAIUsers") || "[]");
}

function saveUsers(users) {
    localStorage.setItem("shieldAIUsers", JSON.stringify(users));
}

function showAuth() {
    authView.hidden = false;
    appShell.hidden = true;
}

function showApp(user) {
    authView.hidden = true;
    appShell.hidden = false;

    if (user) {
        userDisplayName.textContent = user.name;
        userAvatar.textContent = user.name.charAt(0).toUpperCase();
    }
}

function setAuthMode(mode) {
    authMode = mode;
    authError.textContent = "";

    const registering = mode === "register";

    authTitle.textContent = registering
        ? "Create your account"
        : "Welcome back";

    authSubtitle.textContent = registering
        ? "Register to access your workspace."
        : "Sign in to continue to your workspace.";

    authSubmit.textContent = registering
        ? "Create account"
        : "Sign in";

    nameGroup.hidden = !registering;
    authName.required = registering;

    authPassword.autocomplete = registering
        ? "new-password"
        : "current-password";

    authSwitchText.textContent = registering
        ? "Already have an account?"
        : "Don't have an account?";

    authSwitchButton.textContent = registering
        ? "Sign in"
        : "Register";
}

authSwitchButton.addEventListener("click", () => {
    setAuthMode(authMode === "login" ? "register" : "login");
});

authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    authError.textContent = "";

    const name = authName.value.trim();
    const email = authEmail.value.trim().toLowerCase();
    const password = authPassword.value;

    const users = getUsers();

    if (authMode === "register") {
        if (!name) {
            authError.textContent = "Please enter your name.";
            return;
        }

        if (users.some(user => user.email === email)) {
            authError.textContent = "An account with this email already exists.";
            return;
        }

        const newUser = { name, email, password };
        users.push(newUser);
        saveUsers(users);

        // Return to login after successful registration
        authForm.reset();
        setAuthMode("login");
        authEmail.value = email;
        authPassword.value = "";
        authError.textContent = "Account created successfully. Please sign in.";
        return;
    }

    const user = users.find(
        user => user.email === email && user.password === password
    );

    if (!user) {
        authError.textContent = "Invalid email or password.";
        return;
    }

    sessionStorage.setItem("shieldAISession", email);
    showApp(user);
    authForm.reset();
});

logoutButton.addEventListener("click", () => {
    sessionStorage.removeItem("shieldAISession");
    authForm.reset();
    setAuthMode("login");
    showAuth();
});

const activeSession = sessionStorage.getItem("shieldAISession");

if (activeSession) {
    const user = getUsers().find(user => user.email === activeSession);

    if (user) {
        showApp(user);
    } else {
        sessionStorage.removeItem("shieldAISession");
        showAuth();
    }
} else {
    showAuth();
}

setAuthMode("login");