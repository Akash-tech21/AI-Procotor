"""Interview flow manager.

Tracks which questions have been asked, manages phase transitions, provides
adaptive follow-up logic, and enforces the time budget (~8-10 min).
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum

from prompts import GENERIC_FOLLOW_UPS, QUESTION_BANK

# Target interview length in seconds (10 minutes hard cap).
MAX_INTERVIEW_SECONDS = 10 * 60
# Soft target -- start wrapping up around 8 minutes.
WRAP_UP_SECONDS = 8 * 60
# If the candidate says very little, we ask a follow-up.
SHORT_ANSWER_WORD_THRESHOLD = 15
# Silence longer than this (seconds) triggers a gentle nudge.
SILENCE_TIMEOUT_SECONDS = 30


class Phase(str, Enum):
    GREETING = "greeting"
    INTRODUCTION = "introduction"
    CORE_QUESTIONS = "core_questions"
    WRAP_UP = "wrap_up"
    ENDED = "ended"


# ---------------------------------------------------------------------------
# Escalating nudge banks
# ---------------------------------------------------------------------------

SILENCE_NUDGES = [
    # Level 1: Very gentle, first silence
    (
        "The candidate has been quiet for a while. Gently and warmly check in with "
        "something like 'Take your time, there is absolutely no rush' or 'I know that "
        "is a big question, just share whatever comes to mind.' Do not repeat the "
        "question yet."
    ),
    # Level 2: Offer to repeat or rephrase
    (
        "The candidate has been quiet again. This time, offer to help by saying "
        "something like 'Would you like me to rephrase that question?' or 'I can come "
        "at it from a different angle if that would help.' If they seem stuck, let them "
        "know it is perfectly okay."
    ),
    # Level 3: Offer to skip and move on
    (
        "The candidate has been quiet for an extended time. Gently offer to move on by "
        "saying something like 'No worries at all, we can come back to this one if you "
        "like. Let me ask you something else instead.' Then move to the next question."
    ),
]

SHORT_ANSWER_NUDGES = [
    # Level 1: Gentle probe
    (
        "The candidate's answer was quite brief. Encourage them to share more with a "
        "warm, open-ended follow-up. Use something like 'That is a great start, could "
        "you tell me a little more about that?' or 'I would love to hear more detail "
        "if you have any.'"
    ),
    # Level 2: More specific probe
    (
        "The candidate gave another short answer. This time, ask a more specific "
        "follow-up related to the question's topic. Try to ask about a concrete example "
        "or scenario. You could say 'Can you think of a specific time that happened?' or "
        "'What would that look like in practice with an actual student?'"
    ),
    # Level 3: Accept and move on
    (
        "The candidate has given brief answers to multiple prompts. That is okay, some "
        "people are more concise. Acknowledge their answer warmly and move on to the "
        "next question rather than pressing further. Do not make them feel they are "
        "doing poorly."
    ),
]


@dataclass
class InterviewState:
    """Mutable state tracking the progress of a single interview."""

    phase: Phase = Phase.GREETING
    start_time: float = field(default_factory=time.time)
    questions_asked: list[str] = field(default_factory=list)
    follow_ups_used: int = 0
    last_activity_time: float = field(default_factory=time.time)
    transcript_items: list[dict[str, str]] = field(default_factory=list)

    # Escalation tracking
    silence_nudge_count: int = 0
    short_answer_nudge_count: int = 0
    follow_ups_used_for_question: dict[str, int] = field(default_factory=dict)

    # Candidate info
    candidate_name: str | None = None

    # ---- helpers ----

    @property
    def elapsed_seconds(self) -> float:
        return time.time() - self.start_time

    @property
    def should_wrap_up(self) -> bool:
        return self.elapsed_seconds >= WRAP_UP_SECONDS

    @property
    def is_over_time(self) -> bool:
        return self.elapsed_seconds >= MAX_INTERVIEW_SECONDS

    @property
    def silence_duration(self) -> float:
        return time.time() - self.last_activity_time

    def record_activity(self) -> None:
        self.last_activity_time = time.time()

    def add_transcript(self, role: str, text: str) -> None:
        self.transcript_items.append({
            "role": role,
            "content": text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        self.record_activity()

    def get_full_transcript(self) -> str:
        lines: list[str] = []
        for item in self.transcript_items:
            speaker = "Interviewer" if item["role"] == "agent" else "Candidate"
            lines.append(f"{speaker}: {item['content']}")
        return "\n\n".join(lines)

    def get_transcript_items(self) -> list[dict[str, str]]:
        return list(self.transcript_items)


# ---------------------------------------------------------------------------
# Question bank helpers
# ---------------------------------------------------------------------------

def get_next_question(state: InterviewState) -> str | None:
    """Return the next unasked core question, or None if all have been asked."""
    for q in QUESTION_BANK:
        if q["id"] not in state.questions_asked:
            return q["id"]
    return None


def get_question_text(question_id: str) -> str:
    """Look up the display text for a question by its id."""
    for q in QUESTION_BANK:
        if q["id"] == question_id:
            return q["question"]
    return ""


def get_question_intent(question_id: str) -> str:
    """Look up the intent for a question by its id."""
    for q in QUESTION_BANK:
        if q["id"] == question_id:
            return q.get("intent", "")
    return ""


def get_question_follow_ups(question_id: str) -> list[str]:
    """Look up the dimension-specific follow-ups for a question by its id."""
    for q in QUESTION_BANK:
        if q["id"] == question_id:
            return q.get("follow_ups", [])
    return []


def needs_follow_up(answer_text: str) -> bool:
    """Decide whether the candidate's answer was too brief."""
    return len(answer_text.split()) < SHORT_ANSWER_WORD_THRESHOLD


def pick_follow_up(state: InterviewState) -> str:
    """Return a follow-up prompt, cycling through the generic bank."""
    prompt = GENERIC_FOLLOW_UPS[state.follow_ups_used % len(GENERIC_FOLLOW_UPS)]
    state.follow_ups_used += 1
    return prompt


# ---------------------------------------------------------------------------
# Phase instructions
# ---------------------------------------------------------------------------

def build_phase_instructions(state: InterviewState) -> str:
    """Build dynamic LLM instructions based on the current interview phase.

    These instructions are passed to ``session.generate_reply(instructions=...)``
    and are *not* recorded in chat history -- they steer the LLM's next turn
    without polluting the conversation context.
    """
    if state.phase == Phase.GREETING:
        state.phase = Phase.INTRODUCTION
        name_part = (
            f" Address them by name: {state.candidate_name}."
            if state.candidate_name
            else ""
        )
        return (
            "Greet the candidate warmly and introduce yourself as Priya from Cuemath."
            + name_part
            + " Tell them you are excited to chat with them today. Explain that this "
            "will be a short, relaxed conversation, about 10 minutes, where you want "
            "to learn a little about their teaching style and experience. Reassure "
            "them that there are no trick questions and they should just be themselves. "
            "Then ask them to tell you a bit about themselves and their teaching "
            "background. Keep the greeting brief and natural, no more than 4 sentences."
        )

    if state.phase == Phase.INTRODUCTION:
        state.phase = Phase.CORE_QUESTIONS
        next_id = get_next_question(state)
        if next_id:
            state.questions_asked.append(next_id)
            q_text = get_question_text(next_id)
            return (
                "Thank the candidate for sharing their background. Pick out one "
                "specific thing they mentioned and briefly comment on it to show you "
                "were listening, for example if they mentioned teaching for two years, "
                "you could say something like 'Two years is great, you have clearly "
                "spent real time in the classroom.' Then naturally lead into the first "
                f"core question. The question to ask is: {q_text} -- Rephrase it "
                "slightly in your own words so it does not sound like you are reading "
                "from a script."
            )

    if state.phase == Phase.CORE_QUESTIONS:
        if state.should_wrap_up or state.is_over_time:
            state.phase = Phase.WRAP_UP
            return (
                "We are close to the end of our time together. Thank the candidate "
                "sincerely for their answers. Mention one specific thing from the "
                "interview that stood out positively. Then ask if they have any "
                "questions about Cuemath or the process before you wrap up. If they "
                "do ask a question, answer it briefly and helpfully. If they say they "
                "have no questions, that is fine. After addressing any questions, let "
                "them know the team will review the interview and they will hear back "
                "soon. Wish them a great rest of their day."
            )

        next_id = get_next_question(state)
        if next_id is None:
            state.phase = Phase.WRAP_UP
            return (
                "You have covered all the questions. Thank the candidate sincerely "
                "and mention something specific from the conversation that you "
                "appreciated. Ask if they have any questions about Cuemath or what "
                "happens next. After addressing any questions, let them know the team "
                "will review everything and be in touch soon. End on a warm, "
                "encouraging note."
            )

        state.questions_asked.append(next_id)
        q_text = get_question_text(next_id)
        q_intent = get_question_intent(next_id)
        return (
            "Before moving on, briefly acknowledge something specific the candidate "
            "just said. A short phrase like 'I really like how you put that' or "
            "'That is a thoughtful approach' works well. Then create a natural bridge "
            "to the next topic. Do not say 'moving on to the next question' or "
            "anything that sounds like a checklist. Instead, use a conversational "
            f"connector. The next question to work in is: {q_text} -- You are trying "
            f"to assess: {q_intent}. Rephrase the question naturally in your own words."
        )

    if state.phase == Phase.WRAP_UP:
        state.phase = Phase.ENDED
        return (
            "Say a final warm goodbye. Keep it brief and genuine, one or two "
            "sentences. Wish them well and say you enjoyed the conversation."
        )

    # ENDED -- no more instructions
    return ""


# ---------------------------------------------------------------------------
# Nudges (escalating)
# ---------------------------------------------------------------------------

def build_silence_nudge(state: InterviewState) -> str:
    """Return an escalating instruction for the LLM to nudge a silent candidate."""
    level = min(state.silence_nudge_count, len(SILENCE_NUDGES) - 1)
    state.silence_nudge_count += 1
    return SILENCE_NUDGES[level]


def build_short_answer_nudge(state: InterviewState) -> str:
    """Return an escalating instruction asking the LLM to probe for more detail.

    Prefers question-specific follow-ups when available, then falls back to
    the generic short-answer nudge bank.
    """
    level = min(state.short_answer_nudge_count, len(SHORT_ANSWER_NUDGES) - 1)
    state.short_answer_nudge_count += 1

    # Try question-specific follow-ups first (levels 0-1)
    current_question_id = (
        state.questions_asked[-1] if state.questions_asked else None
    )
    if current_question_id and level <= 1:
        follow_ups = get_question_follow_ups(current_question_id)
        used = state.follow_ups_used_for_question.get(current_question_id, 0)
        if used < len(follow_ups):
            state.follow_ups_used_for_question[current_question_id] = used + 1
            return (
                "The candidate's answer was quite brief. Ask this natural follow-up "
                f"to draw out more detail: '{follow_ups[used]}'"
            )

    return SHORT_ANSWER_NUDGES[level]
