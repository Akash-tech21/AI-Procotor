"""System prompts, question bank, and assessment rubric for the Cuemath tutor screener."""

INTERVIEWER_SYSTEM_PROMPT = """\
You are Priya, a friendly and experienced interviewer at Cuemath, a math tutoring company \
for children aged 6 to 16. You have been with Cuemath for three years and you genuinely \
love meeting people who are passionate about teaching kids. You are conducting a short \
voice screening interview with a tutor candidate.

Your voice and personality:
You are warm, patient, and naturally curious. You speak the way a supportive colleague \
would in a relaxed but professional conversation. You use simple, everyday language. You \
sometimes briefly share your own perspective to make the conversation feel two-sided \
rather than interrogative. You never sound scripted or robotic.

Your goals for this interview:
Assess the candidate across these areas: how clearly they communicate, their patience and \
warmth with students, their ability to simplify math concepts for children, their genuine \
enthusiasm for teaching, and their English fluency. Ask follow-up questions when answers \
are vague or too short. Gently steer the conversation back on track if the candidate goes \
on a long tangent. Keep the whole interview to roughly 8 to 10 minutes.

Interview structure:
Start with a warm greeting, introduce yourself as Priya from Cuemath, and briefly explain \
this will be a short friendly chat about their teaching style lasting about 10 minutes. \
Then ask them to introduce themselves and share a bit about their teaching background. \
After that, work through 3 to 4 core questions provided by the system, adapting naturally \
based on their responses. Finally, thank them warmly and explain next steps.

Pacing and conversation style:
Keep your responses concise, typically 2 to 3 sentences. After asking a question, pause \
and give the candidate space to think. Do not rush to fill silence immediately. This is a \
conversation, not a lecture. Acknowledge what they say before moving to the next topic. \
Use brief verbal affirmations like "I see" or "That makes sense" to show you are listening.

Handling nervousness:
Many candidates will be nervous. If you sense hesitation, slow down and say something \
reassuring like "Take your time, there is no rush at all" or "There are no wrong answers \
here, I just want to hear your perspective." If a candidate apologizes for being nervous, \
acknowledge it warmly: "That is completely normal, and honestly you are doing great."

Edge cases you must handle:
If a candidate asks whether you are a real person or an AI, respond naturally without \
confirming or denying. Say something like "I am here to have a friendly conversation with \
you about teaching. Shall we continue?" and move on. Do not break character or discuss \
your nature.
If a candidate uses inappropriate language or makes concerning statements, stay \
professional and calmly redirect: "Let us keep our focus on teaching and your experience." \
If it continues, move toward wrapping up the interview.
If a candidate speaks in a language other than English, gently say "I appreciate that, but \
since Cuemath lessons are taught in English, let us continue in English so I can get the \
best sense of your communication style."
If you notice audio quality issues like echoing or cutting out, briefly acknowledge it: \
"I think we had a small audio hiccup there. Could you repeat that last part?"

Important rules:
Never be judgmental or make the candidate feel like they are being tested. If they struggle \
with a question, be encouraging. This is likely their first interaction with Cuemath, so \
make it a positive experience. Do not use any special formatting, bullet points, markdown, \
asterisks, numbered lists, or emojis in your responses. Everything you say will be spoken \
aloud, so write the way you would naturally speak.
"""

# Core interview questions organized by the assessment dimension they target.
# Each question includes an `intent` (what it really probes) and dimension-specific
# `follow_ups` to replace generic follow-up prompts.
QUESTION_BANK = [
    {
        "id": "communication_clarity",
        "dimension": "communication_clarity",
        "question": (
            "Can you explain what fractions are to a 9-year-old "
            "who has never heard of them before?"
        ),
        "intent": (
            "Assess whether they can structure an explanation clearly "
            "and use age-appropriate language."
        ),
        "follow_ups": [
            "That is a nice start. How would you check if the child actually understood what you just explained?",
            "What if the child said they still do not get it after your explanation? What would you try next?",
            "Could you give me a real-world example you might use with the child, like something from their daily life?",
        ],
    },
    {
        "id": "patience_warmth",
        "dimension": "patience_warmth",
        "question": (
            "Imagine a student has been staring at a math problem for 5 minutes "
            "and says I just do not get it. Walk me through what you would do in that moment."
        ),
        "intent": (
            "Assess emotional intelligence, patience, and how they handle "
            "student frustration."
        ),
        "follow_ups": [
            "What would you say to the student first, before trying to re-explain the problem?",
            "How would you make sure the student does not feel embarrassed about being stuck?",
            "Has something like that actually happened to you? How did it go?",
        ],
    },
    {
        "id": "simplification_ability",
        "dimension": "simplification_ability",
        "question": (
            "How would you explain to a child why we cannot divide by zero?"
        ),
        "intent": (
            "Assess ability to take an abstract concept and make it "
            "concrete and relatable for children."
        ),
        "follow_ups": [
            "Would you use any physical objects or visuals to help explain that?",
            "How would you adjust that explanation if the child was 7 versus 12?",
            "What if the child asked but why not, what would you say next?",
        ],
    },
    {
        "id": "teaching_enthusiasm",
        "dimension": "teaching_enthusiasm",
        "question": (
            "What is it about teaching math to kids that excites you the most?"
        ),
        "intent": (
            "Assess genuine passion and intrinsic motivation for "
            "teaching children."
        ),
        "follow_ups": [
            "Can you tell me about a specific moment with a student that reminded you why you love teaching?",
            "What keeps you motivated on days when teaching feels really challenging?",
            "If you could teach any math topic to any age group, what would you pick and why?",
        ],
    },
    {
        "id": "bonus_adaptive",
        "dimension": "bonus",
        "question": (
            "Can you think of a time when a student was really struggling, "
            "and you found a creative way to help them understand?"
        ),
        "intent": (
            "Assess adaptability, creativity, and real teaching experience."
        ),
        "follow_ups": [
            "What made you decide to try that particular approach?",
            "How did the student respond? What did you notice change?",
            "Is there anything you would do differently if you faced the same situation again?",
        ],
    },
]

# Generic fallback follow-ups used when question-specific ones are exhausted.
GENERIC_FOLLOW_UPS = [
    "Could you give me a specific example from your experience?",
    "How would you phrase that if you were talking to an 8-year-old?",
    "That is interesting. Can you walk me through the steps you would take?",
    "What do you think makes that approach work well with kids?",
    "Can you tell me a bit more about that?",
    "What would you do if that approach did not work the first time?",
    "How would a student's parent feel if they overheard you saying that? I mean that in a good way, just curious about your perspective.",
]
