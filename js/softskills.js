// Soft skills are self-paced and stored separately from technical roadmap state.
(() => {
  let resolveSoftSkillsProgress;
  window.softSkillsProgressReady = new Promise((resolve) => { resolveSoftSkillsProgress = resolve; });
  window.accountAuth.ready.then(async (authState) => {
    if (!authState?.user || authState.redirected) return;
    const localStorage = window.accountAuth.userStorage(authState?.user?.id);
  const STORAGE_KEY = "softSkillsProgress";
  const PRACTICE_STORAGE_KEY = "softSkillsPractice";
  const resourceTypes = {
    video: { label: "Video", icon: "🎥" }, article: { label: "Article", icon: "📖" }, course: { label: "Course", icon: "📚" },
    interactive: { label: "Interactive", icon: "💻" }, simulation: { label: "Simulation", icon: "🎭" }, practice: { label: "Practice", icon: "🧪" },
    "ai-practice": { label: "AI Practice", icon: "🤖" }, tool: { label: "Tool", icon: "🛠️" }, "documentation-guide": { label: "Guide", icon: "📘" },
    reflection: { label: "Reflection", icon: "📝" }
  };
  const resource = (name, url, type, description = "") => ({ name, title: name, url, type, ...(description ? { description } : {}) });
  const inferResourceType = (name, url) => /video-library|youtube/i.test(`${name} ${url}`) ? "video"
    : /microsoft learn|training|course/i.test(name) ? "course"
      : /guide|documentation|help:/i.test(name) || /docs\.github\.com|support\.microsoft\.com/i.test(url) ? "documentation-guide" : "article";
  const skill = (id, name, meaning, why, improve, exercise, scenario, source, url) => ({
    id, name, meaning, why, improve, exercise, scenario,
    resource: resource(source, url, inferResourceType(source, url)),
    resources: [resource(source, url, inferResourceType(source, url))]
  });
  const domains = [
    { id: "communication", title: "Communication", icon: "↗", intro: "Share information so others can understand, respond, and act.", skills: [
      skill("active-listening", "Active Listening", "Give the speaker your attention, check your understanding, and reflect the key point before responding.", "Listening well prevents avoidable rework and helps people feel heard.", "In your next discussion, put distractions aside, summarize what you heard, and ask whether you understood correctly.", "In pairs, discuss a project issue for three minutes. The listener summarizes the speaker's concern before offering ideas.", "A teammate says a deadline may slip. Clarify the blocker and impact before proposing a new plan.", "MindTools: Active Listening", "https://www.mindtools.com/az4wxv7/active-listening/"),
      skill("clear-writing", "Clear Written Communication", "Organize written messages around the purpose, essential context, and requested action.", "Clear writing saves readers time and makes decisions easier to follow.", "Draft the main point first, use short paragraphs, and remove details the reader does not need.", "Rewrite a long project update as a subject line, three concise bullets, and one clear request.", "Your supervisor needs a quick status update before a meeting; report progress, risk, and next step.", "Purdue OWL: Professional Writing", "https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/business_writing_for_administrative_and_clerical_staff/general_guidelines.html"),
      skill("asking-questions", "Asking Effective Questions", "Ask focused questions that reveal goals, constraints, examples, and what has already been tried.", "Good questions clarify expectations early and help teams solve the actual problem.", "Start with an open question, then narrow down with a specific follow-up and a brief summary.", "Take an unclear assignment and write three questions about outcome, deadline, and constraints.", "A project brief says “make it user-friendly.” Ask questions that turn this into testable expectations.", "Atlassian: Asking Questions at Work", "https://www.atlassian.com/blog/loom/ask-questions-at-work"),
      skill("feedback", "Giving and Receiving Feedback", "Discuss observable behavior and its impact, listen to another view, and agree on a useful next step.", "Constructive feedback helps people improve without making the conversation personal.", "Use a specific example, explain its effect, invite the other person's perspective, and agree on one action.", "Exchange feedback on a mock presentation: name one specific strength and one actionable improvement.", "A teammate's unclear documentation delayed your work. Explain the impact and ask how to improve the handoff.", "Center for Creative Leadership: SBI Feedback", "https://www.ccl.org/articles/leading-effectively-articles/closing-the-gap-between-intent-and-impact/"),
      skill("professional-messages", "Professional Email and Chat", "Choose an appropriate channel and tone, include useful context, and make requests easy to answer.", "Respectful, well-structured messages reduce confusion in study and workplace teams.", "Use a meaningful subject, greeting when appropriate, direct request, and courteous close; reread before sending.", "Write an email to a professor requesting a project meeting with context and two proposed time slots.", "You need a clarification from a recruiter. Draft a brief message that gives context and asks one clear question.", "Purdue OWL: Email Etiquette", "https://owl.purdue.edu/owl/general_writing/academic_writing/email_etiquette.html")
    ]},
    { id: "teamwork", title: "Teamwork & Collaboration", icon: "◉", intro: "Contribute reliably while helping a group coordinate and do its best work.", skills: [
      skill("collaboration", "Collaborative Work", "Coordinate responsibilities, share progress, and combine different contributions toward a shared result.", "Most substantial projects depend on people aligning their efforts and sharing information.", "Agree on a shared outcome, divide work visibly, and surface dependencies before they become blockers.", "Plan a small class event in a group: assign owners, dependencies, and a check-in point.", "Your group project has overlapping research tasks. Agree who owns each part and how findings will be combined.", "Atlassian Team Playbook", "https://www.atlassian.com/team-playbook"),
      skill("conflict-resolution", "Conflict Resolution", "Address a disagreement by separating the issue from the people and looking for evidence and shared goals.", "Unresolved conflict can stall work; respectful resolution preserves trust and progress.", "Describe the disagreement neutrally, listen to each view, compare options against shared criteria, and agree on follow-up.", "Role-play a disagreement over project scope; each person states their concern and proposes a testable compromise.", "Two teammates prefer different technologies. Compare requirements and constraints before choosing.", "Atlassian: Conflict Resolution", "https://www.atlassian.com/blog/teamwork/conflict-resolution-at-work"),
      skill("task-ownership", "Task Ownership", "Take responsibility for a defined outcome, communicate progress, and raise risks early.", "Reliable ownership lets teammates plan around your work and builds trust.", "Clarify what “done” means, estimate the next step, and give an update before someone has to ask.", "Choose one part of a class project and create a small definition of done plus a progress update.", "You discover your section depends on data another teammate has not provided. Flag it early and suggest a way forward.", "Atlassian: Roles and Responsibilities", "https://www.atlassian.com/team-playbook/plays/roles-and-responsibilities"),
      skill("team-feedback", "Constructive Peer Feedback", "Help teammates improve through specific, respectful feedback tied to shared work.", "Useful peer feedback improves outcomes and makes collaboration more transparent.", "Ask whether feedback is welcome, point to a concrete example, explain its effect, and offer a practical suggestion.", "Review a classmate's presentation outline and write one evidence-based strength and one improvement suggestion.", "A project partner's slide deck has too much text. Suggest a change that supports the audience and objective.", "Atlassian: Working Agreements", "https://www.atlassian.com/team-playbook/plays/working-agreements"),
      skill("different-styles", "Working Across Different Styles", "Adapt coordination to different communication preferences, strengths, and working habits.", "Teams are more effective when differences are understood and expectations are explicit.", "Ask teammates how they prefer updates, make decisions, and handle handoffs; revisit assumptions rather than labeling people.", "Make a team working agreement covering channels, response expectations, and decision-making.", "One teammate prefers written plans while another brainstorms verbally. Create a process that includes both.", "Atlassian: Working Agreements", "https://www.atlassian.com/team-playbook/plays/working-agreements")
    ]},
    { id: "problem-solving", title: "Problem Solving & Critical Thinking", icon: "⌕", intro: "Turn unclear challenges into evidence-based next steps.", skills: [
      skill("decomposition", "Problem Decomposition", "Break a large challenge into smaller questions and manageable pieces of work.", "Smaller parts are easier to investigate, assign, and verify.", "State the desired outcome, list unknowns, and split the problem by process, user, or component.", "Take a broad issue such as “our event turnout was low” and divide it into questions you can investigate.", "A team app fails intermittently. Separate possible causes across input, network, and service behavior.", "Atlassian: Problem Framing", "https://www.atlassian.com/team-playbook/plays/problem-framing"),
      skill("root-cause", "Root Cause Analysis", "Look beyond visible symptoms to identify conditions that allowed a problem to occur.", "Fixing the cause reduces repeated failures and wasted effort.", "Build a timeline, ask what evidence supports each cause, and distinguish contributing factors from guesses.", "Use a “5 whys” exercise on a missed assignment deadline, focusing on process changes rather than blame.", "A group presentation was missing a section. Trace how the handoff failed and propose a prevention step.", "Atlassian: 5 Whys", "https://www.atlassian.com/team-playbook/plays/5-whys"),
      skill("decision-making", "Decision Making", "Compare options against goals, evidence, constraints, and consequences before choosing.", "Explicit decisions reduce circular debate and make tradeoffs easier to explain.", "Write down the decision, options, criteria, and owner; set a time to revisit if key assumptions change.", "Choose between two project ideas with a small criteria table for effort, learning value, and user benefit.", "Your team must choose a demo feature with limited time. Explain the tradeoff and record the decision.", "MindTools: Decision Making", "https://www.mindtools.com/cyz4vzu/decision-making/"),
      skill("analytical-thinking", "Analytical Thinking", "Examine information for evidence, patterns, assumptions, and gaps before reaching a conclusion.", "Careful analysis helps avoid decisions based on a single example or untested belief.", "Separate observations from interpretations, seek more than one source, and note what remains uncertain.", "Compare two sources making different claims and list evidence, assumptions, and questions for each.", "A survey suggests students dislike a new feature. Check sample size and comments before recommending a change.", "University of Minnesota: Good Reasoning", "https://open.lib.umn.edu/goodreasoning/chapter/chapter-1-good-reasoning/"),
      skill("ambiguity", "Handling Ambiguity", "Make a reasonable next move when requirements or information are incomplete.", "Real projects often start with uncertainty, and waiting for perfect clarity can stall progress.", "Identify what is known, what is unknown, which assumption is riskiest, and the smallest safe test.", "Take a vague assignment and write a short plan with assumptions and one clarifying question.", "A project sponsor gives a broad goal but no detailed requirements. Propose a small prototype to learn more.", "Atlassian: Project Kick-off", "https://www.atlassian.com/team-playbook/plays/project-kick-off")
    ]},
    { id: "time-management", title: "Time Management & Productivity", icon: "◷", intro: "Plan work realistically, focus on what matters, and communicate about deadlines.", skills: [
      skill("prioritization", "Prioritization", "Choose which tasks deserve attention first based on importance, urgency, impact, and dependencies.", "Thoughtful priorities protect time for high-impact work when everything feels urgent.", "List commitments, estimate impact and deadline, then choose a realistic top three for the next work session.", "Sort a list of assignments, interview preparation, and club work into a manageable order and explain why.", "Two deadlines land on the same day. Identify dependencies and negotiate scope or timing early.", "Atlassian: Prioritize Tasks", "https://www.atlassian.com/team-playbook/plays/prioritize-tasks-how-to"),
      skill("planning", "Planning and Estimation", "Turn a goal into steps, checkpoints, and time estimates that can be adjusted as you learn.", "A visible plan helps teams catch delays and coordinate dependent tasks.", "Break work into pieces that can be completed in one sitting, estimate each, and add review time.", "Plan a two-week class project with milestones, owners, dependencies, and a buffer.", "Your team must present a prototype in three weeks. Work backwards from the demo and set checkpoints.", "Atlassian: Project Management Activities", "https://www.atlassian.com/team-playbook/examples/project-management-activities"),
      skill("procrastination", "Managing Procrastination", "Notice avoidance patterns and make the next useful action small enough to begin.", "Starting early creates room to ask for help and revise work before a deadline.", "Name the barrier, define a 10-minute first step, and reduce distractions for that work block.", "Choose an assignment you have been avoiding and complete a 10-minute starter task, then note what helped.", "A report feels overwhelming. Draft the headings and one source note before trying to write the full report.", "UNSW: Time Management", "https://www.unsw.edu.au/student/managing-your-studies/academic-skills-support/toolkit/time-management"),
      skill("focus", "Focus Management", "Protect attention by setting a clear task, limiting interruptions, and taking planned breaks.", "Focused work improves quality and reduces the time lost to repeated context switching.", "Choose one task, silence nonessential alerts, set a work interval, and record distractions to handle later.", "Complete one 25-minute focused study block and compare the result with a multitasked session.", "You need to debug a project while chat messages arrive. Set an update window and communicate when you will respond.", "UNSW: Time Management", "https://www.unsw.edu.au/student/managing-your-studies/academic-skills-support/toolkit/time-management"),
      skill("deadlines", "Managing Deadlines", "Track commitments, make progress visible, and communicate risks before a deadline is missed.", "Early updates give teammates options to adjust work and expectations.", "Use one trusted calendar or task list, check it regularly, and flag risks with a proposed plan.", "Create a deadline tracker for a group assignment with owner, status, risk, and next checkpoint.", "Your research is taking longer than expected. Tell your teammate what is at risk and what can still be delivered.", "Microsoft To Do for Students", "https://support.microsoft.com/en-au/education/student-help-center/track-the-moving-parts-with-microsoft-to-do")
    ]},
    { id: "adaptability", title: "Adaptability & Learning", icon: "↻", intro: "Keep learning as tools, requirements, and circumstances change.", skills: [
      skill("learning-tools", "Learning New Tools", "Approach unfamiliar tools by connecting their purpose to tasks you already understand.", "Workplaces change tools often; learning efficiently helps you stay useful without needing to know everything in advance.", "Start with the official getting-started guide, reproduce one basic workflow, and record questions as you go.", "Learn enough of a new collaboration app to create a board, assign work, and share a brief how-to with a classmate.", "Your internship team uses a project tool you have not seen. Find the right guide and complete one real task.", "Microsoft Learn", "https://learn.microsoft.com/training/"),
      skill("handling-change", "Handling Change", "Adjust plans when new information changes priorities, scope, or working conditions.", "Flexibility helps teams respond to reality without losing sight of the intended outcome.", "Ask what changed and why, identify what work is affected, and agree on a revised next step.", "Replan a mock event after the venue becomes unavailable, preserving the most important attendee needs.", "A project sponsor changes the feature priority. Clarify the new goal and update your team plan.", "Atlassian: Change Management Kick-off", "https://www.atlassian.com/team-playbook/plays/change-management-process"),
      skill("learning-mistakes", "Learning from Mistakes", "Review an error honestly, identify contributing factors, and apply a useful lesson.", "Reflection turns setbacks into better judgment and more reliable habits.", "Describe what happened without blame, check assumptions, and choose one specific change to try next time.", "Write a short learning review for a recent missed goal: situation, causes, lesson, next experiment.", "A demo fails because you did not test the projector. Add a preparation check and rehearse the setup.", "Google SRE: Postmortem Culture", "https://sre.google/sre-book/postmortem-culture/"),
      skill("growth-mindset", "Growth-Oriented Learning", "Treat current ability as something that can develop through practice, feedback, and reflection.", "A learning orientation makes it easier to try challenging work and improve from evidence.", "Choose a specific skill, set a small practice goal, request feedback, and compare work over time.", "Select one communication skill and keep two brief examples of what you practiced and what changed.", "You receive a lower presentation score than expected. Ask for one actionable improvement and rehearse it.", "University of Calgary: Growth Mindset", "https://taylorinstitute.ucalgary.ca/resources/module/test-anxiety/growth-mindset"),
      skill("comfort-zone", "Working Outside Your Comfort Zone", "Take manageable steps into unfamiliar situations while asking for support when needed.", "Professional growth often requires trying tasks before feeling completely confident.", "Name the uncomfortable part, choose a low-risk first attempt, and reflect on what you learned.", "Volunteer to explain one project decision in a small group, then note what you want to practice next.", "You are asked to lead a short stand-up for the first time. Prepare an agenda and ask a peer for feedback.", "Toastmasters: Public Speaking Tips", "https://www.toastmasters.org/resources/public-speaking-tips")
    ]},
    { id: "leadership", title: "Leadership & Ownership", icon: "✦", intro: "Help work move forward, whether or not you have a formal title.", skills: [
      skill("ownership", "Taking Ownership", "Notice a needed outcome, clarify your responsibility, and follow through or raise a blocker.", "Ownership makes teams dependable and prevents important work from falling between roles.", "When you accept a task, confirm the outcome and checkpoint; if blocked, report the situation with options.", "Choose an unowned project task, ask whether you can take it, and share a concise completion update.", "Your group has no one coordinating final integration. Offer to organize a check-in and clarify your role.", "Atlassian: Roles and Responsibilities", "https://www.atlassian.com/team-playbook/plays/roles-and-responsibilities"),
      skill("delegation", "Delegation and Coordination", "Match tasks to people, explain expected outcomes, and provide enough context without taking over.", "Sharing ownership gives teammates space to contribute and keeps work moving at a manageable pace.", "Agree on the result, decision boundaries, support needed, and a lightweight check-in.", "In a mock event plan, assign roles by interest and availability, then clarify what each person will deliver.", "You are coordinating a team demo. Distribute preparation tasks and confirm dependencies before the last day.", "Atlassian: Roles and Responsibilities", "https://www.atlassian.com/team-playbook/plays/roles-and-responsibilities"),
      skill("lead-decisions", "Leadership Decision Making", "Help a group make timely decisions by clarifying the goal, options, and who decides.", "Groups need decisions to move from discussion to coordinated action.", "Summarize the question, invite relevant views, agree on a decision method, and record the outcome.", "Facilitate a five-minute choice between project features using agreed criteria and a decision owner.", "Your study group is stuck choosing a presentation topic. Offer criteria and a fair way to decide.", "Atlassian: DACI Decision-Making", "https://www.atlassian.com/team-playbook/plays/daci"),
      skill("mentoring", "Peer Mentoring", "Support another person's learning by listening, sharing experience, and helping them find their own next step.", "Peer support spreads knowledge and helps new team members participate sooner.", "Ask what they have tried, show an example, invite them to attempt it, and check what still feels unclear.", "Teach a classmate a tool shortcut using questions and a short demonstration rather than doing the task for them.", "A new club member is unsure how to contribute. Help them identify a small first task and a contact person.", "University of Michigan: Student Mentoring Handbook", "https://rackham.umich.edu/downloads/student-mentoring-handbook.pdf"),
      skill("initiative", "Initiative", "Identify a useful improvement and propose a small, responsible step to test it.", "Initiative helps teams improve without waiting for every problem to be assigned.", "Observe friction, gather an example, suggest a low-risk change, and ask the affected people before acting.", "Find one repeated inconvenience in a class team and propose a small experiment to reduce it.", "The lab group repeatedly loses track of questions. Suggest a shared question log and review it next meeting.", "University of Arizona: Proactivity and Initiative", "https://gradcenter.arizona.edu/professional-development/core-professional-competencies/cpc-proactivity-initiative")
    ]},
    { id: "professionalism", title: "Professionalism & Workplace Behavior", icon: "◇", intro: "Build trust through respect, reliability, accountability, and thoughtful workplace habits.", skills: [
      skill("etiquette", "Workplace Etiquette", "Show respect for other people's time, boundaries, contributions, and shared spaces.", "Professional courtesy helps create a workplace where people can collaborate comfortably.", "Observe team norms, ask when unsure, and choose respectful behavior across in-person and online settings.", "Practice joining a meeting on time, introducing yourself, and contributing without interrupting.", "You disagree with a classmate in a shared channel. Respond to the idea calmly and move sensitive details to a suitable conversation.", "Purdue OWL: Professional Writing", "https://owl.purdue.edu/owl/subject_specific_writing/professional_technical_writing/business_writing_for_administrative_and_clerical_staff/general_guidelines.html"),
      skill("reliability", "Reliability", "Do what you said you would do, communicate changes, and make your work status visible.", "Reliability allows others to plan and builds confidence in shared work.", "Keep a simple commitment list, confirm priorities, and give an early update if delivery is at risk.", "Track three commitments for a week and note how often you delivered or renegotiated in advance.", "A teammate is waiting for your review before merging work. Send a realistic time estimate and meet it.", "Atlassian: Working Agreements", "https://www.atlassian.com/team-playbook/plays/working-agreements"),
      skill("accountability", "Accountability", "Own the impact of your decisions, acknowledge errors, and take practical steps to repair them.", "Accountability helps teams resolve problems openly and learn rather than hide issues.", "State what happened, acknowledge your part, address immediate impact, and explain how you will reduce recurrence.", "Role-play telling a teammate that you uploaded an outdated file; correct it and state a prevention step.", "You gave a partner incorrect information that changed their work. Notify them promptly and help repair the result.", "Google SRE: Postmortem Culture", "https://sre.google/sre-book/postmortem-culture/"),
      skill("work-communication", "Professional Communication", "Adapt clarity, tone, and channel to the audience and sensitivity of the topic.", "Thoughtful communication reduces misunderstanding and supports respectful working relationships.", "Lead with the purpose, keep private matters private, and choose a direct conversation for sensitive issues.", "Rewrite a casual message into a respectful note to a project supervisor that includes context and a next step.", "A deadline is at risk. Inform the relevant people with facts, impact, and a proposed recovery plan.", "Purdue OWL: Email Etiquette", "https://owl.purdue.edu/owl/general_writing/academic_writing/email_etiquette.html"),
      skill("meeting-etiquette", "Meeting Etiquette", "Help meetings achieve their purpose through preparation, participation, and clear follow-up.", "Well-run meetings respect everyone's time and turn discussion into action.", "Check the purpose beforehand, contribute relevant points, note decisions, and confirm action owners.", "Run a 10-minute mock stand-up with updates, blockers, and named follow-up owners.", "Your project meeting is going in circles. Summarize the open decision and suggest a next step or timebox.", "Atlassian: Page-Led Meetings", "https://www.atlassian.com/team-playbook/plays/page-led-meeting")
    ]},
    { id: "presentation", title: "Presentation & Public Speaking", icon: "▤", intro: "Explain ideas clearly, support them with evidence, and respond to an audience.", skills: [
      skill("presentation-structure", "Structuring a Presentation", "Organize a talk around audience needs, a clear main idea, and a small number of supporting points.", "A clear structure helps an audience follow and remember your message.", "State the takeaway first, group supporting points, and end with a summary or requested action.", "Prepare a three-minute talk about a class project using opening, three key points, and close.", "You have five minutes to brief a faculty panel. Choose the evidence that best supports your recommendation.", "Toastmasters: Public Speaking Tips", "https://www.toastmasters.org/resources/public-speaking-tips"),
      skill("speaking-clearly", "Speaking Clearly and Confidently", "Use pace, volume, pauses, and concise language so listeners can follow your ideas.", "Clear delivery makes good content accessible and helps you respond calmly under attention.", "Rehearse aloud, record one run, and adjust pace or wording where the message becomes hard to follow.", "Record a one-minute introduction; listen for rushed phrases and try again with deliberate pauses.", "You are presenting in a noisy classroom. Project your voice and pause between key points.", "Toastmasters: Your Speaking Voice", "https://www.toastmasters.org/resources/your-speaking-voice"),
      skill("explain-concepts", "Explaining Technical Concepts", "Translate technical ideas into audience-appropriate language without losing accuracy.", "People make better decisions when they understand what a technical result means for them.", "Start from a familiar example, define necessary terms, and check what the listener already knows.", "Explain an API, database, or model to a non-technical friend using one analogy and one limitation.", "A recruiter asks what your project does. Explain the user problem and result before describing the stack.", "Toastmasters: Preparing a Speech", "https://www.toastmasters.org/resources/public-speaking-tips/preparing-a-speech"),
      skill("visual-storytelling", "Visual Storytelling", "Use simple visuals to reveal relationships, evidence, and a narrative rather than decorate slides.", "Well-chosen visuals help audiences grasp patterns faster than dense text.", "Give each visual one purpose, label it clearly, and remove elements that do not support the message.", "Turn a small survey result into one chart and add a title that states the main finding.", "Your project has several metrics. Choose one visual that makes the most important tradeoff visible.", "Toastmasters: Using Visual Aids", "https://www.toastmasters.org/Resources/Video-Library/how-to-use-visual-aids"),
      skill("handling-questions", "Handling Audience Questions", "Listen fully to a question, answer within your knowledge, and clarify when more information is needed.", "Good responses build credibility and turn questions into useful dialogue.", "Pause, repeat or clarify the question, answer directly, and say honestly when you need to follow up.", "Give a short talk to a partner who asks two unexpected questions; practice concise, honest replies.", "An interviewer asks about a project limitation. Acknowledge it and explain what you would improve.", "Toastmasters: Public Speaking Tips", "https://www.toastmasters.org/resources/public-speaking-tips")
    ]},
    { id: "emotional-intelligence", title: "Emotional Intelligence", icon: "♡", intro: "Notice emotions, understand other perspectives, and respond thoughtfully in difficult moments.", skills: [
      skill("self-awareness", "Self-Awareness", "Notice your reactions, strengths, stress signals, and the effect your behavior has on others.", "Self-awareness helps you choose a response instead of reacting automatically.", "After a challenging interaction, note what you felt, what triggered it, and what outcome you wanted.", "Reflect on a recent group discussion: identify when you felt engaged or frustrated and what you did next.", "You feel defensive after a code review comment. Pause and identify the specific concern before replying.", "HelpGuide: Emotional Intelligence", "https://www.helpguide.org/mental-health/wellbeing/emotional-intelligence-eq"),
      skill("empathy", "Empathy", "Try to understand another person's perspective and needs without assuming you share their experience.", "Empathy supports trust and helps teams design responses that fit real people.", "Ask open questions, listen without correcting, and reflect what matters to the other person.", "Interview a classmate about a challenge in a team project and summarize their perspective before suggesting solutions.", "A teammate misses a check-in. Ask what is happening before deciding they do not care.", "Greater Good: Empathy", "https://greatergood.berkeley.edu/topic/empathy/definition"),
      skill("stress-management", "Managing Stress", "Recognize stress early and use healthy routines and support to keep responding effectively.", "Managing stress protects judgment, communication, and sustainable performance.", "Notice your early signs, break the immediate task into a next step, and reach out when support is needed.", "Before an exam or presentation, try a short breathing pause and make a realistic preparation plan.", "Several deadlines arrive together. Identify what is controllable and discuss a priority adjustment with your team.", "NHS: Stress", "https://www.nhs.uk/mental-health/feelings-symptoms-behaviours/feelings-and-symptoms/stress/"),
      skill("understanding-others", "Understanding Others", "Pay attention to different needs, communication styles, and context without stereotyping.", "Respecting differences helps people contribute and prevents assumptions from becoming barriers.", "Ask preferences directly, use inclusive language, and check that everyone has a way to participate.", "Facilitate a group brainstorm with silent idea writing first, then invite each person to share.", "Remote teammates miss decisions made in an in-person conversation. Create a written summary and invite corrections.", "Atlassian: Team Culture of Trust", "https://www.atlassian.com/team-playbook/plays/team-culture-of-trust"),
      skill("difficult-conversations", "Handling Difficult Conversations", "Address a sensitive issue with preparation, respect, clear examples, and a willingness to listen.", "Avoiding important conversations can deepen tension and make practical resolution harder.", "Choose a private setting, describe observable behavior, explain impact, ask for their view, and agree on next steps.", "Role-play asking a project partner to meet agreed deadlines; keep the conversation specific and solution-focused.", "A teammate dismisses your idea repeatedly. Explain the behavior's impact and ask for a more constructive discussion.", "Atlassian: Clean Escalations", "https://www.atlassian.com/team-playbook/plays/clean-escalations")
    ]},
    { id: "career-readiness", title: "Career & Workplace Readiness", icon: "⌂", intro: "Present your experience honestly and build confident, respectful professional connections.", skills: [
      skill("resume-communication", "Resume Communication", "Describe experience with clear, specific evidence of what you contributed and learned.", "A focused resume helps reviewers connect your skills to the opportunity.", "Use action verbs, explain your role, and add outcomes or scope without overstating your contribution.", "Rewrite one class project bullet to state your contribution, tools used, and a verifiable result.", "A recruiter scans your resume quickly. Make your relevant project contribution easy to find.", "Harvard FAS: Resume Guide", "https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/"),
      skill("interview-communication", "Interview Communication", "Answer questions with relevant examples, explain your reasoning, and connect your experience to the role.", "Clear examples help interviewers understand how you approach real work.", "Prepare a few concise situation-action-result examples and practice adapting them to the question asked.", "Run a mock interview and answer “Tell me about a challenge” with a specific project example.", "An interviewer asks about a disagreement. Explain what you did, what changed, and what you learned.", "Harvard FAS: Interviewing", "https://careerservices.fas.harvard.edu/resources/interviewing/"),
      skill("networking-conversations", "Networking Conversations", "Start genuine professional conversations by showing curiosity and making a clear, respectful introduction.", "Relationships can help you learn about fields and opportunities over time.", "Prepare a brief introduction, ask about the other person's experience, and follow up with a specific thanks.", "Introduce yourself to an alumnus at an event and ask one thoughtful question about their work.", "You meet an engineer after a campus talk. Explain what you are learning and ask how they entered the field.", "Harvard FAS: Making Connections", "https://careerservices.fas.harvard.edu/resources/harvard-college-guide-to-making-connections-2/"),
      skill("asking-for-help", "Asking for Help", "Request support with enough context to show what you are trying to accomplish and where you are stuck.", "Timely questions prevent wasted effort and make it easier for others to help effectively.", "Share the goal, what you tried, the result, and the specific decision or explanation you need.", "Write a concise help request for a coding issue, including steps tried and a minimal example.", "You cannot access a project resource. Ask your supervisor for help and mention the error and what you have checked.", "Stack Overflow Help: Asking Good Questions", "https://stackoverflow.com/help/how-to-ask"),
      skill("online-presence", "Professional Online Presence", "Keep public profiles accurate, respectful, and consistent with the kind of work you want to do.", "A thoughtful online presence makes projects and professional interests easier to understand.", "Review profile details, link to a few finished projects, and remove information you would not choose to share publicly.", "Review your professional profile and portfolio as if you were a recruiter; improve one unclear section.", "A hiring manager opens your project repository. Make the description, setup, and your contribution easy to understand.", "GitHub: Profile README", "https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme")
    ]}
  ];

  const allSkills = domains.flatMap((domain) => domain.skills);
  const catalogueSkillIds = new Set(allSkills.map((item) => item.id));
  const loadAuthoritativeState = async (storage) => {
    const progressStore = window.progressStore;
    if (!progressStore) throw new Error("The shared progress store is unavailable.");

    const existingRows = await progressStore.loadSoftSkillProgress();
    const existingById = new Map(existingRows.map((row) => [row.skill_id, row.started]));
    let legacy = {};
    try {
      const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const levels = parsed.levels && typeof parsed.levels === "object" && !Array.isArray(parsed.levels) ? parsed.levels : {};
        const started = parsed.started && typeof parsed.started === "object" && !Array.isArray(parsed.started) ? parsed.started : {};
        for (const [id, level] of Object.entries(levels)) {
          if (["Beginner", "Developing", "Strong"].includes(level)) legacy[id] = true;
          else if (level === "Not Started") legacy[id] = false;
        }
        for (const [id, value] of Object.entries(started)) {
          if (typeof value === "boolean") legacy[id] = value;
        }
      }
    } catch (error) {
      console.warn("Legacy Soft Skills progress could not be read for migration.", error);
    }

    const missingRows = Object.entries(legacy)
      .filter(([id, started]) => catalogueSkillIds.has(id) && typeof started === "boolean" && !existingById.has(id))
      .map(([skill_id, started]) => ({ skill_id, started }));
    for (let index = 0; index < missingRows.length; index += 10) {
      await Promise.all(missingRows.slice(index, index + 10).map((record) => progressStore.insertSoftSkillProgressIfMissing(record)));
    }

    const rows = await progressStore.loadSoftSkillProgress();
    return Object.fromEntries(rows.filter((row) => catalogueSkillIds.has(row.skill_id)).map((row) => [row.skill_id, row.started]));
  };
  const calculateProgress = (state) => {
    const startedSkills = allSkills.filter((item) => state[item.id] === true).length;
    const progress = Math.max(0, Math.min(100, allSkills.length ? Math.round(startedSkills / allSkills.length * 100) : 0));
    const startedDomains = domains.filter((domain) => domain.skills.some((item) => state[item.id] === true)).length;
    return { progress, startedDomains, startedSkills, totalSkills: allSkills.length };
  };
  window.softSkillsProgress = Object.freeze({ loadAuthoritativeState, calculateProgress, totalSkills: allSkills.length });
  resolveSoftSkillsProgress(window.softSkillsProgress);

  const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const list = document.querySelector("#soft-domain-list");
  if (!list) return;

  let stored = {};
  try {
    stored = await loadAuthoritativeState(localStorage);
  } catch (error) {
    console.error("Authoritative Soft Skills progress could not be loaded.", error);
    const note = document.querySelector("#soft-progress-note");
    if (note) note.textContent = "Soft Skills progress could not be loaded from your account. Your local data is unchanged. Please refresh and try again.";
    return;
  }

  const isStarted = (id) => stored[id] === true;
  let practiceData = { reflections: {}, simulations: {}, activities: {} };
  try {
    const savedPractice = JSON.parse(localStorage.getItem(PRACTICE_STORAGE_KEY) || "{}");
    const isRecord = (value) => value && typeof value === "object" && !Array.isArray(value);
    if (isRecord(savedPractice)) practiceData = {
      reflections: isRecord(savedPractice.reflections) ? savedPractice.reflections : {},
      simulations: isRecord(savedPractice.simulations) ? savedPractice.simulations : {},
      activities: isRecord(savedPractice.activities) ? savedPractice.activities : {}
    };
  } catch (error) {
    console.warn("Soft skills practice notes could not be read from local storage.", error);
  }
  const savePractice = () => {
    try { localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(practiceData)); return true; }
    catch (error) { console.warn("Soft skills practice could not be saved to local storage.", error); return false; }
  };
  const aiPracticeDomains = new Set(["communication", "teamwork", "problem-solving", "leadership", "presentation", "emotional-intelligence", "career-readiness"]);
  const practiceTools = {
    teamwork: resource("Trello boards", "https://trello.com/", "tool", "Use a shared board to assign owners, track handoffs, and make group work visible."),
    "time-management": resource("Microsoft To Do", "https://to-do.office.com/", "tool", "Practice turning priorities into a short, reviewable task list."),
    presentation: resource("Find a Toastmasters club", "https://toastmasters.org/find-a-club", "tool", "Find a local group where you can speak, receive feedback, and practice regularly.")
  };
  const typeBadge = (type) => {
    const info = resourceTypes[type];
    return `<span class="soft-type-badge soft-type-${escapeHTML(type)}"><span aria-hidden="true">${info.icon}</span> ${info.label}</span>`;
  };
  const aiPromptFor = (item) => `Act as a supportive practice partner helping me improve ${item.name}. Use this scenario: ${item.scenario}\n\nAsk me to respond first. Then give specific, kind feedback on what was clear, how I handled the other person's needs, and one practical way to improve. Let me try again. Do not score me or claim this is a real assessment.`;
  list.innerHTML = domains.map((domain, domainIndex) => {
    const rated = domain.skills.filter((item) => isStarted(item.id)).length;
    return `<details class="soft-domain" ${domainIndex === 0 ? "open" : ""}>
      <summary class="soft-domain-summary"><span class="soft-domain-icon" aria-hidden="true">${escapeHTML(domain.icon)}</span><span class="soft-domain-title"><strong>${escapeHTML(domain.title)}</strong><small>${escapeHTML(domain.intro)}</small></span><span class="soft-domain-count" data-domain-count="${escapeHTML(domain.id)}">${rated} of ${domain.skills.length} started</span><span class="soft-domain-chevron" aria-hidden="true">⌄</span></summary>
      <div class="soft-skill-grid">${domain.skills.map((item) => `<article class="soft-skill-card${isStarted(item.id) ? " is-started" : ""}" data-skill-card="${escapeHTML(item.id)}">
        <div class="soft-skill-heading"><span class="soft-skill-symbol" aria-hidden="true">◇</span><div class="soft-skill-title"><h3>${escapeHTML(item.name)}</h3><button class="soft-start-control${isStarted(item.id) ? " is-started" : ""}" type="button" data-started-id="${escapeHTML(item.id)}" aria-pressed="${isStarted(item.id)}" aria-label="${isStarted(item.id) ? "Unstart" : "Start"} ${escapeHTML(item.name)}"><span class="soft-start-check" aria-hidden="true">${isStarted(item.id) ? "✓" : ""}</span><span>Started</span></button></div></div>
        <p class="soft-skill-meaning">${escapeHTML(item.meaning)}</p>
        <details class="soft-skill-details"><summary>Explore this skill</summary><div class="soft-skill-content">
          <section><h4>Why it matters</h4><p>${escapeHTML(item.why)}</p></section>
          <section><h4>How to improve</h4><p>${escapeHTML(item.improve)}</p></section>
          <section class="soft-learning-section" aria-label="Learn"><h4>Learn</h4><ul class="soft-learning-resources">${item.resources.map((entry) => `<li>${typeBadge(entry.type)}<a href="${escapeHTML(entry.url)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHTML(entry.title)} in a new tab">${escapeHTML(entry.title)} <span aria-hidden="true">↗</span></a>${entry.description ? `<small>${escapeHTML(entry.description)}</small>` : ""}</li>`).join("")}</ul></section>
          <section class="soft-practice-box"><h4>Practice</h4>${typeBadge("practice")}<p>${escapeHTML(item.exercise)}</p><label class="soft-activity-check"><input type="checkbox" data-activity-id="${escapeHTML(item.id)}" ${practiceData.activities[item.id] ? "checked" : ""}><span>Mark activity complete</span></label></section>
          <details class="soft-simulation"><summary>${typeBadge("simulation")}${typeBadge("interactive")} Practice the scenario</summary><div class="soft-simulation-body"><p><strong>Scenario:</strong> ${escapeHTML(item.scenario)}</p><label for="simulation-${escapeHTML(item.id)}">How would you respond?</label><textarea id="simulation-${escapeHTML(item.id)}" data-simulation-id="${escapeHTML(item.id)}" rows="3" placeholder="Write or outline your response…">${escapeHTML((practiceData.simulations[item.id] || {}).response || "")}</textarea><button class="soft-feedback-button" type="button" data-feedback-id="${escapeHTML(item.id)}">Compare with guidance</button><div class="soft-feedback-guidance" data-guidance-id="${escapeHTML(item.id)}" ${((practiceData.simulations[item.id] || {}).guidanceViewed) ? "" : "hidden"}><strong>Guidance to compare:</strong><p>${escapeHTML(item.improve)}</p><small>This is a reflection aid, not an automated score. Revise your response and compare again.</small></div><button class="soft-retry-button" type="button" data-retry-id="${escapeHTML(item.id)}">Try again</button></div></details>
          ${aiPracticeDomains.has(domain.id) ? `<details class="soft-ai-practice"><summary>${typeBadge("ai-practice")} Copy a role-play prompt</summary><div class="soft-ai-body"><p>This page has no AI connection. Copy this prompt into an AI assistant you choose; do not include private or sensitive information.</p><textarea readonly rows="5" data-prompt-id="${escapeHTML(item.id)}">${escapeHTML(aiPromptFor(item))}</textarea><button class="soft-copy-prompt" type="button" data-copy-prompt="${escapeHTML(item.id)}">Copy practice prompt</button><span class="soft-copy-status" data-copy-status="${escapeHTML(item.id)}" role="status"></span></div></details>` : ""}
          ${practiceTools[domain.id] ? `<p class="soft-tool-resource">${typeBadge("tool")} <a href="${escapeHTML(practiceTools[domain.id].url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(practiceTools[domain.id].title)}</a><small>${escapeHTML(practiceTools[domain.id].description)}</small></p>` : ""}
          <details class="soft-reflection"><summary>${typeBadge("reflection")} My reflection</summary><div class="soft-reflection-fields">${[["did", "What I did"], ["wentWell", "What went well"], ["difficult", "What was difficult"], ["improve", "What I should improve"], ["next", "What I will try next"]].map(([key, label]) => `<label>${label}<textarea rows="2" data-reflection-id="${escapeHTML(item.id)}" data-reflection-field="${key}" placeholder="Add a short note…">${escapeHTML(((practiceData.reflections[item.id] || {})[key]) || "")}</textarea></label>`).join("")}<span class="soft-reflection-status" data-reflection-status="${escapeHTML(item.id)}" role="status">Saved on this device</span></div></details>
        </div></details>
      </article>`).join("")}</div>
    </details>`;
  }).join("");

  const renderProgress = () => {
    const { progress, startedDomains, startedSkills } = calculateProgress(stored);
    document.querySelector("#soft-overall").textContent = `${progress}%`;
    document.querySelector("#soft-meter-fill").style.width = `${progress}%`;
    document.querySelector(".soft-meter").setAttribute("aria-valuenow", String(progress));
    document.querySelector("#soft-domains-started").textContent = `${startedDomains} of ${domains.length}`;
    document.querySelector("#soft-skills-started").textContent = String(startedSkills);
    document.querySelector("#soft-skills-to-explore").textContent = String(allSkills.length - startedSkills);
    domains.forEach((domain) => {
      const count = domain.skills.filter((item) => isStarted(item.id)).length;
      const label = document.querySelector(`[data-domain-count="${domain.id}"]`);
      if (label) label.textContent = `${count} of ${domain.skills.length} started`;
    });
    window.dispatchEvent(new CustomEvent("softSkillsProgressUpdated", { detail: { progress, startedDomains, startedSkills, totalSkills: allSkills.length } }));
  };

  list.addEventListener("change", (event) => {
    const activity = event.target.closest("[data-activity-id]");
    if (activity) {
      practiceData.activities[activity.dataset.activityId] = activity.checked;
      savePractice();
      return;
    }
  });
  list.addEventListener("input", (event) => {
    const simulation = event.target.closest("[data-simulation-id]");
    if (simulation) {
      practiceData.simulations[simulation.dataset.simulationId] = {
        ...(practiceData.simulations[simulation.dataset.simulationId] || {}), response: simulation.value
      };
      savePractice();
    }
    const reflection = event.target.closest("[data-reflection-id]");
    if (reflection) {
      const currentReflection = practiceData.reflections[reflection.dataset.reflectionId];
      const skillReflection = currentReflection && typeof currentReflection === "object" && !Array.isArray(currentReflection) ? currentReflection : {};
      skillReflection[reflection.dataset.reflectionField] = reflection.value;
      practiceData.reflections[reflection.dataset.reflectionId] = skillReflection;
      const saved = savePractice();
      const status = list.querySelector(`[data-reflection-status="${reflection.dataset.reflectionId}"]`);
      if (status) status.textContent = saved ? "Saved on this device" : "Could not save; check browser storage settings";
    }
  });
  list.addEventListener("click", (event) => {
    const startedControl = event.target.closest("[data-started-id]");
    if (startedControl) {
      const id = startedControl.dataset.startedId;
      if (!catalogueSkillIds.has(id)) return;
      const nextStarted = !isStarted(id);
      startedControl.disabled = true;
      (async () => {
        try {
          await window.progressStore.upsertSoftSkillProgress({ skill_id: id, started: nextStarted });
          stored[id] = nextStarted;
          const card = startedControl.closest(".soft-skill-card");
          startedControl.classList.toggle("is-started", nextStarted);
          startedControl.setAttribute("aria-pressed", String(nextStarted));
          startedControl.setAttribute("aria-label", `${nextStarted ? "Unstart" : "Start"} ${card.querySelector("h3").textContent}`);
          startedControl.querySelector(".soft-start-check").textContent = nextStarted ? "✓" : "";
          card.classList.toggle("is-started", nextStarted);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ started: stored, totalSkills: allSkills.length }));
            document.querySelector("#soft-progress-note").textContent = "Progress saved to your account.";
          } catch (storageError) {
            console.warn("Soft Skills progress was saved to Supabase, but the local cache could not be updated.", storageError);
            document.querySelector("#soft-progress-note").textContent = "Progress saved to your account. The local compatibility cache could not be updated.";
          }
          renderProgress();
        } catch (error) {
          console.error("Soft Skills progress write failed:", error);
          const note = document.querySelector("#soft-progress-note");
          if (note) note.textContent = `Could not save this skill to your account (${error.code || "write error"}). Your change was not applied. Please try again.`;
        } finally {
          startedControl.disabled = false;
        }
      })();
      return;
    }
    const feedbackButton = event.target.closest("[data-feedback-id]");
    if (feedbackButton) {
      const id = feedbackButton.dataset.feedbackId;
      practiceData.simulations[id] = { ...(practiceData.simulations[id] || {}), guidanceViewed: true };
      savePractice();
      const guidance = list.querySelector(`[data-guidance-id="${id}"]`);
      if (guidance) guidance.hidden = false;
      return;
    }
    const retryButton = event.target.closest("[data-retry-id]");
    if (retryButton) {
      const id = retryButton.dataset.retryId;
      practiceData.simulations[id] = { response: "", guidanceViewed: false };
      savePractice();
      const response = list.querySelector(`[data-simulation-id="${id}"]`);
      const guidance = list.querySelector(`[data-guidance-id="${id}"]`);
      if (response) response.value = "";
      if (guidance) guidance.hidden = true;
      return;
    }
    const copyButton = event.target.closest("[data-copy-prompt]");
    if (copyButton) {
      const id = copyButton.dataset.copyPrompt;
      const prompt = list.querySelector(`[data-prompt-id="${id}"]`);
      const status = list.querySelector(`[data-copy-status="${id}"]`);
      const fallbackCopy = () => {
        prompt.focus(); prompt.select();
        return document.execCommand("copy");
      };
      const copyResult = navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(prompt.value).then(() => true).catch(fallbackCopy)
        : Promise.resolve(fallbackCopy());
      copyResult.then((copied) => { if (status) status.textContent = copied ? "Prompt copied. Paste it into your chosen AI assistant." : "Select and copy the prompt above."; });
    }
  });
  renderProgress();
  });
})();
