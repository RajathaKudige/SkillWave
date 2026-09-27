// Shared Supabase account, profile, and protected-page helpers.
(() => {
  const config = window.SUPABASE_CONFIG;
  const supabaseLibrary = window.supabase;
  const messageSelector = "#form-message, #account-message";

  if (!config?.url || !config?.publishableKey || !supabaseLibrary?.createClient) {
    window.accountAuth = {
      ready: Promise.reject(new Error("The account service could not be loaded. Check the Supabase configuration and network connection.")),
      showError(message) {
        const target = document.querySelector(messageSelector);
        if (target) {
          target.textContent = message;
          target.classList.add("show");
        }
      }
    };
    window.accountAuth.ready.catch((error) => window.accountAuth.showError(error.message));
    return;
  }

  const client = supabaseLibrary.createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  const profileColumns = "user_id,name,education,experience,domain,career_track,target_role,created_at,updated_at";

  function showError(message) {
    const target = document.querySelector(messageSelector);
    if (target) {
      target.textContent = message;
      target.classList.add("show");
    }
  }

  async function currentUser() {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user || null;
  }

  async function sessionUser() {
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session?.user || null;
  }

  async function fetchProfile(user) {
    const { data, error } = await client.from("profiles")
      .select(profileColumns)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  function studentProfile(profile) {
    if (!profile) return null;
    return {
      name: profile.name,
      education: profile.education,
      experienceLevel: profile.experience,
      domain: profile.domain,
      careerTrack: profile.career_track,
      targetRole: profile.target_role
    };
  }

  function userStorage(userId) {
    const prefix = `professional-level:${encodeURIComponent(userId || "anonymous")}:`;
    return {
      getItem(key) { return localStorage.getItem(prefix + key); },
      setItem(key, value) { localStorage.setItem(prefix + key, value); },
      removeItem(key) { localStorage.removeItem(prefix + key); }
    };
  }

  function confirmLogout() {
    const dialog = document.createElement("dialog");
    dialog.className = "logout-confirmation";
    dialog.innerHTML = '<form method="dialog"><h2>Log out?</h2><p>Are you sure you want to log out?</p><div><button value="cancel">Cancel</button><button class="button" value="logout">Log Out</button></div></form>';
    document.body.appendChild(dialog);
    return new Promise((resolve) => {
      dialog.addEventListener("close", () => {
        const shouldLogout = dialog.returnValue === "logout";
        dialog.remove();
        resolve(shouldLogout);
      }, { once: true });
      dialog.showModal();
    });
  }

  async function routeAuthenticatedUser(user, page) {
    const profile = await fetchProfile(user);
    if (page === "onboarding" && profile) {
      window.location.replace("dashboard.html");
      return { user, profile, redirected: true };
    }
    if (["dashboard", "roadmap", "softskills", "networking"].includes(page) && !profile) {
      window.location.replace("onboarding.html");
      return { user, profile: null, redirected: true };
    }
    if ((page === "login" || page === "signup") && !profile) {
      window.location.replace("onboarding.html");
      return { user, profile: null, redirected: true };
    }
    if ((page === "login" || page === "signup") && profile) {
      window.location.replace("dashboard.html");
      return { user, profile, redirected: true };
    }
    return { user, profile };
  }

  const page = document.body.dataset.accountPage;
  const ready = (async () => {
    if (!page) return { user: null, profile: null };
    const user = await sessionUser();
    if (!user) {
      const protectedPage = ["dashboard", "roadmap", "softskills", "networking"].includes(page);
      if (protectedPage) window.location.replace("login.html");
      if (page === "onboarding") window.location.replace("signup.html");
      return { user: null, profile: null, redirected: protectedPage || page === "onboarding" };
    }
    if (page === "home") {
      window.location.replace("dashboard.html");
      return { user, profile: null, redirected: true };
    }
    if (page === "navigation") return { user, profile: null };
    return routeAuthenticatedUser(user, page);
  })();

  ready.then(({ user, redirected }) => {
    document.querySelectorAll("[data-public-nav], [data-authenticated-nav], [data-public-action]")
      .forEach((element) => { element.hidden = Boolean(user) ? element.hasAttribute("data-public-nav") || element.hasAttribute("data-public-action") : element.hasAttribute("data-authenticated-nav"); });
    document.querySelectorAll("a.brand").forEach((brand) => { if (user) brand.href = "dashboard.html"; });
    if (!redirected) document.body.classList.remove("auth-pending");
  });

  ready.catch((error) => {
    console.error("Account initialization failed:", error);
    showError("We could not verify your account or load your profile. Please check your connection and try again.");
  });

  const logoutButtons = document.querySelectorAll("#logout-button, #nav-logout-button");
  if (logoutButtons.length) {
    const logout = async (logoutButton) => {
      if (!(await confirmLogout())) return;
      logoutButtons.forEach((button) => { button.disabled = true; });
      try {
        const { error } = await client.auth.signOut();
        if (error) throw error;
        window.location.replace("index.html");
      } catch (error) {
        logoutButtons.forEach((button) => { button.disabled = false; });
        showError("We could not log you out. Please try again.");
        console.error("Logout failed:", error);
      }
    };
    logoutButtons.forEach((logoutButton) => logoutButton.addEventListener("click", (event) => {
      event.preventDefault();
      logout(logoutButton);
    }));
  }

  window.accountAuth = {
    client,
    ready,
    showError,
    studentProfile,
    userStorage,
    async saveCareerProfile(formProfile) {
      const user = await currentUser();
      if (!user) throw new Error("Your session has expired. Please log in again.");
      const row = {
        user_id: user.id,
        name: formProfile.name.trim(),
        education: formProfile.education,
        experience: formProfile.experienceLevel,
        domain: formProfile.domain,
        career_track: formProfile.careerTrack,
        target_role: formProfile.targetRole
      };
      const { data, error } = await client.from("profiles")
        .upsert(row, { onConflict: "user_id" })
        .select(profileColumns)
        .single();
      if (error) throw error;
      return data;
    },
    async destinationForUser(user) {
      return (await fetchProfile(user)) ? "dashboard.html" : "onboarding.html";
    }
  };
})();
