// Email/password sign-up and sign-in handlers shared by the account pages.
(() => {
  const form = document.querySelector("#account-form");
  if (!form) return;

  const message = document.querySelector("#form-message");
  const submitButton = form.querySelector("button[type='submit']");
  const mode = form.dataset.mode;

  function showMessage(text, success = false, actions = []) {
    message.replaceChildren(document.createTextNode(text));
    actions.forEach(({ label, href }) => {
      message.append(document.createTextNode(" "));
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      message.append(link);
    });
    message.classList.add("show");
    message.classList.toggle("success", success);
  }

  window.accountAuth.ready.catch(() => {});

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.classList.remove("show", "success");

    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const password = String(data.get("password") || "");
    const confirmation = String(data.get("passwordConfirmation") || "");
    if (!form.querySelector("input[type='email']").checkValidity()) {
      showMessage("Enter a valid email address.");
      return;
    }
    if (!email || !password) {
      showMessage("Enter your email address and password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      showMessage("Choose a password with at least 8 characters.");
      return;
    }
    if (mode === "signup" && password !== confirmation) {
      showMessage("The passwords do not match.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = mode === "signup" ? "Creating account…" : "Logging in…";
    try {
      await window.accountAuth.ready;
      let result;
      if (mode === "signup") {
        result = await window.accountAuth.client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: new URL("dashboard.html", window.location.href).href }
        });
      } else {
        result = await window.accountAuth.client.auth.signInWithPassword({ email, password });
      }

      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) {
        showMessage("Account created. Check your email to verify your address, then log in to continue.", true);
        form.reset();
        return;
      }

      const user = result.data.user || result.data.session?.user;
      if (!user) throw new Error("Authentication succeeded, but no user session was returned.");
      window.location.replace(await window.accountAuth.destinationForUser(user));
    } catch (error) {
      const normalized = String(error?.message || "").toLowerCase();
      if (normalized.includes("invalid login credentials") || normalized.includes("invalid credentials")) {
        showMessage("The email or password is incorrect.");
      } else if (normalized.includes("email not confirmed")) {
        showMessage("Verify your email address before logging in.");
      } else if (mode === "signup" && (
        error?.code === "user_already_exists" ||
        normalized.includes("user already registered") ||
        normalized.includes("user already exists")
      )) {
        showMessage("Email already exists. Please log in or reset your password.", false, [
          { label: "Log in", href: "login.html" },
          { label: "Reset password", href: "forgot-password.html" }
        ]);
      } else if (normalized.includes("password should be at least") || normalized.includes("password is too weak")) {
        showMessage("Choose a stronger password that meets the project's password requirements.");
      } else if (normalized.includes("profiles") || normalized.includes("row-level security") || normalized.includes("permission denied")) {
        showMessage("Your account is signed in, but profile storage is not ready. Please try again later or contact support.");
      } else {
        showMessage(error?.message || "We could not complete authentication. Please try again.");
      }
      console.error("Authentication failed:", error);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = mode === "signup" ? "Create Account" : "Log In";
    }
  });
})();
