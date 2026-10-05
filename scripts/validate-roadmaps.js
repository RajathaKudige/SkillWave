#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const errors = [];
const fail = (message) => errors.push(message);
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const roadmapContext = { window: {} };
const roadmapSource = read("js/roadmap-data.js");
vm.runInNewContext(roadmapSource, roadmapContext, { filename: "js/roadmap-data.js" });
const roadmaps = roadmapContext.window.roadmapData;

const onboardingElement = { addEventListener: () => {} };
const onboardingContext = {
  window: {},
  document: {
    querySelector: (selector) => selector === "#onboarding-form" || selector === "#domain" || selector === "#career-track" || selector === "#target-role" || selector === "#track-field" || selector === "#role-field" || selector === "#form-message"
      ? onboardingElement
      : null
  }
};
vm.runInNewContext(read("js/app.js"), onboardingContext, { filename: "js/app.js" });
const careersByDomain = onboardingContext.window.careersByDomain;

if (!roadmaps || typeof roadmaps !== "object" || Array.isArray(roadmaps)) {
  console.error("roadmapData must be an object.");
  process.exit(1);
}
if (!careersByDomain || typeof careersByDomain !== "object") {
  console.error("app.js must expose its onboarding career registry as window.careersByDomain.");
  process.exit(1);
}

const resourceTypes = new Set(["article", "course", "documentation", "interactive", "practice", "tool", "video"]);
const roleNames = Object.keys(roadmaps);
const onboardingOccurrences = [];
const allMissionIds = new Set();
let totalStages = 0;
let totalMissions = 0;
for (const [domain, tracks] of Object.entries(careersByDomain)) {
  if (!tracks || typeof tracks !== "object" || Array.isArray(tracks)) {
    fail(`Onboarding domain "${domain}" must contain a track registry.`);
    continue;
  }
  for (const [track, roles] of Object.entries(tracks)) {
    if (!Array.isArray(roles)) {
      fail(`Onboarding track "${domain} / ${track}" must contain a role list.`);
      continue;
    }
    for (const role of roles) {
      onboardingOccurrences.push(role);
      if (typeof role !== "string" || !role.trim()) {
        fail(`Onboarding track "${domain} / ${track}" contains an invalid role name.`);
      } else if (!Object.prototype.hasOwnProperty.call(roadmaps, role)) {
        fail(`Onboarding role "${role}" has no roadmap.`);
      }
    }
  }
}

const onboardingCounts = new Map();
for (const role of onboardingOccurrences) onboardingCounts.set(role, (onboardingCounts.get(role) || 0) + 1);
for (const [role, count] of onboardingCounts) {
  if (count > 1) fail(`Onboarding role "${role}" appears ${count} times; role names must be unique.`);
}
for (const role of roleNames) {
  if (!onboardingCounts.has(role)) fail(`Roadmap role "${role}" is not reachable from onboarding.`);
}

for (const [role, roadmap] of Object.entries(roadmaps)) {
  const stages = roadmap && roadmap.stages;
  if (!Array.isArray(stages)) {
    fail(`Role "${role}" must have a stages array.`);
    continue;
  }
  if (stages.length !== 8) fail(`Role "${role}" has ${stages.length} stages; expected 8.`);
  totalStages += stages.length;

  const skillIds = new Set();
  const skillNames = new Set();
  const missionIds = new Set();
  const missionNames = new Set();
  let skillCount = 0;
  let missionCount = 0;

  stages.forEach((stage, index) => {
    const stageLabel = `Role "${role}" stage ${index + 1}`;
    if (!stage || typeof stage !== "object") {
      fail(`${stageLabel} must be an object.`);
      return;
    }
    const skills = stage.skills;
    if (!Array.isArray(skills)) {
      fail(`${stageLabel} must have a skills array.`);
    } else {
      if (skills.length !== 3) fail(`${stageLabel} has ${skills.length} skills; expected 3.`);
      skillCount += skills.length;
      for (const item of skills) {
        if (!item || typeof item !== "object") {
          fail(`${stageLabel} contains an invalid skill.`);
          continue;
        }
        if (typeof item.id !== "string" || !item.id.trim()) fail(`${stageLabel} has a skill with an invalid ID.`);
        else if (skillIds.has(item.id)) fail(`Role "${role}" repeats skill ID "${item.id}".`);
        else skillIds.add(item.id);
        if (typeof item.title !== "string" || !item.title.trim()) fail(`${stageLabel} has a skill with an invalid name.`);
        else if (skillNames.has(item.title)) fail(`Role "${role}" repeats skill name "${item.title}".`);
        else skillNames.add(item.title);

        if (item.resources !== undefined && !Array.isArray(item.resources)) {
          fail(`Skill "${item.title || item.id}" in "${role}" must have a resources array.`);
          continue;
        }
        for (const resource of item.resources || []) {
          if (!resource || typeof resource !== "object") {
            fail(`Skill "${item.title || item.id}" in "${role}" has an invalid resource.`);
            continue;
          }
          let url;
          try {
            url = new URL(resource.url);
          } catch {
            fail(`Resource URL "${resource.url}" for "${role}" / "${item.title || item.id}" is invalid.`);
          }
          if (url && url.protocol !== "https:") fail(`Resource URL "${resource.url}" must use HTTPS.`);
          const hostname = url?.hostname.toLowerCase();
          const hasPlaceholder = /placeholder|your[-_]?domain/i.test(`${url?.pathname || ""}${url?.search || ""}`);
          if (url && (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "example.com" || hostname.endsWith(".example.com") || hasPlaceholder)) {
            fail(`Resource URL "${resource.url}" contains a prohibited host or placeholder.`);
          }
          if (typeof resource.type !== "string" || !resourceTypes.has(resource.type.toLowerCase())) {
            fail(`Resource "${resource.url}" for "${role}" has invalid type "${resource.type}".`);
          }
        }
      }
    }

    const mission = stage.mission;
    if (!mission || typeof mission !== "object") {
      fail(`${stageLabel} must have a mission object.`);
    } else {
      missionCount += 1;
      totalMissions += 1;
      if (typeof mission.title !== "string" || !mission.title.trim()) {
        fail(`${stageLabel} has a mission with an invalid name.`);
      } else if (missionNames.has(mission.title)) {
        fail(`Role "${role}" repeats mission name "${mission.title}".`);
      } else {
        missionNames.add(mission.title);
      }
      if (mission.id !== undefined) {
        if (typeof mission.id !== "string" || !mission.id.trim()) fail(`${stageLabel} has a mission with an invalid ID.`);
        else if (missionIds.has(mission.id)) fail(`Role "${role}" repeats mission ID "${mission.id}".`);
        else {
          missionIds.add(mission.id);
          if (allMissionIds.has(mission.id)) fail(`Mission ID "${mission.id}" is duplicated across roles.`);
          allMissionIds.add(mission.id);
          if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(mission.id)) {
            fail(`Mission ID "${mission.id}" must use lowercase kebab-case.`);
          }
          if (/-(?:stage|mission)-?\d+$/.test(mission.id) || /-[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(mission.id)) {
            fail(`Mission ID "${mission.id}" appears position-based or randomly generated.`);
          }
        }
      }
      if (typeof mission.id !== "string" || !mission.id.trim()) fail(`${stageLabel} is missing a canonical mission ID.`);
    }
  });

  if (skillCount !== 24) fail(`Role "${role}" has ${skillCount} skills; expected 24.`);
  if (missionCount !== 8) fail(`Role "${role}" has ${missionCount} missions; expected 8.`);
  const finalStage = stages[7];
  const capstoneText = `${finalStage?.title || ""} ${finalStage?.mission?.title || ""} ${finalStage?.mission?.finalMilestone || ""}`;
  if (!/portfolio|capstone/i.test(capstoneText)) fail(`Role "${role}" stage 8 is not identified as a portfolio or capstone stage.`);
}

if (roleNames.length !== 105) fail(`Runtime catalogue has ${roleNames.length} roles; expected 105.`);
if (totalStages !== 840) fail(`Runtime catalogue has ${totalStages} stages; expected 840.`);
if (totalMissions !== 840) fail(`Runtime catalogue has ${totalMissions} missions; expected 840.`);
if (allMissionIds.size !== totalMissions) fail(`Runtime catalogue has ${allMissionIds.size} unique mission IDs for ${totalMissions} missions.`);

console.log(`Roadmap roles: ${roleNames.length}`);
console.log(`Roadmap stages: ${totalStages}`);
console.log(`Roadmap missions: ${totalMissions}`);
console.log(`Unique canonical mission IDs: ${allMissionIds.size}`);
console.log(`Unique onboarding roles: ${onboardingCounts.size}`);
console.log(`Roadmap resources checked: ${roleNames.reduce((sum, role) => sum + ((roadmaps[role]?.stages || []).reduce((stageSum, stage) => stageSum + (stage.skills || []).reduce((skillSum, skill) => skillSum + (skill.resources || []).length, 0), 0)), 0)}`);

if (errors.length) {
  console.error(`Validation failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Roadmap validation passed.");
}
