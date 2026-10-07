// Account settings actions for the signed-in dashboard.
(() => {
  const dialog = document.querySelector("#delete-account-dialog");
  if (!dialog) return;

  const openButton = document.querySelector("#delete-account-open");
  const cancelButton = document.querySelector("#delete-account-cancel");
  const form = document.querySelector("#delete-account-form");
  const confirmation = document.querySelector("#delete-account-confirmation");
  const submitButton = document.querySelector("#delete-account-submit");
  const errorMessage = document.querySelector("#delete-account-error");
  const statusMessage = document.querySelector("#account-settings-message");
  let submitting = false;

  function showError(text) {
    errorMessage.textContent = text;
    errorMessage.hidden = false;
  }

  function hideError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
  }

  function updateSubmitState() {
    submitButton.disabled = submitting || confirmation.value !== "DELETE";
  }

  openButton.addEventListener("click", () => {
    hideError();
    statusMessage.hidden = true;
    confirmation.value = "";
    updateSubmitState();
    dialog.showModal();
    confirmation.focus();
  });

  confirmation.addEventListener("input", updateSubmitState);
  cancelButton.addEventListener("click", () => {
    if (!submitting) dialog.close("cancel");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && !submitting) dialog.close("cancel");
  });
  dialog.addEventListener("close", () => {
    if (dialog.returnValue !== "deleted") {
      form.reset();
      hideError();
      updateSubmitState();
      openButton.focus();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    if (confirmation.value !== "DELETE") {
      showError("Type DELETE exactly to confirm account deletion.");
      confirmation.focus();
      updateSubmitState();
      return;
    }

    submitting = true;
    hideError();
    updateSubmitState();
    openButton.disabled = true;
    cancelButton.disabled = true;
    submitButton.textContent = "Deleting account...";

    try {
      const authState = await window.accountAuth.ready;
      if (!authState?.user) throw new Error("Your session has expired.");

      const { data, error } = await window.accountAuth.client.functions.invoke("delete-account");
      if (error || data?.success !== true) throw new Error("Account deletion was not confirmed.");

      statusMessage.textContent = "Your account has been deleted. Redirecting to login...";
      statusMessage.classList.add("show", "success");
      statusMessage.hidden = false;
      dialog.close("deleted");

      try {
        window.accountAuth.userStorage(authState.user.id).clear();
      } catch (_storageError) {
        // Continue signing out and redirecting if browser storage is unavailable.
      }
      try {
        await window.accountAuth.client.auth.signOut({ scope: "local" });
      } catch (_signOutError) {
        // The Auth user is already deleted; continue to the signed-out page.
      }
      window.location.replace("login.html");
    } catch (_error) {
      showError("We couldn't complete account deletion. Please try again. If the problem continues, contact support.");
    } finally {
      submitting = false;
      openButton.disabled = false;
      cancelButton.disabled = false;
      submitButton.textContent = "Delete My Account";
      updateSubmitState();
    }
  });
})();
