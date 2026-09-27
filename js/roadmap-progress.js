// Shared, non-destructive migration for skill IDs that changed during roadmap normalization.
window.roadmapProgress = (() => {
  const STORAGE_KEY = "roadmapSkillStatus";
  const RENAMED_IDS = {
    "Systems Engineer": {
      "batch5-systems-engineer-lifecycle-management": "batch5-systems-engineer-lifecycle"
    },
    "Deep Learning Engineer": {
      "dleng-serving-optimization": "dleng-optimization"
    },
    "Penetration Tester": {
      "pentest-access-control-testing": "pentest-authorization"
    }
  };
  const MERGED_IDS = {
    "Full-Stack Developer": {
      "html-and-css": ["html", "css"],
      "responsive-design-and-accessibility": ["responsive-design", "accessibility"],
      "js-variables-and-js-functions-and-js-arrays-objects": ["js-variables", "js-functions", "js-arrays-objects"],
      "dom-and-events-and-es6": ["dom", "events", "es6"],
      "async-js-and-fetch-api": ["async-js", "fetch-api"],
      "git-basics-and-github": ["git-basics", "github"],
      "commits-and-branches": ["commits", "branches"],
      "pull-requests-and-command-line": ["pull-requests", "command-line"],
      "react-and-components-and-props": ["react", "components", "props"],
      "state-and-hooks": ["state", "hooks"],
      "forms-and-routing-and-api-integration": ["forms", "routing", "api-integration"],
      "node-and-express-and-http": ["node", "express", "http"],
      "rest-and-middleware-and-validation": ["rest", "middleware", "validation"],
      "authentication-and-authorization-and-error-handling": ["authentication", "authorization", "error-handling"],
      "sql-and-tables-and-crud": ["sql", "tables", "crud"],
      "joins-and-database-design": ["joins", "database-design"],
      "database-integration-and-nosql": ["database-integration", "nosql"],
      "testing-and-security-and-environment-variables": ["testing", "security", "environment-variables"],
      "docker-and-deployment-and-code-organization": ["docker", "deployment", "code-organization"],
      "debugging-and-logging": ["debugging", "logging"]
    },
    "Data Scientist": {
      "datasci-pipelines-and-datasci-feature-engineering": ["datasci-pipelines", "datasci-feature-engineering"],
      "datasci-capstone-model-and-datasci-model-serving": ["datasci-capstone-model", "datasci-model-serving"]
    },
    "Data Analyst": {
      "analyst-quality-checks-and-analyst-python-analytics": ["analyst-quality-checks", "analyst-python-analytics"]
    }
  };

  const readSkillStatusesByRole = (storage = localStorage) => {
    const stored = JSON.parse(storage.getItem(STORAGE_KEY)) || {};
    const isRoleScoped = Object.values(stored).some((value) => value && typeof value === "object" && !Array.isArray(value));
    const statusesByRole = isRoleScoped
      ? stored
      : Object.keys(stored).length ? { "Full-Stack Developer": stored } : {};
    let changed = !isRoleScoped && Object.keys(stored).length > 0;

    for (const [role, statuses] of Object.entries(statusesByRole)) {
      if (!statuses || typeof statuses !== "object" || Array.isArray(statuses)) continue;

      for (const [newId, oldId] of Object.entries(RENAMED_IDS[role] || {})) {
        const oldStatus = statuses[oldId];
        if (!Object.prototype.hasOwnProperty.call(statuses, newId) && oldStatus !== null && oldStatus !== undefined && oldStatus !== "") {
          statuses[newId] = oldStatus;
          changed = true;
        }
      }

      for (const [newId, oldIds] of Object.entries(MERGED_IDS[role] || {})) {
        if (Object.prototype.hasOwnProperty.call(statuses, newId)) continue;
        const allCompleted = oldIds.every((id) => statuses[id] === "Completed");
        const hasSavedStatus = oldIds.some((id) => Object.prototype.hasOwnProperty.call(statuses, id)
          && statuses[id] !== null && statuses[id] !== undefined && statuses[id] !== "");
        if (allCompleted) {
          statuses[newId] = "Completed";
          changed = true;
        } else if (hasSavedStatus) {
          statuses[newId] = "In Progress";
          changed = true;
        }
      }
    }

    if (changed) storage.setItem(STORAGE_KEY, JSON.stringify(statusesByRole));
    return statusesByRole;
  };

  const calculateProgress = (roadmap, skillStatuses, missionStatuses) => {
    const stages = roadmap?.stages || [];
    const skills = stages.flatMap((stage) => stage.skills || []);
    const completedSkills = skills.filter((item) => skillStatuses[item.id] === "Completed").length;
    const completedMissions = stages.filter((stage) => Boolean(missionStatuses[stage.title])).length;
    return {
      completed: completedSkills + completedMissions,
      total: skills.length + stages.length
    };
  };

  return { readSkillStatusesByRole, calculateProgress };
})();
