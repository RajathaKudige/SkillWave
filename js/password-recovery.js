// Password recovery uses the single Supabase client initialized by account.js.
(() => {
  const forgotForm = document.querySelector("#forgot-password-form");
  const resetForm = document.querySelector("#reset-password-form");
  const message = document.querySelector("#form-message");
  if (!forgotForm && !resetForm) return;

  function showMessage(text, success = false) {
    message.textContent = text;
    message.classList.add("show");
    message.classList.toggle("success", success);
    message.setAttribute("role", success ? "status" : "alert");
  }

  if (forgotForm) {
    const submitButton = forgotForm.querySelector("button[type='submit']");
    const originalLabel = submitButton.textContent;
    forgotForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.classList.remove("show", "success");
      const emailInput = forgotForm.querySelector("input[type='email']");
      const email = emailInput.value.trim().toLowerCase();
      if (!emailInput.checkValidity() || !email) {
        showMessage("Enter a valid email address.");
        emailInput.focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Sending…";
      try {
        await window.accountAuth.ready;
        const redirectTo = new URL("reset-password.html", window.location.href).href;
        const { error } = await window.accountAuth.client.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
        showMessage("If an account exists for this email, we've sent a password reset link.", true);
        forgotForm.reset();
      } catch (_error) {
        showMessage("We couldn't process your request right now. Check your connection and try again shortly.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    });
  }

  if (resetForm) {
    const loginLink = document.querySelector("#reset-login-link");
    const submitButton = resetForm.querySelector("button[type='submit']");
    let recoveryAvailable = false;

    function clearRecoveryUrl() {
      if (window.location.search || window.location.hash) {
        window.history.replaceState(null, document.title, window.location.pathname);
      }
    }

    (async () => {
      try {
        await window.accountAuth.ready;
        const { data, error } = await window.accountAuth.client.auth.getSession();
        if (error) throw error;
        const sessionExists = Boolean(data.session?.user);
        const recoveryEstablished = window.accountAuth.recoveryEventReceived || sessionExists;
        recoveryAvailable = sessionExists && recoveryEstablished;
        if (recoveryAvailable) {
          // Supabase has processed any recovery callback and owns the session now.
          clearRecoveryUrl();
          resetForm.hidden = false;
          document.querySelector("#new-password").focus();
          return;
        }
      } catch (_error) {
        // Treat initialization and expired-link failures alike; never display tokens or internals.
      }
      showMessage("This password reset link is invalid or has expired. Request a new link to continue.");
      loginLink.hidden = false;
    })();

    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      message.classList.remove("show", "success");
      if (!recoveryAvailable) {
        showMessage("This password reset link is invalid or has expired. Request a new link to continue.");
        return;
      }
      const passwordInput = resetForm.querySelector("#new-password");
      const password = passwordInput.value;
      const confirmation = resetForm.querySelector("#confirm-password").value;
      if (password.length < 8) {
        showMessage("Choose a password with at least 8 characters.");
        passwordInput.focus();
        return;
      }
      if (password !== confirmation) {
        showMessage("The passwords do not match.");
        resetForm.querySelector("#confirm-password").focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Updating…";
      try {
        const { error } = await window.accountAuth.client.auth.updateUser({ password });
        if (error) throw error;
        recoveryAvailable = false;
        resetForm.reset();
        resetForm.hidden = true;
        loginLink.hidden = false;
        showMessage("Your password has been updated. You can now log in with your new password.", true);
        // End the recovery session so the next action is an intentional login.
        try {
          await window.accountAuth.client.auth.signOut();
        } catch (_signOutError) {
          // Password update succeeded; the visible success state remains authoritative.
        }
      } catch (_error) {
        showMessage("We couldn't update your password. The link may have expired, or the password may not meet the account requirements. Try again or request a new link.");
        submitButton.disabled = false;
        submitButton.textContent = "Update password";
      }
    });
  }
})();
