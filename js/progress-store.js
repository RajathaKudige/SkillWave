// Shared, item-level Supabase progress access. Load after js/account.js.
(() => {
  const tables = Object.freeze({
    roadmapSkills: "roadmap_skill_progress",
    roadmapMissions: "roadmap_mission_progress",
    softSkills: "soft_skill_progress",
    softSkillPractice: "soft_skill_practice",
    networkingJourney: "networking_journey_progress",
    networkingScenarios: "networking_scenario_progress",
    networkingContacts: "networking_contacts"
  });
  const networkingJourneyStepIds = Object.freeze(["presence", "people", "conversation", "practice", "opportunity", "participate", "followup", "connection"]);
  const networkingPresenceStepIds = Object.freeze(["github", "linkedin", "portfolio", "resume", "introduction", "project-showcase", "photo-banner", "contact-info"]);
  const networkingJourneyState = (rows) => {
    const completedById = new Map((Array.isArray(rows) ? rows : []).map((row) => [row.step_id, row.completed]));
    return Object.fromEntries(networkingJourneyStepIds.map((id) => [id, completedById.get(id) === true]));
  };

  class ProgressStoreError extends Error {
    constructor(code, operation, message, cause) {
      super(message);
      this.name = "ProgressStoreError";
      this.code = code;
      this.operation = operation;
      if (cause !== undefined) this.cause = cause;
    }
  }

  const invalid = (operation, message) => new ProgressStoreError("INVALID_DATA", operation, message);
  const requiredString = (value, name, operation) => {
    if (typeof value !== "string" || !value.trim()) throw invalid(operation, `${name} must be a non-empty string.`);
    return value.trim();
  };
  const requiredBoolean = (value, name, operation) => {
    if (typeof value !== "boolean") throw invalid(operation, `${name} must be a boolean.`);
    return value;
  };
  const nullableString = (value, name, operation) => {
    if (value === null || value === undefined) return null;
    if (typeof value !== "string") throw invalid(operation, `${name} must be a string or null.`);
    return value;
  };
  const nullableDate = (value, name, operation) => {
    const date = nullableString(value, name, operation);
    if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw invalid(operation, `${name} must be an ISO date or null.`);
    return date;
  };
  const jsonValue = (value, name, operation) => {
    try {
      const encoded = JSON.stringify(value);
      if (encoded === undefined) throw new Error("Value is not JSON serializable.");
      return JSON.parse(encoded);
    } catch (error) {
      throw new ProgressStoreError("INVALID_DATA", operation, `${name} must be JSON-serializable.`, error);
    }
  };
  const rowString = (row, key, operation) => requiredString(row?.[key], key, operation);
  const rowBoolean = (row, key, operation) => requiredBoolean(row?.[key], key, operation);
  const normalize = {
    roadmapSkill(row, op) { return { target_role: rowString(row, "target_role", op), skill_id: rowString(row, "skill_id", op), status: rowString(row, "status", op) }; },
    roadmapMission(row, op) { return { target_role: rowString(row, "target_role", op), mission_id: rowString(row, "mission_id", op), completed: rowBoolean(row, "completed", op) }; },
    softSkill(row, op) { return { skill_id: rowString(row, "skill_id", op), started: rowBoolean(row, "started", op) }; },
    softSkillPractice(row, op) {
      return { skill_id: rowString(row, "skill_id", op), reflections: jsonValue(row?.reflections, "reflections", op), simulation: jsonValue(row?.simulation, "simulation", op), activity_completed: rowBoolean(row, "activity_completed", op) };
    },
    networkingJourney(row, op) { return { step_id: rowString(row, "step_id", op), completed: rowBoolean(row, "completed", op) }; },
    networkingScenario(row, op) {
      return { scenario_id: rowString(row, "scenario_id", op), selected_choice: nullableString(row?.selected_choice, "selected_choice", op), completed: rowBoolean(row, "completed", op) };
    },
    networkingContact(row, op) {
      const id = rowString(row, "id", op);
      const person = rowString(row, "person", op);
      const last_interaction = nullableDate(row?.last_interaction, "last_interaction", op);
      const follow_up_completed = rowBoolean(row, "follow_up_completed", op);
      const result = { id, person, follow_up_completed };
      for (const key of ["role", "organization", "met", "topic", "next_action", "notes"]) result[key] = nullableString(row?.[key], key, op);
      result.last_interaction = last_interaction;
      return result;
    }
  };

  let verifiedUserRequest = null;
  let verifiedUserClient = null;
  let authRequestGeneration = 0;

  function invalidateVerifiedUserRequest() {
    authRequestGeneration += 1;
    verifiedUserRequest = null;
    verifiedUserClient = null;
  }

  async function context(operation) {
    const auth = window.accountAuth;
    if (!auth?.ready || !auth?.client) throw new ProgressStoreError("AUTH_UNAVAILABLE", operation, "The shared account session is unavailable.");
    try {
      await auth.ready;
      while (true) {
        const client = auth.client;
        const requestGeneration = authRequestGeneration;
        if (!verifiedUserRequest || verifiedUserClient !== client) {
          verifiedUserClient = client;
          const request = client.auth.getUser().then(({ data, error }) => {
            if (error) throw error;
            if (!data?.user?.id) throw new ProgressStoreError("UNAUTHENTICATED", operation, "An authenticated user is required for progress access.");
            return data.user.id;
          });
          const sharedRequest = request.catch((error) => {
            if (verifiedUserRequest === sharedRequest) {
              verifiedUserRequest = null;
              verifiedUserClient = null;
            }
            throw error;
          });
          verifiedUserRequest = sharedRequest;
        }
        let userId;
        try {
          userId = await verifiedUserRequest;
        } catch (error) {
          if (requestGeneration !== authRequestGeneration || auth.client !== client) continue;
          throw error;
        }
        if (requestGeneration !== authRequestGeneration || auth.client !== client) continue;
        return { client, userId };
      }
    } catch (error) {
      if (error instanceof ProgressStoreError) throw error;
      throw new ProgressStoreError("AUTHENTICATION_FAILED", operation, "The authenticated user could not be verified.", error);
    }
  }

  window.accountAuth?.client?.auth.onAuthStateChange(invalidateVerifiedUserRequest);

  async function read(table, operation, mapper) {
    const { client, userId } = await context(operation);
    const { data, error } = await client.from(table).select("*").eq("user_id", userId);
    if (error) throw new ProgressStoreError("READ_FAILED", operation, `Could not load ${table}.`, error);
    if (!Array.isArray(data)) throw new ProgressStoreError("INVALID_DATA", operation, `The ${table} response was malformed.`);
    return data.map((row) => mapper(row, operation));
  }

  async function upsert(table, operation, input, mapper, conflict) {
    const { client, userId } = await context(operation);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw invalid(operation, "A progress record object is required.");
    const normalized = mapper(input, operation);
    const { data, error } = await client.from(table).upsert({ ...normalized, user_id: userId }, { onConflict: conflict }).select("*").single();
    if (error) throw new ProgressStoreError("WRITE_FAILED", operation, `Could not save ${table}.`, error);
    return mapper(data, operation);
  }

  async function insertIfMissing(table, operation, input, mapper, conflict) {
    const { client, userId } = await context(operation);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw invalid(operation, "A progress record object is required.");
    const normalized = mapper(input, operation);
    const { data, error } = await client.from(table)
      .upsert({ ...normalized, user_id: userId }, { onConflict: conflict, ignoreDuplicates: true })
      .select("*")
      .maybeSingle();
    if (error) throw new ProgressStoreError("WRITE_FAILED", operation, `Could not migrate progress to ${table}.`, error);
    return data ? mapper(data, operation) : null;
  }

  async function removeProgress(table, operation, filters) {
    const { client, userId } = await context(operation);
    let query = client.from(table).delete().eq("user_id", userId);
    for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
    const { error } = await query;
    if (error) throw new ProgressStoreError("WRITE_FAILED", operation, `Could not remove progress from ${table}.`, error);
    return true;
  }

  const api = {
    ProgressStoreError,
    loadRoadmapSkillProgress() { return read(tables.roadmapSkills, "loadRoadmapSkillProgress", normalize.roadmapSkill); },
    upsertRoadmapSkillProgress(record) { return upsert(tables.roadmapSkills, "upsertRoadmapSkillProgress", record, normalize.roadmapSkill, "user_id,target_role,skill_id"); },
    insertRoadmapSkillProgressIfMissing(record) { return insertIfMissing(tables.roadmapSkills, "insertRoadmapSkillProgressIfMissing", record, normalize.roadmapSkill, "user_id,target_role,skill_id"); },
    deleteRoadmapSkillProgress(targetRole, skillId) {
      const operation = "deleteRoadmapSkillProgress";
      return removeProgress(tables.roadmapSkills, operation, { target_role: requiredString(targetRole, "target_role", operation), skill_id: requiredString(skillId, "skill_id", operation) });
    },
    loadRoadmapMissionProgress() { return read(tables.roadmapMissions, "loadRoadmapMissionProgress", normalize.roadmapMission); },
    // mission_id must be the canonical mission.id from roadmap-data.js, never a title, stage, or index.
    upsertRoadmapMissionProgress(record) { return upsert(tables.roadmapMissions, "upsertRoadmapMissionProgress", record, normalize.roadmapMission, "user_id,target_role,mission_id"); },
    insertRoadmapMissionProgressIfMissing(record) { return insertIfMissing(tables.roadmapMissions, "insertRoadmapMissionProgressIfMissing", record, normalize.roadmapMission, "user_id,target_role,mission_id"); },
    deleteRoadmapMissionProgress(targetRole, missionId) {
      const operation = "deleteRoadmapMissionProgress";
      return removeProgress(tables.roadmapMissions, operation, { target_role: requiredString(targetRole, "target_role", operation), mission_id: requiredString(missionId, "mission_id", operation) });
    },
    loadSoftSkillProgress() { return read(tables.softSkills, "loadSoftSkillProgress", normalize.softSkill); },
    upsertSoftSkillProgress(record) { return upsert(tables.softSkills, "upsertSoftSkillProgress", record, normalize.softSkill, "user_id,skill_id"); },
    insertSoftSkillProgressIfMissing(record) { return insertIfMissing(tables.softSkills, "insertSoftSkillProgressIfMissing", record, normalize.softSkill, "user_id,skill_id"); },
    loadSoftSkillPractice() { return read(tables.softSkillPractice, "loadSoftSkillPractice", normalize.softSkillPractice); },
    upsertSoftSkillPractice(record) { return upsert(tables.softSkillPractice, "upsertSoftSkillPractice", record, normalize.softSkillPractice, "user_id,skill_id"); },
    insertSoftSkillPracticeIfMissing(record) { return insertIfMissing(tables.softSkillPractice, "insertSoftSkillPracticeIfMissing", record, normalize.softSkillPractice, "user_id,skill_id"); },
    loadNetworkingJourneyProgress() { return read(tables.networkingJourney, "loadNetworkingJourneyProgress", normalize.networkingJourney); },
    upsertNetworkingJourneyProgress(record) { return upsert(tables.networkingJourney, "upsertNetworkingJourneyProgress", record, normalize.networkingJourney, "user_id,step_id"); },
    insertNetworkingJourneyProgressIfMissing(record) { return insertIfMissing(tables.networkingJourney, "insertNetworkingJourneyProgressIfMissing", record, normalize.networkingJourney, "user_id,step_id"); },
    networkingJourneyStepIds,
    networkingJourneyState,
    async loadNetworkingJourneyState() {
      const operation = "loadNetworkingJourneyState";
      const { client, userId } = await context(operation);
      const loadRows = async () => {
        const { data, error } = await client.from(tables.networkingJourney).select("*").eq("user_id", userId);
        if (error) throw new ProgressStoreError("READ_FAILED", operation, "Could not load networking journey progress.", error);
        if (!Array.isArray(data)) throw new ProgressStoreError("INVALID_DATA", operation, "The networking journey response was malformed.");
        return data.map((row) => normalize.networkingJourney(row, operation));
      };
      let rows = await loadRows();
      const existingIds = new Set(rows.map((row) => row.step_id));
      const missingIds = networkingJourneyStepIds.filter((id) => !existingIds.has(id));
      if (!missingIds.length) return networkingJourneyState(rows);

      let storage;
      try { storage = window.accountAuth.userStorage(userId); }
      catch (error) { console.warn("Legacy Networking journey migration storage is unavailable.", error); }
      const safeRead = (key, fallback) => {
        try {
          const parsed = JSON.parse(storage?.getItem(key) ?? "null");
          return parsed ?? fallback;
        } catch (error) {
          console.warn(`Could not read legacy Networking key ${key} for migration.`, error);
          return fallback;
        }
      };
      const objectValue = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
      const progress = objectValue(safeRead("networkingProgress", {}));
      const savedJourney = objectValue(progress.journey);
      const presence = objectValue(safeRead("networkingPresence", {}));
      const missions = objectValue(safeRead("networkingMissions", {}));
      const practice = objectValue(safeRead("networkingPractice", {}));
      const contacts = safeRead("networkingContacts", []);
      const opportunities = Array.isArray(progress.opportunitiesExplored) ? progress.opportunitiesExplored : [];
      const openSource = objectValue(progress.openSourceSteps);
      const milestones = Array.isArray(progress.milestones) ? progress.milestones : [];
      const derived = {
        presence: milestones.includes("profile") || missions.github === true || missions.linkedin === true || networkingPresenceStepIds.every((id) => presence[id] === true),
        people: milestones.includes("community") || missions["find-people"] === true || missions.community === true || opportunities.includes("communities"),
        conversation: missions.message === true,
        practice: milestones.includes("conversation") || Object.values(practice).some((item) => item && item.completed === true),
        opportunity: milestones.includes("opportunity") || opportunities.length > 0,
        participate: missions.event === true || missions.contribution === true || openSource.complete === true,
        followup: milestones.includes("followup") || missions["follow-up"] === true || (Array.isArray(contacts) && contacts.some((item) => item?.followUpCompleted === true)),
        connection: milestones.includes("connection") || missions.connection === true || (Array.isArray(contacts) && contacts.length > 0)
      };
      for (const id of missingIds) {
        const localValue = typeof savedJourney[id] === "boolean" ? savedJourney[id] : derived[id] === true ? true : undefined;
        if (typeof localValue !== "boolean") continue;
        const record = normalize.networkingJourney({ step_id: id, completed: localValue }, operation);
        const { error } = await client.from(tables.networkingJourney)
          .upsert({ ...record, user_id: userId }, { onConflict: "user_id,step_id", ignoreDuplicates: true });
        if (error) throw new ProgressStoreError("WRITE_FAILED", operation, "Could not migrate networking journey progress.", error);
      }
      rows = await loadRows();
      return networkingJourneyState(rows);
    },
    calculateNetworkingJourneyProgress(state) {
      const completed = networkingJourneyStepIds.filter((id) => state?.[id] === true).length;
      return { progress: completed / networkingJourneyStepIds.length * 100, completedSteps: completed, totalSteps: networkingJourneyStepIds.length };
    },
    loadNetworkingScenarioProgress() { return read(tables.networkingScenarios, "loadNetworkingScenarioProgress", normalize.networkingScenario); },
    upsertNetworkingScenarioProgress(record) { return upsert(tables.networkingScenarios, "upsertNetworkingScenarioProgress", record, normalize.networkingScenario, "user_id,scenario_id"); },
    insertNetworkingScenarioProgressIfMissing(record) { return insertIfMissing(tables.networkingScenarios, "insertNetworkingScenarioProgressIfMissing", record, normalize.networkingScenario, "user_id,scenario_id"); },
    loadNetworkingContacts() { return read(tables.networkingContacts, "loadNetworkingContacts", normalize.networkingContact); },
    insertNetworkingContactIfMissing(record) {
      const operation = "insertNetworkingContactIfMissing";
      if (!record || typeof record !== "object" || Array.isArray(record)) throw invalid(operation, "A contact record object is required.");
      const id = requiredString(record.id, "id", operation);
      if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) throw invalid(operation, "id must be a UUID.");
      const values = normalizeContactInput(record, operation, true);
      return insertIfMissing(tables.networkingContacts, operation, { ...values, id }, normalize.networkingContact, "id");
    },
    async createNetworkingContact(record) {
      const { client, userId } = await context("createNetworkingContact");
      if (!record || typeof record !== "object" || Array.isArray(record)) throw invalid("createNetworkingContact", "A contact object is required.");
      const values = normalizeContactInput(record, "createNetworkingContact", true);
      const { data, error } = await client.from(tables.networkingContacts).insert({ ...values, user_id: userId }).select("*").single();
      if (error) throw new ProgressStoreError("WRITE_FAILED", "createNetworkingContact", "Could not create networking contact.", error);
      return normalize.networkingContact(data, "createNetworkingContact");
    },
    async updateNetworkingContact(id, changes) {
      const operation = "updateNetworkingContact";
      const { client, userId } = await context(operation);
      const contactId = requiredString(id, "id", operation);
      if (!changes || typeof changes !== "object" || Array.isArray(changes)) throw invalid(operation, "A contact changes object is required.");
      const values = normalizeContactInput(changes, operation, false);
      const { data, error } = await client.from(tables.networkingContacts).update(values).eq("id", contactId).eq("user_id", userId).select("*").maybeSingle();
      if (error) throw new ProgressStoreError("WRITE_FAILED", operation, "Could not update networking contact.", error);
      if (!data) throw new ProgressStoreError("WRITE_FAILED", operation, "The contact was not found or could not be updated.");
      return normalize.networkingContact(data, operation);
    },
    async deleteNetworkingContact(id) {
      const operation = "deleteNetworkingContact";
      const { client, userId } = await context(operation);
      const contactId = requiredString(id, "id", operation);
      const { data, error } = await client.from(tables.networkingContacts).delete().eq("id", contactId).eq("user_id", userId).select("id").maybeSingle();
      if (error) throw new ProgressStoreError("WRITE_FAILED", operation, "Could not delete networking contact.", error);
      if (!data) throw new ProgressStoreError("WRITE_FAILED", operation, "The contact was not found or could not be deleted.");
      return true;
    }
  };

  function normalizeContactInput(record, operation, requirePerson) {
    const result = {};
    if (requirePerson || Object.prototype.hasOwnProperty.call(record, "person")) result.person = requiredString(record.person, "person", operation);
    for (const [key, alias] of [["role", "role"], ["organization", "organization"], ["met", "met"], ["topic", "topic"], ["next_action", "nextAction"], ["notes", "notes"]]) {
      const inputKey = Object.prototype.hasOwnProperty.call(record, key) ? key : alias;
      if (Object.prototype.hasOwnProperty.call(record, inputKey)) result[key] = nullableString(record[inputKey], key, operation);
    }
    const lastInteractionKey = Object.prototype.hasOwnProperty.call(record, "last_interaction") ? "last_interaction" : "lastInteraction";
    if (Object.prototype.hasOwnProperty.call(record, lastInteractionKey)) result.last_interaction = nullableDate(record[lastInteractionKey], "last_interaction", operation);
    const followUpKey = Object.prototype.hasOwnProperty.call(record, "follow_up_completed") ? "follow_up_completed" : "followUpCompleted";
    if (Object.prototype.hasOwnProperty.call(record, followUpKey)) result.follow_up_completed = requiredBoolean(record[followUpKey], "follow_up_completed", operation);
    if (Object.prototype.hasOwnProperty.call(record, "id")) result.id = requiredString(record.id, "id", operation);
    if (!Object.keys(result).length) throw invalid(operation, "At least one contact field is required.");
    return result;
  }

  window.progressStore = Object.freeze(api);
})();
