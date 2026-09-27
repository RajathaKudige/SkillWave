// Opens and closes the navigation menu on smaller screens.
const menuButton = document.querySelector(".menu-button");
const navLinks = document.querySelector(".nav-links");

if (menuButton && navLinks) {
  menuButton.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", isOpen);
  });

  // Close the mobile menu after a visitor selects a link.
  navLinks.addEventListener("click", (event) => {
    if (event.target.tagName === "A") {
      navLinks.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  });
}

// Onboarding form: roles change based on the selected career domain.
const onboardingForm = document.querySelector("#onboarding-form");

if (onboardingForm) {
  const domainSelect = document.querySelector("#domain");
  const trackSelect = document.querySelector("#career-track");
  const roleSelect = document.querySelector("#target-role");
  const trackField = document.querySelector("#track-field");
  const roleField = document.querySelector("#role-field");
  const message = document.querySelector("#form-message");
  const careersByDomain = {
    Technology: {
      "Software & Web Development": ["Frontend Developer", "Backend Developer", "Full-Stack Developer", "Software Engineer", "Web Developer", "Application Developer", "API Developer"],
      "Mobile App Development": ["Android Developer", "iOS Developer", "Flutter Developer", "React Native Developer", "Mobile App Developer"],
      "AI & Machine Learning": ["AI Engineer", "Machine Learning Engineer", "AI/ML Engineer", "Deep Learning Engineer", "Generative AI Engineer", "NLP Engineer", "Computer Vision Engineer", "AI Research Engineer"],
      Cybersecurity: ["Cybersecurity Analyst", "Cybersecurity Engineer", "Security Analyst", "Security Engineer", "SOC Analyst", "Penetration Tester", "Ethical Hacker", "Application Security Engineer", "Cloud Security Engineer", "Security Architect", "Digital Forensics Analyst"],
      "Cloud & DevOps": ["Cloud / DevOps Engineer", "Cloud Engineer", "Cloud Architect", "Cloud Developer", "DevOps Engineer", "DevSecOps Engineer", "Site Reliability Engineer", "Platform Engineer", "Infrastructure Engineer"],
      "Networking & Infrastructure": ["Network Engineer", "Network Administrator", "Network Architect", "Systems Administrator", "Systems Engineer", "IT Support Engineer"],
      "Blockchain & Web3": ["Blockchain Developer", "Blockchain Engineer", "Smart Contract Developer", "Web3 Developer", "Solidity Developer"],
      "Game Development": ["Game Developer", "Unity Developer", "Unreal Engine Developer", "Gameplay Programmer", "Game Designer", "Technical Artist"],
      "Testing & Quality Engineering": ["QA Engineer", "SDET", "Performance Test Engineer", "QA Lead", "Test Automation Engineer"],
      "Embedded & IoT": ["Embedded Systems Engineer", "Embedded Software Engineer", "IoT Engineer", "Firmware Engineer", "Robotics Software Engineer"],
      "Emerging Technologies": ["AR/VR Developer", "Robotics Engineer", "Quantum Computing Researcher"],
      "Autonomous Systems": ["Autonomous Systems Engineer"]
    },
    Data: { "Data Analytics": ["Data Analyst"], "Data Science": ["Data Scientist"], "Data Engineering": ["Data Engineer", "Analytics Engineer", "Data Architect"], "Business Intelligence": ["BI Analyst", "BI Developer"] },
    Design: { "UI/UX Design": ["UI Designer", "UX Designer", "UX Researcher", "Interaction Designer"], "Visual Design": ["Visual Designer"], "Product Design": ["Product Designer", "Design Systems Designer"] },
    Product: { "Product Management": ["Product Manager", "Product Owner"], "Product Marketing": ["Product Marketing Manager"] },
    Marketing: { "Digital Marketing": ["Digital Marketing Specialist", "SEO Specialist"], "Content Marketing": ["Content Strategist"], "Growth Marketing": ["Growth Marketer", "Social Media Manager"], "Brand Marketing": ["Brand Manager"] },
    "Business & Operations": { "Business Analysis & Consulting": ["Business Analyst", "Business Consultant"], "Operations Management": ["Operations Analyst"], Sales: ["Sales Executive"], "Business Development": ["Business Development Executive"] },
    "Finance & Accounting": { Accounting: ["Accountant", "Management Accountant"], "Financial Analysis & Planning": ["Financial Analyst", "FP&A Analyst"], "Risk & Investment": ["Risk Analyst", "Investment Analyst"] }
  };
  window.careersByDomain = careersByDomain;

  function resetRoles() {
    roleSelect.innerHTML = '<option value="">Select a career track first</option>';
    roleSelect.disabled = true;
    roleField.hidden = true;
  }

  domainSelect.addEventListener("change", () => {
    const tracks = careersByDomain[domainSelect.value] || {};
    trackSelect.innerHTML = '<option value="">Select your career track</option>';
    Object.keys(tracks).forEach((track) => {
      const option = document.createElement("option");
      option.value = track;
      option.textContent = track;
      trackSelect.appendChild(option);
    });
    trackSelect.disabled = Object.keys(tracks).length === 0;
    trackField.hidden = Object.keys(tracks).length === 0;
    resetRoles();
  });

  trackSelect.addEventListener("change", () => {
    const roles = careersByDomain[domainSelect.value]?.[trackSelect.value] || [];
    roleSelect.innerHTML = '<option value="">Select your target role</option>';
    roles.forEach((role) => {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = role;
      roleSelect.appendChild(option);
    });
    roleSelect.disabled = roles.length === 0;
    roleField.hidden = roles.length === 0;
  });

  onboardingForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(onboardingForm);
    const profile = Object.fromEntries(formData.entries());

    if (!profile.name.trim() || !profile.education || !profile.experienceLevel || !profile.domain || !profile.careerTrack || !profile.targetRole) {
      message.textContent = "Please complete all fields so we can prepare your career journey.";
      message.classList.add("show");
      return;
    }

    const submitButton = onboardingForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Saving your profile…";
    try {
      const authState = await window.accountAuth.ready;
      if (!authState?.user) throw new Error("Please create an account or log in before saving your career profile.");
      await window.accountAuth.saveCareerProfile(profile);
      // Keep the legacy profile shape available to pages that still read it.
      try { localStorage.setItem("studentProfile", JSON.stringify(profile)); } catch (storageError) { console.warn("Legacy profile cache could not be updated:", storageError); }
      window.location.replace("dashboard.html");
    } catch (error) {
      message.textContent = error.message || "We could not save your profile. Please try again.";
      message.classList.add("show");
      submitButton.disabled = false;
      submitButton.innerHTML = "Start My Journey <span>→</span>";
    }
  });
}

// Dashboard: read saved profile and progress data from localStorage.
const dashboardPage = document.querySelector(".dashboard-page");

if (dashboardPage) {
  window.accountAuth.ready.then((authState) => {
    const studentProfile = window.accountAuth.studentProfile(authState?.profile);
    if (!studentProfile) return;
    const defaultCareerProgress = { technical: null, softSkills: null, networking: null };
    const targetRole = studentProfile.targetRole || "Full-Stack Developer";
    const selectedRoadmap = window.roadmapData?.[targetRole];
    const hasSelectedRoadmap = Boolean(selectedRoadmap && Array.isArray(selectedRoadmap.stages) && selectedRoadmap.stages.every((stage) => stage && Array.isArray(stage.skills)));
    const selectedRoadmapTotal = hasSelectedRoadmap
      ? selectedRoadmap.stages.reduce((total, stage) => total + stage.skills.length + 1, 0)
      : null;
    const defaultRoadmapProgress = { completed: 0, total: selectedRoadmapTotal === null ? 10 : selectedRoadmapTotal };
    const storedCareerProgress = JSON.parse(localStorage.getItem("careerProgress"));
    const isOldPlaceholderData = storedCareerProgress && storedCareerProgress.technical === 35 && storedCareerProgress.softSkills === 25 && storedCareerProgress.networking === 20;
    const careerProgress = isOldPlaceholderData ? defaultCareerProgress : { ...defaultCareerProgress, ...storedCareerProgress };
    const storedRoadmapProgress = JSON.parse(localStorage.getItem("roadmapProgress")) || {};
    const roadmapProgressByRole = Object.prototype.hasOwnProperty.call(storedRoadmapProgress, "completed") || Object.prototype.hasOwnProperty.call(storedRoadmapProgress, "total")
      ? { "Full-Stack Developer": storedRoadmapProgress }
      : storedRoadmapProgress;
    // Save defaults once, so future pages can update the same progress values.
    localStorage.setItem("careerProgress", JSON.stringify(careerProgress));

    const getRoleStatuses = (key) => {
      const stored = JSON.parse(localStorage.getItem(key)) || {};
      const isRoleScoped = Object.values(stored).some((value) => value && typeof value === "object" && !Array.isArray(value));
      if (isRoleScoped) return stored[targetRole] || {};
      return targetRole === "Full-Stack Developer" ? stored : {};
    };
    const skillStatuses = window.roadmapProgress.readSkillStatusesByRole()[targetRole] || {};
    const missionStatuses = getRoleStatuses("roadmapMissionStatus");
    const roadmapProgress = hasSelectedRoadmap
      ? window.roadmapProgress.calculateProgress(selectedRoadmap, skillStatuses, missionStatuses)
      : roadmapProgressByRole[targetRole] || defaultRoadmapProgress;
    if (hasSelectedRoadmap) roadmapProgressByRole[targetRole] = roadmapProgress;
    localStorage.setItem("roadmapProgress", JSON.stringify(roadmapProgressByRole));

    const getPercentage = (value) => {
      if (value === null || value === undefined || value === "") return null;
      return Math.max(0, Math.min(100, Number(value) || 0));
    };
    const technical = getPercentage(careerProgress.technical);
    const savedSoftSkills = JSON.parse(localStorage.getItem("softSkillsProgress") || "{}") || {};
    const softSkillLevels = savedSoftSkills && savedSoftSkills.levels && typeof savedSoftSkills.levels === "object" ? Object.values(savedSoftSkills.levels) : [];
    const softSkillWeights = { "Not Started": 0, Beginner: 1, Developing: 2, Strong: 3 };
    const assessedSoftSkillLevels = softSkillLevels.filter((level) => Object.prototype.hasOwnProperty.call(softSkillWeights, level));
    const savedSoftSkillTotal = Math.max(1, Number(savedSoftSkills.totalSkills) || 50);
    const hasSoftSkillRatings = assessedSoftSkillLevels.some((level) => level !== "Not Started");
    const softSkills = hasSoftSkillRatings
      ? Math.round(assessedSoftSkillLevels.reduce((total, level) => total + softSkillWeights[level], 0) / (savedSoftSkillTotal * 3) * 100)
      : getPercentage(careerProgress.softSkills);
    const savedNetworkingProgress = JSON.parse(localStorage.getItem("networkingProgress") || "null");
    const networking = getPercentage(savedNetworkingProgress?.progress ?? careerProgress.networking);
    const assessedAreas = [technical, softSkills, networking].filter((value) => value !== null);
    const overall = assessedAreas.length ? Math.round(assessedAreas.reduce((total, value) => total + value, 0) / assessedAreas.length) : null;
    const roadmapTotal = selectedRoadmapTotal === null
      ? Math.max(1, Number(roadmapProgress.total) || 10)
      : Math.max(1, selectedRoadmapTotal);
    const roadmapCompleted = Math.max(0, Math.min(roadmapTotal, Number(roadmapProgress.completed) || 0));
    const roadmapPercent = Math.round((roadmapCompleted / roadmapTotal) * 100);
    const allRoadmapSkills = hasSelectedRoadmap ? selectedRoadmap.stages.flatMap((stage) => stage.skills) : [];
    const completedSkills = allRoadmapSkills.filter((skill) => skillStatuses[skill.id] === "Completed").length;
    const totalMissions = hasSelectedRoadmap ? selectedRoadmap.stages.length : 0;
    const completedMissions = hasSelectedRoadmap
      ? selectedRoadmap.stages.filter((stage) => missionStatuses[stage.title]).length
      : 0;

    const setText = (id, value) => { document.querySelector(id).textContent = value || "—"; };
    const setReadinessArea = (barId, valueId, hintId, value, emptyLabel, emptyHint) => {
      document.querySelector(barId).style.width = `${value === null ? 0 : value}%`;
      setText(valueId, value === null ? emptyLabel : `${value}%`);
      setText(hintId, value === null ? emptyHint : "Assessment complete");
    };
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const firstName = (studentProfile.name || "there").trim().split(" ")[0];

    setText("#greeting", `Good ${timeOfDay}, ${firstName} 👋`);
    setText("#hero-domain", studentProfile.domain);
    setText("#hero-track", studentProfile.careerTrack);
    setText("#hero-role", studentProfile.targetRole);
    setText("#profile-name", studentProfile.name);
    setText("#profile-initial", firstName.charAt(0).toUpperCase());
    setText("#profile-education", studentProfile.education);
    setText("#profile-experience", studentProfile.experienceLevel);
    setText("#profile-domain", studentProfile.domain);
    setText("#profile-track", studentProfile.careerTrack);
    setText("#profile-role", studentProfile.targetRole);
    setText("#overall-progress", overall === null ? "—" : `${overall}%`);
    setText("#overall-label", overall === null ? "not assessed" : "overall");
    document.querySelector("#overall-ring").style.borderTopColor = overall === null ? "#dfe8ff" : "var(--blue)";
    document.querySelector("#overall-ring").style.borderRightColor = overall === null ? "#dfe8ff" : "var(--blue)";
    setReadinessArea("#technical-bar", "#technical-value", "#technical-hint", technical, "Not assessed", "Complete your technical assessment");
    setReadinessArea("#soft-skills-bar", "#soft-skills-value", "#soft-skills-hint", softSkills, "Not assessed", "Complete your soft skills assessment");
    if (softSkills !== null) setText("#soft-skills-hint", hasSoftSkillRatings ? "Based on your skill ratings" : "Saved progress estimate");
    setReadinessArea("#networking-bar", "#networking-value", "#networking-hint", networking, "Getting started", "Begin your networking journey");
    if (networking !== null && savedNetworkingProgress && Array.isArray(savedNetworkingProgress.milestones)) setText("#networking-hint", `${savedNetworkingProgress.milestones.length} of 8 networking milestones`);
    setText("#roadmap-role", studentProfile.targetRole || "Your");
    setText("#roadmap-skills-count", hasSelectedRoadmap ? `Skills completed: ${completedSkills} of ${allRoadmapSkills.length}` : "Skills completed: —");
    setText("#roadmap-missions-count", hasSelectedRoadmap ? `Missions completed: ${completedMissions} of ${totalMissions}` : "Missions completed: —");
    setText("#roadmap-percent", `Overall progress: ${roadmapPercent}%`);
    document.querySelector("#roadmap-bar").style.width = `${roadmapPercent}%`;
  }).catch((error) => {
    console.error("Dashboard account loading failed:", error);
    window.accountAuth.showError("We could not load your account profile. Please check your connection and try again.");
  });
}
