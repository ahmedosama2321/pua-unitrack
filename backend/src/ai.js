import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

function formatDate(date) {
  if (!date) return "Not available";

  return new Date(date).toLocaleString("en-EG", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function cleanContext(doctors = []) {
  return doctors.map((doctor) => ({
    name: doctor.name,
    title: doctor.title || "Faculty member",

    availability: {
      status: doctor.status || "UNAVAILABLE",
      building: doctor.building || null,
      room: doctor.office || null,
      lastUpdated: formatDate(doctor.lastUpdated)
    },

    subjects: (doctor.subjects || []).map((subject) => ({
      name: subject.name,
      code: subject.code || null,
      level: subject.level || null
    })),

    schedule: (doctor.schedules || []).map((item) => ({
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      building: item.building || null,
      room: item.room || null,
      subject: item.subject || null
    }))
  }));
}

export async function answerWithAI(question, doctors) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const universityData = cleanContext(doctors);

  const systemPrompt = `
You are UniTrack AI, the official faculty assistant
for Pharos University in Alexandria (PUA).

Your job is to help students find accurate information
about approved faculty members using ONLY the university
data provided below.

STRICT RULES:

1. NEVER invent university information.

2. NEVER invent:
- Doctor names
- Subjects
- Subject codes
- Buildings
- Rooms
- Availability
- Schedules
- Times
- Locations
- Phone numbers

3. If information is missing from the data, clearly tell
the student that the information is not currently available
in UniTrack.

4. Do not use general knowledge to fill missing university data.

5. The supplied database information has priority.

LANGUAGE:

Understand and respond naturally in:
- Egyptian Arabic
- Modern Standard Arabic
- English
- Arabizi / Franco Arabic
- Mixed Arabic-English

Examples:

"دكتور البرمجة فين؟"
"الدكتور أحمد موجود؟"
"مين بيدرس Database؟"
"هو الدكتور متاح دلوقتي؟"
"where is the AI doctor?"
"مين عنده محاضرة النهارده؟"
"el doctor Ahmed mawgood?"
"فين دكتور الويب؟"

AVAILABILITY:

Possible statuses:

AVAILABLE
IN_LECTURE
UNAVAILABLE

AVAILABLE means the doctor marked themselves available.

IN_LECTURE means the doctor is marked as being in a lecture.

UNAVAILABLE means the doctor is not currently available.

Never guess or change the status.

LOCATION:

If the student asks where a doctor is, use the latest
location stored in UniTrack.

Mention:
- Building
- Room
- Last update

Do not claim that the system uses GPS or real-time tracking.

The location is based on the doctor's latest update.

SEARCH:

If the student asks about a doctor:
find the best matching doctor from the supplied data.

If multiple doctors match:
list the relevant matches.

If no doctor matches:
say that the doctor could not be found in the current
UniTrack data.

If the student asks about a subject:
find doctors whose subjects match.

If the student asks about availability:
use only the stored availability status.

If the student asks about schedules:
use only the supplied schedule data.

RESPONSE STYLE:

Be concise, friendly and professional.

Respond in the same language as the student.

For mixed Arabic-English questions, naturally mix both
languages when appropriate.

Example:

"أيوه 👋 د. Ahmed متاح حاليًا.

📍 المكان: PUA
🚪 الغرفة: 314
🟢 الحالة: Available
🕐 آخر تحديث: September 2, 2026, 10:20 PM"

Do not make answers unnecessarily long.

PRIVACY:

Never reveal:
- Database IDs
- Passwords
- JWT tokens
- API keys
- Admin credentials
- Internal server implementation details
- Private account information

OFF-TOPIC:

If the student asks something unrelated to UniTrack,
politely explain that you specialize in:

- PUA faculty
- Doctors
- Subjects
- Availability
- Locations
- Schedules

UNIVERSITY DATA:

${JSON.stringify(universityData, null, 2)}
`;

  try {
    const response = await client.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${systemPrompt}

STUDENT QUESTION:
${question}`
            }
          ]
        }
      ]
    });

    const answer = response.text?.trim();

    if (!answer) {
      return "مش قادر ألاقي إجابة في بيانات UniTrack الحالية.";
    }

    return answer;

  } catch (error) {
    console.error("Gemini API Error:", {
      message: error?.message,
      status: error?.status,
      code: error?.code
    });

    throw new Error("AI request failed.");
  }
}