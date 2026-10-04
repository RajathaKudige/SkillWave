// Networking tools are local-first and use storage keys separate from every other pillar.
(() => {
  window.accountAuth.ready.then((authState) => {
    const localStorage = window.accountAuth.userStorage(authState?.user?.id);
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

  let progressData = safeRead(KEYS.progress, {});
  if (!progressData || typeof progressData !== "object" || Array.isArray(progressData)) progressData = {};
  let presenceState = safeRead(KEYS.presence, {});
  if (!presenceState || typeof presenceState !== "object" || Array.isArray(presenceState)) presenceState = {};
  let contacts = safeRead(KEYS.contacts, []);
  if (!Array.isArray(contacts)) contacts = [];
  let missionState = safeRead(KEYS.missions, {});
  if (!missionState || typeof missionState !== "object" || Array.isArray(missionState)) missionState = {};
  let practiceState = safeRead(KEYS.practice, {});
  if (!practiceState || typeof practiceState !== "object" || Array.isArray(practiceState)) practiceState = {};
  let opportunitiesExplored = Array.isArray(progressData.opportunitiesExplored) ? progressData.opportunitiesExplored : [];
  let openSteps = progressData.openSourceSteps && typeof progressData.openSourceSteps === "object" ? progressData.openSourceSteps : {};
  let storageAvailable = true;

  const opportunityGrid = document.querySelector("#opportunity-grid");
  opportunityGrid.innerHTML = opportunities.map((item) => `<article class="networking-opportunity-card"><div class="networking-card-topline"><span>${escapeHTML(item.title)}</span>${badge("guide")}</div><p>${escapeHTML(item.what)}</p><details><summary>Explore this opportunity type</summary><div class="networking-opportunity-detail"><h4>Why it matters</h4><p>${escapeHTML(item.why)}</p><h4>Who it is for</h4><p>${escapeHTML(item.who)}</p><h4>How to find it</h4><p>${escapeHTML(item.find)}</p><h4>What to prepare</h4><p>${escapeHTML(item.prepare)}</p><h4>Take one action</h4><p>${escapeHTML(item.action)}</p><ul>${item.resources.map(([name, url]) => `<li><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(name)} &rarr;</a></li>`).join("")}</ul></div></details></article>`).join("");

  document.querySelector("#presence-grid").innerHTML = presenceTasks.map((item) => `<article class="networking-presence-card"><h3>${escapeHTML(item.title)}</h3><div><h4>Why it matters</h4><p>${escapeHTML(item.why)}</p></div><div><h4>What good looks like</h4><p>${escapeHTML(item.good)}</p></div><div><h4>Common mistakes</h4><p>${escapeHTML(item.mistakes)}</p></div><div class="networking-action-hint"><strong>Try:</strong> ${escapeHTML(item.action)}</div></article>`).join("");

  document.querySelector("#people-grid").innerHTML = peopleCategories.map(([title, description]) => `<article class="networking-person-card"><span aria-hidden="true">⌕</span><div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(description)}</p></div></article>`).join("");

  document.querySelector("#scenario-grid").innerHTML = scenarios.map((item, index) => `<article class="networking-scenario-card" data-scenario-card="${item.id}"><div class="networking-card-topline"><span>SCENARIO ${String(index + 1).padStart(2, "0")}</span>${badge("simulation")}</div><h3>${escapeHTML(item.situation)}</h3><p class="networking-scenario-principle">Communication principle: ${escapeHTML(item.principle)}</p><fieldset><legend>Choose a response to explore</legend>${item.choices.map(([answer, guidance], choiceIndex) => `<label class="networking-choice"><input type="radio" name="scenario-${item.id}" value="${choiceIndex}" ${practiceState[item.id]?.choice === choiceIndex ? "checked" : ""}><span>${escapeHTML(answer)}</span></label><p class="networking-choice-feedback" data-choice-feedback="${item.id}-${choiceIndex}" ${practiceState[item.id]?.choice === choiceIndex ? "" : "hidden"}><strong>${choiceIndex === 0 ? "Why this can help" : "Consider the impact"}:</strong> ${escapeHTML(guidance)}</p>`).join("")}</fieldset><button class="networking-secondary-button" type="button" data-retry-scenario="${item.id}">Try another response</button></article>`).join("");

  document.querySelector("#opensource-steps").innerHTML = openSourceSteps.map((item, index) => `<li><span class="networking-step-number">${String(index + 1).padStart(2, "0")}</span><span><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.description)}</small></span></li>`).join("");

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
  const legacyMilestones = Array.isArray(progressData.milestones) ? progressData.milestones : [];
  const migratedJourney = {
    presence: legacyMilestones.includes("profile") || Boolean(missionState.github || missionState.linkedin) || presenceTasks.every((item) => presenceState[item.id]),
    people: legacyMilestones.includes("community") || Boolean(missionState["find-people"] || missionState.community) || opportunitiesExplored.includes("communities"),
    conversation: Boolean(missionState.message),
    practice: legacyMilestones.includes("conversation") || Object.values(practiceState).some((item) => item && item.completed),
    opportunity: legacyMilestones.includes("opportunity") || opportunitiesExplored.length > 0,
    participate: Boolean(missionState.event || missionState.contribution || openSteps.complete),
    followup: legacyMilestones.includes("followup") || Boolean(missionState["follow-up"]) || contacts.some((item) => item.followUpCompleted),
    connection: legacyMilestones.includes("connection") || Boolean(missionState.connection) || contacts.length > 0
  };
  const savedJourney = progressData.journey && typeof progressData.journey === "object" && !Array.isArray(progressData.journey) ? progressData.journey : {};
  const journeyState = Object.fromEntries(journeyItems.map(([id]) => [id, typeof savedJourney[id] === "boolean" ? savedJourney[id] : Boolean(migratedJourney[id])]));
  const journeyList = document.querySelector("#networking-journey-list");
  journeyList.innerHTML = journeyItems.map(([id, title, description], index) => `<li class="networking-journey-item${journeyState[id] ? " is-complete" : ""}"><button type="button" class="networking-journey-toggle${journeyState[id] ? " is-complete" : ""}" data-journey-id="${id}" aria-pressed="${journeyState[id]}" aria-label="${journeyState[id] ? "Mark incomplete" : "Mark complete"}: ${escapeHTML(title)}"><span class="networking-journey-check" aria-hidden="true">${journeyState[id] ? "&#10003;" : ""}</span><span class="networking-journey-copy"><strong>${String(index + 1).padStart(2, "0")} &#183; ${escapeHTML(title)}</strong><small>${escapeHTML(description)}</small></span></button></li>`).join("");

  const renderProgress = (persist = true) => {
    const completedSteps = journeyItems.filter(([id]) => journeyState[id]).length;
    const overall = Math.max(0, Math.min(100, completedSteps / journeyItems.length * 100));
    const displayedProgress = Number.isInteger(overall) ? String(overall) : overall.toFixed(1);
    document.querySelector("#networking-progress-value").textContent = `${displayedProgress}%`;
    document.querySelector("#networking-progress-fill").style.width = `${overall}%`;
    document.querySelector(".networking-progress-bar").setAttribute("aria-valuenow", String(overall));
    document.querySelector("#networking-journey-count").textContent = `${completedSteps} of ${journeyItems.length} journey steps complete`;
    if (persist) {
      progressData = { ...progressData, journey: journeyState, progress: overall };
      storageAvailable = safeWrite(KEYS.progress, progressData) && storageAvailable;
      document.querySelector("#networking-save-status").textContent = storageAvailable ? "Your networking journey is saved to your account on this device." : "Some changes could not be saved. Check this browser's local storage settings.";
    }
    window.dispatchEvent(new CustomEvent("networkingProgressUpdated", { detail: { progress: overall, completedSteps, totalSteps: journeyItems.length } }));
  };

  const contactList = document.querySelector("#contact-list");
  const contactEmpty = document.querySelector("#contacts-empty");
  const contactForm = document.querySelector("#contact-form");
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
    const chosen = Number(scenarioChoice.value);
    practiceState[scenarioId] = { ...(practiceState[scenarioId] || {}), choice: chosen, completed: true };
    safeWrite(KEYS.practice, practiceState);
    scenarios.find((item) => item.id === scenarioId).choices.forEach((_, index) => { const feedback = document.querySelector(`[data-choice-feedback="${scenarioId}-${index}"]`); if (feedback) feedback.hidden = index !== chosen; });
  });

  document.addEventListener("click", (event) => {
    const journeyToggle = event.target.closest("[data-journey-id]");
    if (journeyToggle) {
      const id = journeyToggle.dataset.journeyId;
      journeyState[id] = !journeyState[id];
      journeyToggle.classList.toggle("is-complete", journeyState[id]);
      journeyToggle.closest(".networking-journey-item").classList.toggle("is-complete", journeyState[id]);
      journeyToggle.setAttribute("aria-pressed", String(journeyState[id]));
      journeyToggle.setAttribute("aria-label", `${journeyState[id] ? "Mark incomplete" : "Mark complete"}: ${journeyItems.find(([itemId]) => itemId === id)[1]}`);
      journeyToggle.querySelector(".networking-journey-check").textContent = journeyState[id] ? "\u2713" : "";
      renderProgress();
      return;
    }
    const retry = event.target.closest("[data-retry-scenario]");
    if (retry) {
      const id = retry.dataset.retryScenario;
      practiceState[id] = { ...(practiceState[id] || {}), choice: null, completed: true };
      safeWrite(KEYS.practice, practiceState);
      document.querySelectorAll(`input[name="scenario-${id}"]`).forEach((radio) => { radio.checked = false; });
      document.querySelectorAll(`[data-choice-feedback^="${id}-"]`).forEach((feedback) => { feedback.hidden = true; });
      renderProgress(); return;
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
    if (remove) { contacts = contacts.filter((item) => item.id !== remove.dataset.deleteContact); safeWrite(KEYS.contacts, contacts); drawContacts(); renderProgress(); return; }
  });
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(contactForm);
    const id = form.get("id") || (window.crypto?.randomUUID ? window.crypto.randomUUID() : `contact-${Date.now()}`);
    const entry = { id, person: form.get("person").trim(), role: form.get("role").trim(), organization: form.get("organization").trim(), met: form.get("met").trim(), topic: form.get("topic").trim(), lastInteraction: form.get("lastInteraction"), nextAction: form.get("nextAction").trim(), notes: form.get("notes").trim(), followUpCompleted: contacts.find((item) => item.id === id)?.followUpCompleted || false };
    if (!entry.person) return;
    const index = contacts.findIndex((item) => item.id === id);
    if (index >= 0) contacts[index] = entry; else contacts.unshift(entry);
    const saved = safeWrite(KEYS.contacts, contacts);
    document.querySelector("#contact-status").textContent = saved ? "Connection saved on this device." : "Could not save; check browser storage settings.";
    clearContactForm(); drawContacts(); renderProgress();
  });
  contactForm.addEventListener("reset", () => setTimeout(clearContactForm, 0));
  document.querySelector("#contact-cancel").addEventListener("click", clearContactForm);

  drawContacts();
  renderProgress(true);
  });
})();
