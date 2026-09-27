window.accountAuth.ready.then((authState) => {
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
    const readRoleScopedState = (key) => {
      const stored = JSON.parse(localStorage.getItem(key)) || {};
      const isScoped = Object.values(stored).some((value) => value && typeof value === "object" && !Array.isArray(value));
      const scoped = isScoped ? stored : {};
      if (!isScoped && Object.keys(stored).length) {
        // Existing flat skill/mission maps predate role-specific roadmaps.
        // Their IDs and stage names belong to the original Full-Stack roadmap.
        scoped["Full-Stack Developer"] = stored;
        localStorage.setItem(key, JSON.stringify(scoped));
      }
      return scoped;
    };
    const skillStateByRole = window.roadmapProgress.readSkillStatusesByRole(localStorage);
    const missionStateByRole = readRoleScopedState("roadmapMissionStatus");
    const progressByRole = (() => {
      const stored = JSON.parse(localStorage.getItem("roadmapProgress")) || {};
      if (Object.prototype.hasOwnProperty.call(stored, "completed") || Object.prototype.hasOwnProperty.call(stored, "total")) {
        const scoped = { "Full-Stack Developer": stored };
        localStorage.setItem("roadmapProgress", JSON.stringify(scoped));
        return scoped;
      }
      return stored;
    })();
    const statuses = skillStateByRole[targetRole] || {};
    const missionStatus = missionStateByRole[targetRole] || {};

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
          !stage.skills.every((item) => statuses[item.id] === "Completed") || !missionStatus[stage.title]
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

      const saveProgress = () => {
        const completedSkills = allSkills.filter((item) => statuses[item.id] === "Completed").length;
        const completedMissions = roadmap.stages.filter((stage) => missionStatus[stage.title]).length;
        const completed = completedSkills + completedMissions;
        skillStateByRole[targetRole] = statuses;
        missionStateByRole[targetRole] = missionStatus;
        progressByRole[targetRole] = { completed, total: totalItems };
        localStorage.setItem("roadmapSkillStatus", JSON.stringify(skillStateByRole));
        localStorage.setItem("roadmapMissionStatus", JSON.stringify(missionStateByRole));
        localStorage.setItem("roadmapProgress", JSON.stringify(progressByRole));
        document.querySelector("#roadmap-progress-value").textContent = completed ? `${Math.round((completed / totalItems) * 100)}%` : "Not started";
        document.querySelector("#roadmap-progress-count").textContent = `${completed} of ${totalItems} completed items`;
        document.querySelector("#roadmap-progress-bar").style.width = `${Math.round((completed / totalItems) * 100)}%`;
        document.querySelector(".roadmap-overview .progress-bar").setAttribute("aria-valuenow", Math.round((completed / totalItems) * 100));
        updateSummary();
      };

      const statusClass = (stage) => {
        const stageSkills = stage.skills;
        const finished = missionStatus[stage.title] && (stageSkills.length === 0 || stageSkills.every((item) => statuses[item.id] === "Completed"));
        const started = stageSkills.some((item) => statuses[item.id] && statuses[item.id] !== "Not Started") || missionStatus[stage.title];
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
      const statusChoiceKey = (status) => status.toLowerCase().replace(/\s+/g, "-");
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
                const currentStatus = statuses[item.id] || "Not Started";
                const statusKey = statusChoiceKey(currentStatus);
                const isOpen = openSkillIds.has(`detail-${item.id}`);
                return `<article class="skill-item skill-${statusKey}">
                  <button class="skill-toggle" data-skill="${item.id}" aria-expanded="${isOpen}" aria-controls="detail-${item.id}">
                    <span class="skill-status-symbol" aria-hidden="true">${currentStatus === "Completed" ? "✓" : currentStatus === "In Progress" ? "◐" : "○"}</span>
                    <span class="skill-toggle-copy"><strong>${item.title}</strong><small>${item.what}</small></span>
                    <span class="skill-status-text">${currentStatus}</span><b aria-hidden="true">${isOpen ? "−" : "+"}</b>
                  </button>
                  <div class="skill-detail ${isOpen ? "open" : ""}" id="detail-${item.id}">
                    <div class="detail-section"><h3>What</h3><p>${item.what}</p></div>
                    <div class="detail-section"><h3>Where</h3><ul class="resource-list">${item.resources.slice(0, 4).map((itemResource) => {
                      const type = resourceType(itemResource);
                      const resourceTitle = itemResource.title || itemResource.name || itemResource.url;
                      return `<li class="resource-item resource-${type.type}"><span class="resource-type"><span aria-hidden="true">${type.icon}</span> ${type.label}</span><div class="resource-copy">${itemResource.description ? `<p>${itemResource.description}</p>` : ""}<a href="${itemResource.url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${resourceTitle} in a new tab">${resourceTitle}<span aria-hidden="true"> ↗</span></a></div></li>`;
                    }).join("")}</ul></div>
                    <div class="detail-section"><h3>How</h3><p>${item.how}</p></div>
                    <div class="detail-section practice-section"><h3>Practice</h3><p>${item.practice}</p></div>
                    <div class="skill-status-controls" role="group" aria-label="Set ${item.title} status"><span class="status-controls-label">STATUS</span>${["Not Started", "In Progress", "Completed"].map((status) => `<button type="button" class="status-choice ${currentStatus === status ? "selected" : ""} status-choice-${statusChoiceKey(status)}" data-skill-status="${item.id}" data-value="${status}" aria-pressed="${currentStatus === status}">${status === "Completed" ? "✓ " : status === "In Progress" ? "◐ " : "○ "}${status}</button>`).join("")}</div>
                  </div>
                </article>`;
              }).join("") : `<p class="capstone-note">Bring every skill from your journey together in a complete, portfolio-ready project.</p>`}</div>
              <section class="mission-card ${isCapstone ? "mission-capstone" : ""} ${missionStatus[stage.title] ? "mission-completed" : ""}" aria-label="${isCapstone ? "Final capstone project" : "Stage mission"}">
                <div class="mission-content"><p class="eyebrow">${isCapstone ? "🏆 FINAL CAPSTONE" : `🧪 PRACTICAL MISSION ${stageNumber}`}</p><h3>${stage.mission.title}</h3><p class="mission-description">${stage.mission.description}</p><p class="mission-why"><strong>Why this matters:</strong> ${stage.mission.why}</p><ul>${stage.mission.tasks.map((task) => `<li>${task}</li>`).join("")}</ul>${stage.mission.finalMilestone ? `<p class="milestone">${stage.mission.finalMilestone}</p>` : ""}</div>
                <label class="mission-complete"><input type="checkbox" data-mission="${stage.title}" ${missionStatus[stage.title] ? "checked" : ""}><span class="mission-checkmark" aria-hidden="true">✓</span><span>${missionStatus[stage.title] ? "Mission completed" : "Mark mission complete"}</span></label>
              </section>
            </div>
          </article>`;
        }).join("")}<div class="journey-finish"><span aria-hidden="true">✦</span><strong>Keep moving forward</strong><small>Your next professional challenge starts with the skills you build here.</small></div>`;
        saveProgress();
      };
      stagesElement.addEventListener("click", (event) => {
        const toggle = event.target.closest(".skill-toggle");
        const statusChoice = event.target.closest("[data-skill-status]");
        if (toggle) {
          const detail = document.querySelector(`#detail-${toggle.dataset.skill}`);
          const isOpen = detail.classList.toggle("open");
          toggle.setAttribute("aria-expanded", isOpen);
          toggle.querySelector("b").textContent = isOpen ? "−" : "+";
        }
        if (statusChoice) {
          const id = statusChoice.dataset.skillStatus;
          statuses[id] = statusChoice.dataset.value;
          message.textContent = `Skill status updated to ${statuses[id]}.`;
          render();
        }
      });
      stagesElement.addEventListener("change", (event) => {
        if (event.target.matches("[data-mission]")) {
          missionStatus[event.target.dataset.mission] = event.target.checked;
          message.textContent = event.target.checked ? "Mission marked as completed." : "Mission marked as incomplete.";
          render();
        }
      });
      render();
  }
}

});
