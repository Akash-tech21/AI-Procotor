import { env } from "@proctor/env/server";

export type TranscriptItem = {
  role: "agent" | "candidate";
  content: string;
  timestamp: string;
};

export type AssessmentDimension = {
  dimension: string;
  score: number;
  evidence: string;
  notes: string;
};

export type GeneratedAssessment = {
  overallScore: number;
  recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  summary: string;
  dimensions: AssessmentDimension[];
};

const RUBRIC: Record<
  string,
  {
    name: string;
    description: string;
    weight: string;
    criteria: Record<number, string>;
  }
> = {
  communication_clarity: {
    name: "Communication Clarity",
    description:
      "How clearly and effectively the candidate communicates ideas, especially when explaining math concepts",
    weight: "high",
    criteria: {
      5: "Exceptionally clear and well-structured explanations. Builds from simple to complex. Uses concrete examples without being prompted. Checks for understanding naturally. Would be immediately effective explaining concepts to children.",
      4: "Clear communication with good structure. Explanations make sense and are mostly age-appropriate. Minor areas where they could be more concise or concrete.",
      3: "Adequate communication. Gets the point across but explanations are sometimes disorganized, overly abstract, or too long. Would benefit from coaching on structure.",
      2: "Frequently unclear. Jumps between ideas, uses jargon without realizing it, or gives explanations that would likely confuse a child. Needs significant development.",
      1: "Very difficult to follow. Explanations are incoherent, contradictory, or completely inappropriate for the age group. Fundamental communication gap.",
    },
  },
  patience_warmth: {
    name: "Patience & Warmth",
    description:
      "Demonstrates patience and creates a welcoming, supportive atmosphere suitable for children who may be struggling or frustrated",
    weight: "critical",
    criteria: {
      5: "Exceptionally warm and patient. Describes scenarios where they prioritize the child's emotional state before the academic content. Uses language that would make any child feel safe. Shows instinctive empathy.",
      4: "Warm and patient overall. Gives good examples of supportive behavior. Minor gaps, such as jumping to solutions before acknowledging the child's feelings.",
      3: "Adequate warmth. Says the right things about patience but examples lack emotional depth. Might describe what they would teach rather than how they would make the child feel.",
      2: "Comes across as impatient, task-focused, or clinical. Describes teaching as content delivery without much awareness of the child's emotional experience.",
      1: "Dismissive of student frustration, blames the student for not understanding, or describes approaches that would likely make a struggling child feel worse.",
    },
  },
  simplification_ability: {
    name: "Simplification Ability",
    description:
      "Can break down complex math concepts into simple, relatable, child-friendly explanations using analogies and concrete examples",
    weight: "high",
    criteria: {
      5: "Brilliant at simplification. Spontaneously uses relatable analogies from a child's world like pizza slices, sharing toys, or stacking blocks. Adjusts complexity to the child's age without being prompted.",
      4: "Good simplification skills. Uses analogies or concrete examples but might need a prompt to think of them. Explanations would work for most children.",
      3: "Can simplify when asked but defaults to somewhat abstract or textbook-style explanations. Analogies are present but not always relatable to children.",
      2: "Struggles to move beyond formal definitions. Explanations would likely go over a child's head. Uses adult vocabulary or mathematical notation when describing what they would say.",
      1: "Cannot simplify. Gives the textbook definition and cannot reframe it. Would not be able to make concepts accessible to children.",
    },
  },
  english_fluency: {
    name: "English Fluency",
    description:
      "Sufficient command of English to teach effectively. Note: this is a voice interview so judge fluency based on substance and comprehensibility, not accent or minor grammatical errors",
    weight: "medium",
    criteria: {
      5: "Excellent fluency. Expresses ideas naturally and confidently. Rich vocabulary used appropriately. Easy to understand throughout.",
      4: "Good fluency. Occasional minor grammatical errors or word-finding pauses that do not impede understanding at all. Fully capable of teaching in English.",
      3: "Adequate fluency. Some grammatical issues or limited vocabulary but the candidate can express their ideas and a student would understand them. Workable with some development.",
      2: "Limited fluency. Frequent errors that sometimes obscure meaning. A child might struggle to follow extended explanations. Needs significant improvement.",
      1: "Very limited English. Cannot express teaching concepts clearly enough to be understood. Would not be able to teach effectively in English at this time.",
    },
  },
  teaching_enthusiasm: {
    name: "Teaching Enthusiasm",
    description:
      "Genuine passion and intrinsic motivation for teaching math to children, not just treating it as a job",
    weight: "medium",
    criteria: {
      5: "Infectious enthusiasm. Lights up when talking about teaching moments. Shares specific stories that reveal deep personal investment. Teaching is clearly a calling, not just a job.",
      4: "Genuinely enthusiastic. Shows real interest in children's learning. Has positive things to say about teaching but may not be as animated or specific.",
      3: "Moderate enthusiasm. Seems interested but answers about motivation feel generic or rehearsed. Would probably do a fine job but does not convey passion.",
      2: "Low enthusiasm. Gives flat or transactional answers about why they want to teach. Motivation seems primarily financial or convenience-based.",
      1: "No apparent interest in teaching or working with children. Gives the impression they would rather be doing something else.",
    },
  },
};

const ASSESSMENT_SYSTEM_PROMPT_TEMPLATE = `You are an expert interviewer assessment system for Cuemath, a math tutoring company that provides online tutoring to children aged 6 to 16.

You will receive the full transcript of a voice screening interview with a tutor candidate. Your task is to evaluate the candidate across five dimensions using the rubric provided, then produce a structured JSON assessment.

Important context about this interview format:
This was a live voice interview conducted over a video call. The transcript was generated from speech-to-text, so expect minor transcription artifacts such as filler words like um and uh, incomplete sentences, and occasional mistranscriptions. Do not penalize candidates for these speech artifacts. Focus on the substance and intent of what they said, not surface-level disfluencies.

Assessment principles:
Be fair, evidence-based, and specific. Quote or paraphrase the candidate's actual words as evidence for each score.

Account for interview nervousness. Many candidates are nervous at the start and warm up over time. Give more weight to their best moments than their worst. If a candidate starts hesitantly but improves significantly, note that positively.

Recognize that communication styles vary across cultures. Some candidates may be more reserved or indirect without being less capable. Evaluate the quality of their ideas and teaching instincts, not just their verbal polish.

Consider the overall trajectory of the interview. Did the candidate become more comfortable and articulate as the conversation progressed? A candidate who warms up and finishes strong is different from one who starts strong and fades.

Evaluate what the candidate actually demonstrated, not what they failed to mention. A candidate might have excellent teaching instincts without using educational jargon.

Rubric dimensions and scoring criteria:
{{RUBRIC_TEXT}}

Scoring calibration guidance:
A score of 5 does not mean perfection. It means the candidate clearly demonstrated strong ability in that dimension and would be effective from day one with minimal coaching. Example: for simplification ability, a 5 might be someone who spontaneously used a pizza analogy to explain fractions and then checked for understanding.

A score of 3 is a genuinely average, acceptable candidate. They show competence but have clear room for growth. Example: for patience and warmth, a 3 might be someone who said the right things about being patient but did not demonstrate much emotional awareness in their examples.

A score of 1 means a fundamental concern that coaching is unlikely to address quickly. Reserve this for clear red flags, not just mediocre answers.

Most candidates should score between 2 and 4. Use the full range but be thoughtful. Avoid clustering all scores at 3.

Recommendation guidelines:
The recommendation should be a holistic judgment, not a mechanical formula based on the overall score alone. Consider these factors:
A candidate with a 3.5 average but a 5 in patience and warmth might still be a yes because warmth is hard to train and especially important for tutoring children.
A candidate with a 4.0 average but a 2 in patience and warmth might be a no because that gap is concerning for a children's tutoring role.
strong_yes means you would enthusiastically recommend hiring this person. They showed multiple standout qualities.
yes means a solid candidate who meets the bar across all dimensions.
maybe means mixed signals. Passable in most areas but at least one notable concern.
no means multiple weak areas or one critical gap that is fundamental to the role.
strong_no means fundamentally unsuitable. Clear red flags or complete inability to demonstrate basic teaching aptitude.

Return your assessment as a JSON object with this exact structure:
{
    "overall_score": <1-5 integer>,
    "recommendation": "<one of: strong_yes, yes, maybe, no, strong_no>",
    "summary": "<3-4 sentence overall assessment that captures strengths, weaknesses, and trajectory during the interview>",
    "dimensions": [
        {
            "dimension": "<dimension key>",
            "score": <1-5 integer>,
            "evidence": "<direct quote or close paraphrase from the transcript>",
            "notes": "<brief evaluator notes including any trajectory observations>"
        }
    ]
}

Return ONLY the JSON object, no other text.`;

const VALID_RECOMMENDATIONS = [
  "strong_yes",
  "yes",
  "maybe",
  "no",
  "strong_no",
] as const;

function buildRubricText(): string {
  const lines: string[] = [];
  for (const [key, dim] of Object.entries(RUBRIC)) {
    lines.push(`\n## ${dim.name} (${key}) [weight: ${dim.weight}]`);
    lines.push(dim.description);
    const scores = Object.keys(dim.criteria)
      .map(Number)
      .sort((a, b) => b - a);
    for (const score of scores) {
      lines.push(`  ${score}: ${dim.criteria[score]}`);
    }
  }
  return lines.join("\n");
}

export function formatTranscript(items: TranscriptItem[]): string {
  return items
    .map((item) => {
      const speaker = item.role === "agent" ? "Interviewer" : "Candidate";
      return `${speaker}: ${item.content}`;
    })
    .join("\n\n");
}

export async function generateAssessment(
  transcript: string,
): Promise<GeneratedAssessment> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return errorAssessment("Missing OpenAI API key");
  }

  const systemPrompt = ASSESSMENT_SYSTEM_PROMPT_TEMPLATE.replace(
    "{{RUBRIC_TEXT}}",
    buildRubricText(),
  );

  const payload = {
    model: env.ASSESSMENT_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here is the full interview transcript:\n\n${transcript}\n\nPlease provide your assessment as JSON.`,
      },
    ],
    temperature: 0.3,
  };

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("OpenAI API error:", resp.status, text.slice(0, 200));
      return errorAssessment(`OpenAI API returned ${resp.status}`);
    }

    const data = (await resp.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = data.choices[0]?.message.content;
    if (!content) {
      return errorAssessment("Empty response from OpenAI");
    }

    const raw = JSON.parse(content) as {
      overall_score?: number;
      recommendation?: string;
      summary?: string;
      dimensions?: AssessmentDimension[];
    };

    const overallScore = clampScore(raw.overall_score);
    const recommendation = VALID_RECOMMENDATIONS.includes(
      raw.recommendation as (typeof VALID_RECOMMENDATIONS)[number],
    )
      ? (raw.recommendation as (typeof VALID_RECOMMENDATIONS)[number])
      : "maybe";

    return {
      overallScore,
      recommendation,
      summary: raw.summary ?? "No summary provided.",
      dimensions: Array.isArray(raw.dimensions) ? raw.dimensions : [],
    };
  } catch (err) {
    console.error("Unexpected error generating assessment:", err);
    return errorAssessment(err instanceof Error ? err.message : String(err));
  }
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, Math.round(n)));
}

function errorAssessment(reason: string): GeneratedAssessment {
  return {
    overallScore: 0,
    recommendation: "maybe",
    summary: `Assessment could not be generated: ${reason}`,
    dimensions: [],
  };
}
