window.accountAuth.ready.then(async (authState) => {
  if (!authState?.user || authState.redirected) return;
  const localStorage = window.accountAuth.userStorage(authState.user.id);
  const studentProfile = window.accountAuth.studentProfile(authState.profile);
  if (!studentProfile) return;
// One renderer handles every roadmap selected by studentProfile.targetRole.
const roadmapPage = document.querySelector(".roadmap-page");

if (roadmapPage) {
    const roadmap = window.roadmapData?.[studentProfile.targetRole];
    const title = document.querySelector("#roadmap-title");
    const description = document.querySelector("#roadmap-description");
    const stagesElement = document.querySelector("#roadmap-stages");
    const message = document.querySelector("#roadmap-message");
    const targetRole = studentProfile.targetRole || "Full-Stack Developer";
    let authoritativeState;
    try {
      authoritativeState = await window.roadmapProgress.loadAuthoritativeState(localStorage);
    } catch (error) {
      console.error("Roadmap progress could not be loaded:", error);
      message.textContent = "Roadmap progress could not be loaded from your account. Your saved local progress is unchanged. Please try refreshing.";
      return;
    }
    const statuses = { ...(authoritativeState.skillStatusesByRole[targetRole] || {}) };
    const missionStatus = { ...(authoritativeState.missionStatusesByRole[targetRole] || {}) };
    const readRoleScopedState = (key) => {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || "{}");
        if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
        const isScoped = Object.values(stored).some((value) => value && typeof value === "object" && !Array.isArray(value));
        return isScoped ? stored : (Object.keys(stored).length ? { "Full-Stack Developer": stored } : {});
      } catch { return {}; }
    };
    let skillStateByRole = {};
    try { skillStateByRole = window.roadmapProgress.readSkillStatusesByRole(localStorage, false); } catch { skillStateByRole = {}; }
    const missionStateByRole = readRoleScopedState("roadmapMissionStatus");
    const progressByRole = (() => {
      try {
        const stored = JSON.parse(localStorage.getItem("roadmapProgress") || "{}");
        if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {};
        return Object.prototype.hasOwnProperty.call(stored, "completed") || Object.prototype.hasOwnProperty.call(stored, "total")
          ? { "Full-Stack Developer": stored }
          : stored;
      } catch { return {}; }
    })();

    if (!roadmap) {
      title.textContent = `${studentProfile.targetRole} roadmap coming soon`;
      description.textContent = "Your personalized roadmap is being prepared. You can return to your dashboard while we add this role.";
    } else {
      title.textContent = roadmap.title;
      description.textContent = roadmap.description;
      const allSkills = roadmap.stages.flatMap((stage) => stage.skills);
      const totalItems = allSkills.length + roadmap.stages.length;
      const summaryValues = {
        completed: document.querySelector("#completed-skills"),
        remaining: document.querySelector("#remaining-skills"),
        stage: document.querySelector("#current-stage"),
        action: document.querySelector("#next-action")
      };

      const updateSummary = () => {
        const completedSkills = allSkills.filter((item) => statuses[item.id] === "Completed").length;
        const currentStage = roadmap.stages.find((stage) =>
          !stage.skills.every((item) => statuses[item.id] === "Completed") || !missionStatus[stage.mission.id]
        );

        summaryValues.completed.textContent = completedSkills;
        summaryValues.remaining.textContent = allSkills.length - completedSkills;

        if (!currentStage) {
          summaryValues.stage.textContent = "All stages completed";
          summaryValues.action.textContent = "Start your next professional challenge";
          return;
        }

        summaryValues.stage.textContent = currentStage.title;
        const nextSkill = currentStage.skills.find((item) => statuses[item.id] !== "Completed");
        summaryValues.action.textContent = nextSkill ? `Complete ${nextSkill.title}` : `Complete ${currentStage.mission.title}`;
      };

      const saveProgress = (writeCache = true) => {
        const progress = window.roadmapProgress.calculateProgress(roadmap, statuses, missionStatus);
        const completed = progress.completed;
        const percentage = Math.max(0, Math.min(100, progress.total ? Math.round((completed / progress.total) * 100) : 0));
        skillStateByRole[targetRole] = statuses;
        progressByRole[targetRole] = { completed, total: totalItems };
        if (writeCache) {
          skillStateByRole[targetRole] = statuses;
          missionStateByRole[targetRole] ||= {};
          roadmap.stages.forEach((stage) => { missionStateByRole[targetRole][stage.title] = missionStatus[stage.mission.id] === true; });
          try {
            localStorage.setItem("roadmapSkillStatus", JSON.stringify(skillStateByRole));
            localStorage.setItem("roadmapMissionStatus", JSON.stringify(missionStateByRole));
            localStorage.setItem("roadmapProgress", JSON.stringify(progressByRole));
          } catch (error) { console.warn("Roadmap progress cache could not be updated:", error); }
        }
        document.querySelector("#roadmap-progress-value").textContent = `${percentage}%`;
        document.querySelector("#roadmap-progress-count").textContent = `${completed} of ${totalItems} completed items`;
        document.querySelector("#roadmap-progress-bar").style.width = `${percentage}%`;
        document.querySelector(".roadmap-overview .progress-bar").setAttribute("aria-valuenow", percentage);
        updateSummary();
      };

      const statusClass = (stage) => {
        const stageSkills = stage.skills;
        const finished = missionStatus[stage.mission.id] && (stageSkills.length === 0 || stageSkills.every((item) => statuses[item.id] === "Completed"));
        const started = stageSkills.some((item) => statuses[item.id] && statuses[item.id] !== "Not Started") || missionStatus[stage.mission.id];
        return finished ? "completed" : started ? "in-progress" : "future";
      };
      const resourceTypes = {
        video: { label: "Video", icon: "🎥" }, article: { label: "Article", icon: "📖" },
        course: { label: "Course", icon: "📚" }, interactive: { label: "Interactive", icon: "💻" },
        documentation: { label: "Documentation", icon: "📘" }, practice: { label: "Practice", icon: "🧪" },
        tool: { label: "Tool", icon: "🛠️" }
      };
      const resourceType = (itemResource) => {
        const source = `${itemResource.title || itemResource.name || ""} ${itemResource.url || ""}`.toLowerCase();
        const legacyType = (itemResource.type || "").toLowerCase();
        const inferredType = legacyType === "tutorial"
          ? (/learn\.|course|academy|freecodecamp|kaggle|training/.test(source) ? "course" : "article")
          : legacyType;
        const type = resourceTypes[inferredType] ? inferredType :
          (/youtube|video/.test(source) ? "video" :
            /interactive|sqlbolt|skills\.github|codelab|lab|playground/.test(source) ? "interactive" :
              /course|academy|freecodecamp|kaggle|training|learn\.microsoft/.test(source) ? "course" :
                /tool|playwright|postman/.test(source) ? "tool" :
                  /article|blog|guide|tutorial/.test(source) ? "article" : "documentation");
        return { type, ...resourceTypes[type] };
      };
      const stageState = (stage, index, currentIndex) => {
        if (statusClass(stage) === "completed") return "completed";
        return index === currentIndex ? "current" : "upcoming";
      };
      const render = () => {
        const currentIndex = roadmap.stages.findIndex((stage) => statusClass(stage) !== "completed");
        const openSkillIds = new Set([...stagesElement.querySelectorAll(".skill-detail.open")].map((detail) => detail.id));
        stagesElement.innerHTML = `<div class="journey-start"><span class="journey-start-icon" aria-hidden="true">◎</span><div><span class="eyebrow">YOUR TARGET</span><strong>${studentProfile.targetRole || roadmap.title}</strong><small>Every milestone moves you closer to your goal.</small></div></div>${roadmap.stages.map((stage, index) => {
          const state = stageState(stage, index, currentIndex);
          const stageNumber = String(index + 1).padStart(2, "0");
          const isCapstone = index === roadmap.stages.length - 1;
          return `<article class="roadmap-stage journey-${state} ${isCapstone ? "capstone-stage" : ""}">
            <div class="stage-node" aria-label="Stage ${stageNumber}, ${state}">${state === "completed" ? "✓" : stageNumber}</div>
            <div class="stage-card">
              <div class="stage-heading"><div><p class="eyebrow">${isCapstone ? "FINAL DESTINATION" : `MILESTONE ${stageNumber}`}</p><h2>${stage.title}</h2></div><span class="stage-state-label">${state === "current" ? "CURRENT STAGE" : state === "completed" ? "COMPLETED" : "UPCOMING"}</span></div>
              <div class="stage-flow" aria-label="Learn, practice, build, complete, move forward"><span>LEARN</span><i>↓</i><span>PRACTICE</span><i>↓</i><span>BUILD</span><i>↓</i><span>COMPLETE</span><i>↓</i><span>NEXT</span></div>
              <div class="skill-list">${stage.skills.length ? stage.skills.map((item) => {
                const isCompleted = statuses[item.id] === "Completed";
                const isOpen = openSkillIds.has(`detail-${item.id}`);
                return `<article class="skill-item ${isCompleted ? "skill-completed" : ""}">
                  <div class="skill-row">
                    <label class="skill-completion"><input type="checkbox" data-skill-complete="${item.id}" ${isCompleted ? "checked" : ""} aria-label="${isCompleted ? `Mark ${item.title} not completed` : `Mark ${item.title} completed`}"><span class="skill-checkmark" aria-hidden="true"></span></label>
                    <button type="button" class="skill-expand" data-skill-toggle="${item.id}" aria-expanded="${isOpen}" aria-controls="detail-${item.id}">
                      <span class="skill-toggle-copy"><strong>${item.title}</strong><small>${item.what}</small></span>
                      <span class="skill-status-text">${isCompleted ? "Completed" : "Not completed"}</span>
                    </button>
                  </div>
                  <div class="skill-detail ${isOpen ? "open" : ""}" id="detail-${item.id}">
                    <div class="detail-section"><h3>What</h3><p>${item.what}</p></div>
                    <div class="detail-section"><h3>Where</h3><ul class="resource-list">${item.resources.slice(0, 4).map((itemResource) => {
                      const type = resourceType(itemResource);
                      const resourceTitle = itemResource.title || itemResource.name || itemResource.url;
                      return `<li class="resource-item resource-${type.type}"><span class="resource-type"><span aria-hidden="true">${type.icon}</span> ${type.label}</span><div class="resource-copy">${itemResource.description ? `<p>${itemResource.description}</p>` : ""}<a href="${itemResource.url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${resourceTitle} in a new tab">${resourceTitle}<span aria-hidden="true"> ↗</span></a></div></li>`;
                    }).join("")}</ul></div>
                    <div class="detail-section"><h3>How</h3><p>${item.how}</p></div>
                    <div class="detail-section practice-section"><h3>Practice</h3><p>${item.practice}</p></div>
                  </div>
                </article>`;
              }).join("") : `<p class="capstone-note">Bring every skill from your journey together in a complete, portfolio-ready project.</p>`}</div>
              <section class="mission-card ${isCapstone ? "mission-capstone" : ""} ${missionStatus[stage.mission.id] ? "mission-completed" : ""}" aria-label="${isCapstone ? "Final capstone project" : "Stage mission"}">
                <div class="mission-content"><p class="eyebrow">${isCapstone ? "🏆 FINAL CAPSTONE" : `🧪 PRACTICAL MISSION ${stageNumber}`}</p><h3>${stage.mission.title}</h3><p class="mission-description">${stage.mission.description}</p><p class="mission-why"><strong>Why this matters:</strong> ${stage.mission.why}</p><ul>${stage.mission.tasks.map((task) => `<li>${task}</li>`).join("")}</ul>${stage.mission.finalMilestone ? `<p class="milestone">${stage.mission.finalMilestone}</p>` : ""}</div>
                <label class="mission-complete"><input type="checkbox" data-mission="${stage.mission.id}" ${missionStatus[stage.mission.id] ? "checked" : ""}><span class="mission-checkmark" aria-hidden="true">✓</span><span>${missionStatus[stage.mission.id] ? "Mission completed" : "Mark mission complete"}</span></label>
              </section>
            </div>
          </article>`;
        }).join("")}<div class="journey-finish"><span aria-hidden="true">✦</span><strong>Keep moving forward</strong><small>Your next professional challenge starts with the skills you build here.</small></div>`;
        saveProgress();
      };
      stagesElement.addEventListener("click", (event) => {
        const toggle = event.target.closest("[data-skill-toggle]");
        if (toggle) {
          const detail = document.querySelector(`#detail-${toggle.dataset.skillToggle}`);
          const isOpen = detail.classList.toggle("open");
          toggle.setAttribute("aria-expanded", isOpen);
        }
      });
      stagesElement.addEventListener("change", (event) => {
        if (event.target.matches("[data-skill-complete]")) {
          const id = event.target.dataset.skillComplete;
          const wasCompleted = statuses[id] === "Completed";
          const checked = event.target.checked;
          event.target.disabled = true;
          (async () => {
            try {
              if (checked) {
                await window.progressStore.upsertRoadmapSkillProgress({ target_role: targetRole, skill_id: id, status: "Completed" });
                statuses[id] = "Completed";
              } else {
                await window.progressStore.deleteRoadmapSkillProgress(targetRole, id);
                delete statuses[id];
              }
              message.textContent = "";
              render();
            } catch (error) {
              console.error("Roadmap skill update failed:", error);
              if (wasCompleted) statuses[id] = "Completed"; else delete statuses[id];
              message.textContent = "This skill could not be saved to your account. Your existing local progress was preserved. Please try again.";
              render(false);
            }
            [...stagesElement.querySelectorAll("[data-skill-complete]")].find((control) => control.dataset.skillComplete === id)?.focus();
          })();
        } else if (event.target.matches("[data-mission]")) {
          const id = event.target.dataset.mission;
          const wasCompleted = missionStatus[id] === true;
          const checked = event.target.checked;
          event.target.disabled = true;
          (async () => {
            try {
              if (checked) {
                await window.progressStore.upsertRoadmapMissionProgress({ target_role: targetRole, mission_id: id, completed: true });
                missionStatus[id] = true;
              } else {
                await window.progressStore.deleteRoadmapMissionProgress(targetRole, id);
                delete missionStatus[id];
              }
              message.textContent = checked ? "Mission marked as completed." : "";
              render();
            } catch (error) {
              console.error("Roadmap mission update failed:", error);
              if (wasCompleted) missionStatus[id] = true; else delete missionStatus[id];
              message.textContent = "This mission could not be saved to your account. Your existing local progress was preserved. Please try again.";
              render(false);
            }
          })();
        }
      });
      render(false);
  }
}

});
