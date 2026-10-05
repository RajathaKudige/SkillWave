// Networking progress is account-scoped and server-authoritative after load.
(() => {
  window.accountAuth.ready.then(async (authState) => {
    if (!authState?.user || authState.redirected) return;
    const contactForm = document.querySelector("#contact-form");
    contactForm?.querySelectorAll("input, textarea, button").forEach((control) => { control.disabled = true; });
    const localStorage = window.accountAuth.userStorage(authState?.user?.id);
    const progressStore = window.progressStore;
    if (!progressStore) throw new Error("The shared progress store is unavailable.");
    await progressStore.loadNetworkingJourneyProgress();
    const initialScenarioRows = await progressStore.loadNetworkingScenarioProgress();
    const initialContactRows = await progressStore.loadNetworkingContacts();
    const journeyState = await progressStore.loadNetworkingJourneyState();
    const validJourneyIds = new Set(progressStore.networkingJourneyStepIds);
  const KEYS = { progress: "networkingProgress", presence: "networkingPresence", contacts: "networkingContacts", missions: "networkingMissions", practice: "networkingPractice" };
  const safeRead = (key, fallback) => {
    try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; }
    catch (error) { console.warn(`Could not read ${key}.`, error); return fallback; }
  };
  const safeWrite = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { console.warn(`Could not save ${key}.`, error); return false; }
  };
  const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const typeInfo = {
    video: ["Video", "🎥"], article: ["Article", "📖"], course: ["Course", "📚"], interactive: ["Interactive", "💻"],
    simulation: ["Simulation", "🎭"], practice: ["Practice", "🧪"], tool: ["Tool", "🛠️"], guide: ["Guide", "📘"]
  };
  const badge = (type) => `<span class="networking-type-badge"><span aria-hidden="true">${typeInfo[type][1]}</span> ${typeInfo[type][0]}</span>`;

  const opportunities = [
    ["internships", "Internships", "Short-term roles where students apply skills on real work with guidance.", "Build experience, learn team practices, and collect examples for your portfolio.", "Students ready to show relevant coursework or projects; requirements vary by employer.", "Use university career services, LinkedIn Jobs, or startup job boards; filter by role, location, and eligibility.", "Prepare a role-focused resume, project links, and a short note about your fit.", "Save one suitable opening and compare its requirements with your current experience.", [["LinkedIn Jobs", "https://www.linkedin.com/jobs/"], ["Wellfound Jobs", "https://wellfound.com/jobs"]]],
    ["hackathons", "Hackathons", "Time-bounded events where teams build a prototype around a theme or challenge.", "Practice collaboration, rapid learning, and explaining a project to others.", "Beginners can join if the event welcomes them; find a team with complementary skills.", "Check Devpost and Major League Hacking, then verify the official event page, format, dates, and rules.", "Bring a simple introduction, a laptop, and one or two skills you can contribute.", "Explore one event and note its theme, team format, and registration deadline.", [["Devpost Hackathons", "https://devpost.com/hackathons"], ["Major League Hacking", "https://www.mlh.com/"]]],
    ["open-source", "Open-Source Programs", "Public projects where people collaborate under published contribution rules and licenses.", "Small contributions can build technical confidence and give you practice communicating with maintainers.", "Students willing to read project docs and begin with a scoped, welcomed contribution.", "Search GitHub topics and issues labeled good first issue or help wanted.", "Read the README, license, code of conduct, and CONTRIBUTING guide before changing files.", "Bookmark one repository that clearly explains how newcomers can contribute.", [["GitHub: Contributing to open source", "https://docs.github.com/en/get-started/exploring-projects-on-github/contributing-to-open-source"], ["GitHub: Good first issue labels", "https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/encouraging-helpful-contributions-to-your-project-with-labels"]]],
    ["competitions", "Coding Competitions", "Challenges that let you practice problem solving, data work, or product building against a prompt.", "They create a focused reason to practice and a concrete result to discuss.", "Students who enjoy structured challenges; start at a level that supports learning.", "Look at Kaggle competitions, campus clubs, and organizer announcements.", "Read rules, allowed tools, evaluation criteria, and deadlines before entering.", "Choose one beginner-appropriate challenge and write down the first skill it requires.", [["Kaggle Competitions", "https://www.kaggle.com/competitions"], ["Devpost", "https://devpost.com/"]]],
    ["developer-events", "Developer Events", "Talks, workshops, and technical sessions hosted by companies or communities.", "Events help you learn from practitioners and find people who care about similar topics.", "Anyone curious about a subject; many events have free online sessions, but check registration details.", "Browse Google Developer Groups and Microsoft Reactor event listings.", "Review the agenda and prepare one question connected to a session.", "Save one relevant event and note what you want to learn from it.", [["Google Developer Groups", "https://gdg.community.dev/"], ["Microsoft Reactor", "https://reactor.microsoft.com/"]]],
    ["meetups", "Meetups", "Small local or online gatherings centered on a shared technology or professional interest.", "Recurring groups make it easier to learn names and continue conversations over time.", "Students who want a low-pressure way to listen, ask questions, or volunteer.", "Search Meetup by technology, location, or online format; also check your campus calendar.", "Confirm the group is active, accessible, and a good fit before attending.", "Find one group and review its upcoming events and community guidelines.", [["Meetup Technology Groups", "https://www.meetup.com/topics/technology/"]]],
    ["conferences", "Conferences", "Larger events with talks, workshops, and opportunities to meet people across a field.", "They expose you to current work and help you find focused communities.", "Students who have a topic they want to explore; student rates, scholarships, or virtual access may be available.", "Check conference organizer sites, university departments, and professional associations.", "Review the schedule, speaker bios, cost, accessibility, and travel details before committing.", "Choose one talk and prepare a thoughtful question for the speaker.", [["Google Developer Groups events", "https://gdg.community.dev/"], ["Microsoft Events", "https://www.microsoft.com/events"]]],
    ["mentorship", "Mentorship Programs", "Structured or informal conversations where an experienced person shares perspective and guidance.", "A useful mentor can help you ask better questions and plan next steps.", "Students who are ready to describe their goals and act on advice; no mentor can guarantee an outcome.", "Try campus alumni programs, professional communities, or ADPList.", "Prepare a brief context and one question; check the time commitment and privacy expectations.", "Explore one mentorship channel and note what you would ask in a first conversation.", [["ADPList", "https://adplist.org/"], ["GitHub Campus Experts", "https://github.com/education"]]],
    ["student-programs", "Student Developer Programs", "Programs that provide learning communities, events, tools, or leadership opportunities for students.", "They can connect you to peers and structured ways to contribute on campus.", "Students who meet the program's current eligibility criteria and can follow through on participation.", "Review official student program pages from developer platforms and your institution.", "Read eligibility, time commitments, and whether benefits are free or conditional.", "Check GitHub Education and your campus technology clubs for current options.", [["GitHub Education for Students", "https://github.com/education/students"], ["GitHub Student Developer Pack", "https://education.github.com/pack"]]],
    ["research", "Research Opportunities", "Projects where students help investigate a question with a faculty or research team.", "Research builds careful inquiry, technical depth, and experience explaining evidence.", "Students whose interests align with a lab or project; eligibility and funding vary by institution and country.", "Ask faculty about current openings, check department pages, and search official research programs.", "Prepare a short note about your interests, relevant coursework, and availability.", "Identify one faculty research area and draft a concise question about how students can get involved.", [["NSF Research Experiences for Undergraduates", "https://www.nsf.gov/funding/initiatives/reu"]]],
    ["communities", "Tech Communities", "Groups organized around a technology, discipline, or shared professional interest.", "Communities provide places to learn, ask questions, and contribute consistently.", "Students who want peer support or a place to learn in public; choose communities with clear codes of conduct.", "Try GDG chapters, GitHub Discussions, official project forums, or campus clubs.", "Read the community guidelines and observe before posting.", "Join or follow one relevant community and make one useful contribution when ready.", [["Google Developer Groups", "https://gdg.community.dev/"], ["GitHub Discussions Guide", "https://docs.github.com/en/discussions"]]],
    ["volunteer", "Volunteer Opportunities", "Unpaid contributions to a nonprofit, student group, or community project with a clear scope.", "Volunteering can build experience while helping solve a real community need.", "Students with time to contribute responsibly; agree on scope and ownership first.", "Ask campus clubs, nonprofits, and open-source communities what work they actually need.", "Clarify the outcome, time commitment, point of contact, and how work will be used.", "Find one cause or project and ask what small, specific contribution would help.", [["GitHub Open Source Guide", "https://opensource.guide/how-to-contribute/"]]]
  ].map(([id, title, what, why, who, find, prepare, action, resources]) => ({ id, title, what, why, who, find, prepare, action, resources }));

  const presenceTasks = [
    ["github", "GitHub profile", "Makes your technical work and collaboration visible.", "A clear bio, pinned relevant projects, useful READMEs, and recent work you can explain.", "Empty repositories, copied code without attribution, or claiming work you did not do.", "Review your profile, add a concise bio, and pin one project with a clear README."],
    ["linkedin", "LinkedIn profile", "Helps people understand your interests and find a professional way to connect.", "Accurate headline, concise About section, relevant projects, and thoughtful contact settings.", "Keyword stuffing, exaggerated experience, or a generic connection pitch.", "Update one section so it clearly states what you are learning and what work interests you."],
    ["portfolio", "Portfolio", "Gives people a focused place to explore your work and process.", "A few finished projects with a problem, your role, decisions, results, and working links.", "Broken links, unfinished demos without context, or too many projects with no explanation.", "Choose one project and write a short case study explaining your contribution."],
    ["resume", "Resume", "Makes your relevant experience easy to scan for a specific opportunity.", "Readable, truthful, tailored, and focused on evidence and outcomes.", "Typos, vague claims, dense formatting, or listing skills you cannot discuss.", "Tailor one project bullet to a role you are exploring and ask someone to review it."],
    ["introduction", "Professional introduction", "Helps you start a conversation without an awkward or lengthy pitch.", "Name, current focus, a relevant project or interest, and an easy opening question.", "Memorized sales language or asking for a favor before establishing context.", "Practice a 20-second introduction and adapt it for one event or community."],
    ["project-showcase", "Project showcase", "Turns learning into concrete evidence someone can understand.", "A working demo or screenshots, setup steps, your contribution, and honest limitations.", "Unclear ownership, missing instructions, or claiming team work as individual work.", "Improve a project README with purpose, your role, demo, and next improvement."],
    ["photo-banner", "Photo and banner basics", "A clear, respectful profile image can make a professional profile easier to recognize.", "A recent, appropriately framed photo or a simple relevant banner; neither needs to be expensive.", "Unprofessional imagery, misleading edits, or sharing a photo you are uncomfortable making public.", "Review your profile image and banner; choose what feels authentic and appropriate to your field."],
    ["contact-info", "Professional contact information", "Lets people follow up through a channel you actually check.", "A working professional email or profile contact method with sensible privacy settings.", "Publishing personal details you do not want public or leaving obsolete contact links.", "Test your preferred contact method and remove any details you do not want public."]
  ].map(([id, title, why, good, mistakes, action]) => ({ id, title, why, good, mistakes, action }));

  const peopleCategories = [
    ["Alumni", "Search your university alumni directory by role, graduation year, company, or shared program."],
    ["Developers", "Find contributors explaining technologies or projects you are actively learning."],
    ["Recruiters", "Follow people who recruit for roles aligned with your experience; read role requirements before writing."],
    ["Engineers", "Look for engineers who publish work, speak at events, or answer questions in your field."],
    ["Founders", "Explore founders working on problems you care about; approach with curiosity, not an immediate ask."],
    ["Open-source maintainers", "Start with maintainers who have welcoming contribution guides and beginner-labeled issues."],
    ["Hackathon organizers", "Follow official event pages and organizers to learn about format, rules, and future events."],
    ["Community leaders", "Notice moderators and organizers who make a community useful and respectful."],
    ["Mentors", "Search campus mentoring programs and opt-in platforms; check what support they offer."],
    ["Conference speakers", "Read the speaker's talk or published work and ask one question about that specific topic."]
  ];

  const scenarios = [
    ["event-engineer", "You met a software engineer at a college event.", "Ask a specific follow-up about a topic from the talk and briefly connect it to your project.", [
      ["Send a short thank-you and mention one idea from their session.", "Connects to a real interaction and makes the message personal."], ["Ask for a referral in your first message.", "It skips relationship context and puts pressure on someone you just met."], ["Send the same long introduction to every speaker.", "Generic bulk messages are hard to respond to and do not show genuine interest."]]],
    ["alumni-accepts", "An alumnus accepted your connection request.", "Thank them, briefly explain the shared context, and ask one manageable career question.", [
      ["Thank them and ask one focused question about a path they have taken.", "A specific, low-pressure question respects their time."], ["Immediately ask them to mentor you weekly.", "That is a large commitment before you know each other."], ["Send multiple messages until they reply.", "Repeated unsolicited messages can feel intrusive; give them room to respond."]]],
    ["recruiter-post", "A recruiter posted about an internship that interests you.", "Read the requirements, apply through the official channel, and send a concise note only if it adds context.", [
      ["Check eligibility, tailor your application, and reference the specific role if you message.", "It shows you read the posting and are taking the official application path."], ["Ask for a referral without reviewing the listing.", "It asks the recruiter to do work before you have established fit."], ["Comment only 'interested' and wait.", "It gives no context and does not complete the application process."]]],
    ["maintainer", "You want to approach an open-source maintainer.", "Read the project docs and issue discussion first; ask a scoped question in the preferred channel.", [
      ["Describe what you read, what you tried, and the precise point that is unclear.", "It makes the question answerable and shows respect for project guidance."], ["Demand a private call to explain the whole codebase.", "A large request ignores the maintainer's time and published contribution process."], ["Open a pull request without checking contribution rules.", "The change may conflict with project scope or its required workflow."]]],
    ["positive-reply", "Someone replied positively to your message.", "Acknowledge their answer, ask a useful follow-up only if needed, and act on the advice.", [
      ["Thank them, summarize what you will try, and ask permission before requesting more time.", "It closes the loop and gives them control over further conversation."], ["Send a long list of unrelated questions.", "It makes the interaction harder to manage and loses focus."], ["Assume their reply means they will refer you.", "A friendly conversation does not imply a referral or hiring endorsement."]]],
    ["no-reply", "Someone has not replied to your message.", "Wait; if useful, send one short follow-up after a reasonable interval, then move on.", [
      ["Give them time, send at most one polite follow-up, and accept no response.", "People may be busy or unavailable; boundaries matter."], ["Message them on several platforms the same day.", "Channel-hopping can feel invasive."], ["Publicly call them out for ignoring you.", "That harms trust and does not create a professional conversation."]]],
    ["disagreement", "You disagree with someone in a technical community.", "Respond to the idea with evidence and curiosity, not assumptions about the person.", [
      ["Ask about their constraints, share evidence, and keep your tone respectful.", "It leaves room to learn and discuss the technical issue."], ["Insult them or question their intelligence.", "Personal attacks stop useful discussion and breach community norms."], ["Post private messages to win the argument.", "Sharing private communication without consent violates trust."]]],
    ["reconnect", "You want to reconnect with someone after several months.", "Mention how you met, give a genuine update, and offer a natural reason to reconnect.", [
      ["Refer to the last conversation and share a relevant update or question.", "Context helps them remember the relationship and makes the note natural."], ["Pretend you have been in regular contact.", "It feels inauthentic and may confuse the person."], ["Ask for a major favor without catching up.", "It treats the relationship as transactional."]]]
  ].map(([id, situation, principle, choices]) => ({ id, situation, principle, choices }));

  const openSourceSteps = [
    ["profile", "Create or improve your GitHub profile", "Use a clear bio and show work you can explain."],
    ["repository", "Find a beginner-friendly public repository", "Search topics or projects you already use; check activity and license."],
    ["readme", "Understand the README", "Learn the project's purpose, setup, scope, and expected behavior."],
    ["issues", "Explore issues and discussions", "Read context and check whether maintainers invite contributors."],
    ["good-first-issue", "Look for good first issue or help wanted", "Choose a scoped task that matches your current skills."],
    ["contribution-guide", "Read contribution guidelines", "Check code of conduct, license, tests, style, and pull request expectations."],
    ["fork-clone", "Fork and clone the repository", "Follow official instructions and keep your change on a separate branch."],
    ["small-change", "Make a small, clearly scoped change", "Stay within the issue and ask before expanding scope."],
    ["test", "Run the documented checks", "Use the project's test steps and describe any limits honestly."],
    ["pull-request", "Create a clear pull request", "Explain the problem, solution, tests, and related issue."],
    ["communicate", "Communicate respectfully", "Use the project's preferred public channels and provide concise context."],
    ["feedback", "Respond constructively to review", "Ask clarifying questions, make requested changes, and thank reviewers."],
    ["complete", "Finish the contribution", "Wait for maintainer review; acceptance is not guaranteed."],
    ["portfolio", "Document the experience in your portfolio", "Describe your contribution accurately and link to the public change."]
  ].map(([id, title, description]) => ({ id, title, description }));

  let contacts = safeRead(KEYS.contacts, []);
  if (!Array.isArray(contacts)) contacts = [];
  let progressData;
  let practiceState = safeRead(KEYS.practice, {});
  if (!practiceState || typeof practiceState !== "object" || Array.isArray(practiceState)) practiceState = {};
  const legacyPracticeCache = practiceState;

  const opportunityGrid = document.querySelector("#opportunity-grid");
  opportunityGrid.innerHTML = opportunities.map((item) => `<article class="networking-opportunity-card"><div class="networking-card-topline"><span>${escapeHTML(item.title)}</span>${badge("guide")}</div><p>${escapeHTML(item.what)}</p><details><summary>Explore this opportunity type</summary><div class="networking-opportunity-detail"><h4>Why it matters</h4><p>${escapeHTML(item.why)}</p><h4>Who it is for</h4><p>${escapeHTML(item.who)}</p><h4>How to find it</h4><p>${escapeHTML(item.find)}</p><h4>What to prepare</h4><p>${escapeHTML(item.prepare)}</p><h4>Take one action</h4><p>${escapeHTML(item.action)}</p><ul>${item.resources.map(([name, url]) => `<li><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(name)} &rarr;</a></li>`).join("")}</ul></div></details></article>`).join("");

  document.querySelector("#presence-grid").innerHTML = presenceTasks.map((item) => `<article class="networking-presence-card"><h3>${escapeHTML(item.title)}</h3><div><h4>Why it matters</h4><p>${escapeHTML(item.why)}</p></div><div><h4>What good looks like</h4><p>${escapeHTML(item.good)}</p></div><div><h4>Common mistakes</h4><p>${escapeHTML(item.mistakes)}</p></div><div class="networking-action-hint"><strong>Try:</strong> ${escapeHTML(item.action)}</div></article>`).join("");

  document.querySelector("#people-grid").innerHTML = peopleCategories.map(([title, description]) => `<article class="networking-person-card"><span aria-hidden="true">⌕</span><div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p></div></article>`).join("");

  const scenarioGrid = document.querySelector("#scenario-grid");

  const openSourceStepsList = document.querySelector("#opensource-steps");
  const openSourceStepDetail = document.querySelector("#opensource-step-detail");
  openSourceStepsList.innerHTML = openSourceSteps.map((item, index) => `<li><button type="button" class="networking-open-source-step${index === 0 ? " is-selected" : ""}" data-open-source-step="${index}" aria-controls="opensource-step-detail" aria-pressed="${index === 0}"><span class="networking-step-number">${String(index + 1).padStart(2, "0")}</span></button></li>`).join("");
  const renderOpenSourceStep = (selectedIndex) => {
    openSourceStepsList.querySelectorAll("[data-open-source-step]").forEach((button) => {
      const isSelected = Number(button.dataset.openSourceStep) === selectedIndex;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
    });
    const selectedStep = openSourceSteps[selectedIndex];
    openSourceStepDetail.innerHTML = `<span class="networking-phase">STEP ${String(selectedIndex + 1).padStart(2, "0")}</span><strong>${escapeHTML(selectedStep.title)}</strong><p>${escapeHTML(selectedStep.description)}</p>`;
  };
  renderOpenSourceStep(0);

  const journeyItems = [
    ["presence", "Build your professional presence", "Make your profile and one piece of work easy to understand."],
    ["people", "Find relevant people or communities", "Look for people and groups connected to a real interest."],
    ["conversation", "Start a meaningful conversation", "Use a specific point of relevance and ask one genuine question."],
    ["practice", "Practice a networking conversation", "Try a scenario and reflect on how you would respond."],
    ["opportunity", "Explore a relevant opportunity", "Check one opportunity's fit, eligibility, and next steps."],
    ["participate", "Participate or contribute", "Take part in an event, community, or welcomed project contribution."],
    ["followup", "Follow up thoughtfully", "Reconnect with context and one useful next step."],
    ["connection", "Build one meaningful connection", "Keep in touch through respectful, useful exchanges."]
  ];
  const validScenarioIds = new Set(scenarios.map((item) => item.id));
  const initialScenarioIds = new Set(initialScenarioRows.map((row) => row.scenario_id));
  for (const [id, record] of Object.entries(practiceState)) {
    if (!validScenarioIds.has(id) || initialScenarioIds.has(id) || !record || typeof record !== "object" || Array.isArray(record)) continue;
    const validChoice = record.choice === null || (Number.isInteger(record.choice) && record.choice >= 0 && record.choice < scenarios.find((item) => item.id === id).choices.length);
    if (!validChoice || typeof record.completed !== "boolean") continue;
    await progressStore.insertNetworkingScenarioProgressIfMissing({
      scenario_id: id,
      selected_choice: record.choice === null ? null : String(record.choice),
      completed: record.completed
    });
  }

  const isUuid = (value) => typeof value === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
  const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  };
  // UUIDv8-style IDs use SHA-256 over user ID + legacy ID, so retries and accounts map independently.
  const deterministicContactUuid = async (legacyId) => {
    if (isUuid(legacyId)) return legacyId;
    if (!window.crypto?.subtle) throw new Error("Secure UUID migration is unavailable in this browser context.");
    const input = new TextEncoder().encode(`${authState.user.id}:${legacyId}`);
    const hash = new Uint8Array(await window.crypto.subtle.digest("SHA-256", input));
    const bytes = hash.slice(0, 16);
    bytes[6] = (bytes[6] & 0x0f) | 0x80;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
  const legacyContactRows = [];
  for (const item of contacts) {
    if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.person !== "string" || !item.person.trim() || typeof item.id !== "string" || !item.id.trim()) continue;
    const textFields = ["role", "organization", "met", "topic", "nextAction", "notes"];
    if (textFields.some((key) => item[key] !== undefined && item[key] !== null && typeof item[key] !== "string")) continue;
    const lastInteraction = item.lastInteraction || null;
    if (lastInteraction !== null && !isValidDate(lastInteraction)) continue;
    if (item.followUpCompleted !== undefined && typeof item.followUpCompleted !== "boolean") continue;
    legacyContactRows.push({
      id: await deterministicContactUuid(item.id),
      person: item.person.trim(),
      role: item.role || null,
      organization: item.organization || null,
      met: item.met || null,
      topic: item.topic || null,
      last_interaction: lastInteraction,
      next_action: item.nextAction || null,
      notes: item.notes || null,
      follow_up_completed: item.followUpCompleted === true
    });
  }
  const initialContactIds = new Set(initialContactRows.map((row) => row.id));
  for (const record of legacyContactRows) {
    if (!initialContactIds.has(record.id)) await progressStore.insertNetworkingContactIfMissing(record);
  }

  const scenarioRows = await progressStore.loadNetworkingScenarioProgress();
  const contactRows = await progressStore.loadNetworkingContacts();
  practiceState = Object.fromEntries(scenarioRows.filter((row) => validScenarioIds.has(row.scenario_id)).map((row) => {
    const scenario = scenarios.find((item) => item.id === row.scenario_id);
    const choice = row.selected_choice === null ? null : Number(row.selected_choice);
    return [row.scenario_id, { choice: Number.isInteger(choice) && choice >= 0 && choice < scenario.choices.length ? choice : null, completed: row.completed }];
  }));
  contacts = contactRows.map((row) => ({
    id: row.id, person: row.person, role: row.role || "", organization: row.organization || "", met: row.met || "", topic: row.topic || "",
    lastInteraction: row.last_interaction || "", nextAction: row.next_action || "", notes: row.notes || "", followUpCompleted: row.follow_up_completed
  }));
  scenarioGrid.innerHTML = scenarios.map((item, index) => {
    const scenarioNumber = String(index + 1).padStart(2, "0");
    const detailsId = `scenario-content-${item.id}`;
    return `<details class="networking-scenario-card" data-scenario-card="${item.id}" name="networking-scenarios"><summary class="networking-scenario-summary" aria-controls="${detailsId}" aria-expanded="false"><span class="networking-scenario-number">${scenarioNumber}</span><span class="networking-scenario-heading"><span class="networking-scenario-title">${escapeHTML(item.situation)}</span>${badge("simulation")}</span><span class="networking-scenario-affordance" aria-hidden="true"></span></summary><div class="networking-scenario-content" id="${detailsId}"><h3>Situation</h3><p>${escapeHTML(item.situation)}</p><p class="networking-scenario-principle">Communication principle: ${escapeHTML(item.principle)}</p><fieldset><legend>Choose a response to explore</legend>${item.choices.map(([answer, guidance], choiceIndex) => `<label class="networking-choice"><input type="radio" name="scenario-${item.id}" value="${choiceIndex}" ${practiceState[item.id]?.choice === choiceIndex ? "checked" : ""}><span>${escapeHTML(answer)}</span></label><p class="networking-choice-feedback" data-choice-feedback="${item.id}-${choiceIndex}" ${practiceState[item.id]?.choice === choiceIndex ? "" : "hidden"}><strong>${choiceIndex === 0 ? "Why this can help" : "Consider the impact"}:</strong> ${escapeHTML(guidance)}</p>`).join("")}</fieldset><button class="networking-secondary-button" type="button" data-retry-scenario="${item.id}">Try another response</button></div></details>`;
  }).join("");
  scenarioGrid.querySelectorAll(".networking-scenario-card").forEach((scenario) => {
    scenario.addEventListener("toggle", () => scenario.querySelector("summary").setAttribute("aria-expanded", String(scenario.open)));
  });
  const journeyList = document.querySelector("#networking-journey-list");
  journeyList.innerHTML = journeyItems.map(([id, title, description], index) => `<li class="networking-journey-item${journeyState[id] ? " is-complete" : ""}"><button type="button" class="networking-journey-toggle${journeyState[id] ? " is-complete" : ""}" data-journey-id="${id}" aria-pressed="${journeyState[id]}" aria-label="${journeyState[id] ? "Mark incomplete" : "Mark complete"}: ${escapeHTML(title)}"><span class="networking-journey-check" aria-hidden="true">${journeyState[id] ? "&#10003;" : ""}</span><span class="networking-journey-copy"><strong>${String(index + 1).padStart(2, "0")} &#183; ${escapeHTML(title)}</strong><small>${escapeHTML(description)}</small></span></button></li>`).join("");

  const renderProgress = (persistCache = false) => {
    const { progress: overall, completedSteps, totalSteps } = progressStore.calculateNetworkingJourneyProgress(journeyState);
    const displayedProgress = Number.isInteger(overall) ? String(overall) : overall.toFixed(1);
    document.querySelector("#networking-progress-value").textContent = `${displayedProgress}%`;
    document.querySelector("#networking-progress-fill").style.width = `${overall}%`;
    document.querySelector(".networking-progress-bar").setAttribute("aria-valuenow", String(overall));
    document.querySelector("#networking-journey-count").textContent = `${completedSteps} of ${totalSteps} journey steps complete`;
    if (persistCache) {
      if (!progressData) {
        progressData = safeRead(KEYS.progress, {});
        if (!progressData || typeof progressData !== "object" || Array.isArray(progressData)) progressData = {};
      }
      progressData = { ...progressData, journey: { ...journeyState }, progress: overall };
      safeWrite(KEYS.progress, progressData);
    }
    window.dispatchEvent(new CustomEvent("networkingProgressUpdated", { detail: { progress: overall, completedSteps, totalSteps } }));
  };

  const contactList = document.querySelector("#contact-list");
  const contactEmpty = document.querySelector("#contacts-empty");
  const drawContacts = () => {
    contactEmpty.hidden = contacts.length > 0;
    contactList.innerHTML = contacts.map((item) => `<article class="networking-contact-card"><div class="networking-contact-card-heading"><div><h4>${escapeHTML(item.person)}</h4><p>${escapeHTML([item.role, item.organization].filter(Boolean).join(" · ") || "Professional connection")}</p></div><span class="networking-contact-met">${escapeHTML(item.met || "Connection")}</span></div><dl>${item.topic ? `<div><dt>Topic</dt><dd>${escapeHTML(item.topic)}</dd></div>` : ""}${item.lastInteraction ? `<div><dt>Last interaction</dt><dd>${escapeHTML(item.lastInteraction)}</dd></div>` : ""}${item.nextAction ? `<div><dt>Next action</dt><dd>${escapeHTML(item.nextAction)}</dd></div>` : ""}${item.notes ? `<div><dt>Notes</dt><dd>${escapeHTML(item.notes)}</dd></div>` : ""}</dl><div class="networking-actions"><button type="button" class="networking-secondary-button" data-edit-contact="${escapeHTML(item.id)}">Edit</button><button type="button" class="networking-delete-button" data-delete-contact="${escapeHTML(item.id)}">Delete</button></div></article>`).join("");
  };
  const clearContactForm = () => {
    ["id", "person", "role", "organization", "met", "topic", "lastInteraction", "nextAction", "notes"].forEach((name) => { contactForm.elements[name].value = ""; });
    document.querySelector("#contact-form-title").textContent = "Add a professional connection";
    document.querySelector("#contact-submit").textContent = "Save connection";
    document.querySelector("#contact-cancel").hidden = true;
  };

  const builder = document.querySelector("#message-builder");
  const draft = document.querySelector("#message-draft");
  const buildMessage = () => {
    const form = new FormData(builder);
    const name = form.get("name").trim();
    const field = form.get("field").trim();
    const project = form.get("project").trim();
    const reason = form.get("reason").trim();
    const question = form.get("question").trim();
    if (![name, field, project, reason, question].every(Boolean)) return;
    const who = form.get("who").toLowerCase();
    const purpose = form.get("purpose");
    let opener = `Hello, I'm ${name}, a student exploring ${field}. I came across your work because ${reason}.`;
    let context = `I'm currently working on or learning about ${project}.`;
    if (purpose === "Follow up") opener = `Hello, I'm ${name}. It was good meeting you recently; I appreciated our conversation about ${reason}.`;
    if (purpose === "Learn about career path") context = `I'm interested in how people build a career in ${field}, and your experience stood out to me.`;
    if (purpose === "Ask about a project") context = `I'm exploring ${project} and would value learning about your perspective on the work.`;
    if (purpose === "Introduce yourself") context = `My current focus is ${field}, and one project I'm learning from is ${project}.`;
    if (purpose === "Ask about an opportunity") context = `I saw your post or project related to ${project}; I'm checking how my experience in ${field} may fit.`;
    const greeting = who === "recruiter" ? "Hello" : "Hi";
    draft.value = `${greeting},\n\n${opener}\n${context}\n\n${question}\n\nNo pressure if you're busy; I appreciate your time.\n\nBest,\n${name}`;
  };
  builder.addEventListener("input", buildMessage);
  builder.addEventListener("change", buildMessage);
  builder.addEventListener("reset", () => setTimeout(() => { draft.value = ""; document.querySelector("#message-status").textContent = "Draft reset."; }, 0));
  document.querySelector("#copy-message").addEventListener("click", async () => {
    const status = document.querySelector("#message-status");
    if (!draft.value.trim()) { status.textContent = "Complete the fields to create a draft first."; return; }
    try { await navigator.clipboard.writeText(draft.value); status.textContent = "Copied. Review and personalize the message before sending."; }
    catch { draft.focus(); draft.select(); status.textContent = document.execCommand("copy") ? "Copied. Review and personalize the message before sending." : "Select and copy the draft above."; }
  });

  document.addEventListener("change", (event) => {
    const scenarioChoice = event.target.closest('input[type="radio"][name^="scenario-"]');
    if (!scenarioChoice) return;
    const scenarioId = scenarioChoice.name.slice("scenario-".length);
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    const chosen = Number(scenarioChoice.value);
    if (!Number.isInteger(chosen) || chosen < 0 || chosen >= scenario.choices.length) return;
    const previous = practiceState[scenarioId] || { choice: null, completed: false };
    const radios = [...document.querySelectorAll(`input[name="scenario-${scenarioId}"]`)];
    radios.forEach((radio) => { radio.disabled = true; radio.checked = previous.choice === Number(radio.value); });
    (async () => {
      try {
        await progressStore.upsertNetworkingScenarioProgress({ scenario_id: scenarioId, selected_choice: String(chosen), completed: true });
        practiceState[scenarioId] = { choice: chosen, completed: true };
        legacyPracticeCache[scenarioId] = { choice: chosen, completed: true };
        safeWrite(KEYS.practice, legacyPracticeCache);
        radios.forEach((radio) => { radio.checked = Number(radio.value) === chosen; });
        scenario.choices.forEach((_, index) => { const feedback = document.querySelector(`[data-choice-feedback="${scenarioId}-${index}"]`); if (feedback) feedback.hidden = index !== chosen; });
        document.querySelector("#networking-save-status").textContent = "Networking progress synced with your account.";
      } catch (error) {
        console.error("Networking scenario progress write failed:", error);
        document.querySelector("#networking-save-status").textContent = `Could not save this practice choice (${error.code || "write error"}). Your saved choice was not changed. Please try again.`;
      } finally {
        radios.forEach((radio) => { radio.disabled = false; });
      }
    })();
  });

  document.addEventListener("click", (event) => {
    const journeyToggle = event.target.closest("[data-journey-id]");
    if (journeyToggle) {
      const id = journeyToggle.dataset.journeyId;
      if (!validJourneyIds.has(id)) return;
      const nextCompleted = !journeyState[id];
      journeyToggle.disabled = true;
      (async () => {
        try {
          await progressStore.upsertNetworkingJourneyProgress({ step_id: id, completed: nextCompleted });
          journeyState[id] = nextCompleted;
          journeyToggle.classList.toggle("is-complete", nextCompleted);
          journeyToggle.closest(".networking-journey-item").classList.toggle("is-complete", nextCompleted);
          journeyToggle.setAttribute("aria-pressed", String(nextCompleted));
          journeyToggle.setAttribute("aria-label", `${nextCompleted ? "Mark incomplete" : "Mark complete"}: ${journeyItems.find(([itemId]) => itemId === id)[1]}`);
          journeyToggle.querySelector(".networking-journey-check").textContent = nextCompleted ? "\u2713" : "";
          renderProgress(true);
          document.querySelector("#networking-save-status").textContent = "Networking progress synced with your account.";
        } catch (error) {
          console.error("Networking journey progress write failed:", error);
          document.querySelector("#networking-save-status").textContent = `Could not save this journey step (${error.code || "write error"}). Your saved progress was not changed. Please try again.`;
        } finally {
          journeyToggle.disabled = false;
        }
      })();
      return;
    }
    const openSourceStep = event.target.closest("[data-open-source-step]");
    if (openSourceStep) {
      renderOpenSourceStep(Number(openSourceStep.dataset.openSourceStep));
      return;
    }
    const retry = event.target.closest("[data-retry-scenario]");
    if (retry) {
      const id = retry.dataset.retryScenario;
      if (!validScenarioIds.has(id)) return;
      const previous = practiceState[id] || { choice: null, completed: false };
      retry.disabled = true;
      (async () => {
        try {
          await progressStore.upsertNetworkingScenarioProgress({ scenario_id: id, selected_choice: null, completed: true });
          practiceState[id] = { choice: null, completed: true };
          legacyPracticeCache[id] = { choice: null, completed: true };
          safeWrite(KEYS.practice, legacyPracticeCache);
          document.querySelectorAll(`input[name="scenario-${id}"]`).forEach((radio) => { radio.checked = false; });
          document.querySelectorAll(`[data-choice-feedback^="${id}-"]`).forEach((feedback) => { feedback.hidden = true; });
          document.querySelector("#networking-save-status").textContent = "Practice reset and synced with your account.";
        } catch (error) {
          practiceState[id] = previous;
          console.error("Networking scenario reset failed:", error);
          document.querySelector("#networking-save-status").textContent = `Could not reset this practice (${error.code || "write error"}). Your saved response was not changed. Please try again.`;
        } finally {
          retry.disabled = false;
        }
      })();
      return;
    }
    const edit = event.target.closest("[data-edit-contact]");
    if (edit) {
      const item = contacts.find((contact) => contact.id === edit.dataset.editContact);
      if (!item) return;
      Object.entries(item).forEach(([key, value]) => { if (contactForm.elements[key]) contactForm.elements[key].value = value; });
      document.querySelector("#contact-form-title").textContent = "Edit professional connection";
      document.querySelector("#contact-submit").textContent = "Save changes"; document.querySelector("#contact-cancel").hidden = false;
      contactForm.scrollIntoView({ behavior: "smooth", block: "center" }); return;
    }
    const remove = event.target.closest("[data-delete-contact]");
    if (remove) {
      const id = remove.dataset.deleteContact;
      if (!contacts.some((item) => item.id === id)) return;
      remove.disabled = true;
      (async () => {
        try {
          await progressStore.deleteNetworkingContact(id);
          contacts = contacts.filter((item) => item.id !== id);
          drawContacts();
          document.querySelector("#contact-status").textContent = "Connection deleted from your account.";
        } catch (error) {
          console.error("Networking contact delete failed:", error);
          document.querySelector("#contact-status").textContent = `Could not delete this connection (${error.code || "write error"}). It is still saved. Please try again.`;
        } finally {
          remove.disabled = false;
        }
      })();
      return;
    }
  });
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(contactForm);
    const existingId = form.get("id");
    const entry = {
      id: existingId || null,
      person: form.get("person").trim(), role: form.get("role").trim(), organization: form.get("organization").trim(),
      met: form.get("met").trim(), topic: form.get("topic").trim(), lastInteraction: form.get("lastInteraction"),
      nextAction: form.get("nextAction").trim(), notes: form.get("notes").trim(),
      followUpCompleted: contacts.find((item) => item.id === existingId)?.followUpCompleted || false
    };
    if (!entry.person) return;
    const submitButton = document.querySelector("#contact-submit");
    submitButton.disabled = true;
    try {
      const payload = {
        id: entry.id || createContactUuid(), person: entry.person, role: entry.role || null, organization: entry.organization || null,
        met: entry.met || null, topic: entry.topic || null, last_interaction: entry.lastInteraction || null,
        next_action: entry.nextAction || null, notes: entry.notes || null, follow_up_completed: entry.followUpCompleted
      };
      const savedRow = existingId
        ? await progressStore.updateNetworkingContact(existingId, { person: payload.person, role: payload.role, organization: payload.organization, met: payload.met, topic: payload.topic, last_interaction: payload.last_interaction, next_action: payload.next_action, notes: payload.notes, follow_up_completed: payload.follow_up_completed })
        : await progressStore.createNetworkingContact(payload);
      const savedContact = {
        id: savedRow.id, person: savedRow.person, role: savedRow.role || "", organization: savedRow.organization || "",
        met: savedRow.met || "", topic: savedRow.topic || "", lastInteraction: savedRow.last_interaction || "",
        nextAction: savedRow.next_action || "", notes: savedRow.notes || "", followUpCompleted: savedRow.follow_up_completed
      };
      const index = contacts.findIndex((item) => item.id === savedContact.id);
      if (index >= 0) contacts[index] = savedContact; else contacts.unshift(savedContact);
      clearContactForm(); drawContacts();
      document.querySelector("#contact-status").textContent = "Connection saved to your account.";
    } catch (error) {
      console.error("Networking contact save failed:", error);
      document.querySelector("#contact-status").textContent = `Could not save this connection (${error.code || "write error"}). Your saved contacts were not changed. Please try again.`;
    } finally {
      submitButton.disabled = false;
    }
  });
  contactForm.addEventListener("reset", () => setTimeout(clearContactForm, 0));
  document.querySelector("#contact-cancel").addEventListener("click", clearContactForm);

  drawContacts();
  renderProgress(false);
  contactForm?.querySelectorAll("input, textarea, button").forEach((control) => { control.disabled = false; });
  document.querySelector("#networking-save-status").textContent = "Networking progress synced with your account.";
  }).catch((error) => {
    console.error("Networking progress could not be initialized:", error);
    const message = `Networking progress is temporarily unavailable (${error.code || "load error"}). Your local data is unchanged. Refresh to try again.`;
    const status = document.querySelector("#networking-save-status");
    if (status) status.textContent = message;
    const contactStatus = document.querySelector("#contact-status");
    if (contactStatus) contactStatus.textContent = "Networking data could not be loaded from your account.";
  });

  function createContactUuid() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    if (!window.crypto?.getRandomValues) throw new Error("Secure contact IDs are unavailable in this browser.");
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
})();
