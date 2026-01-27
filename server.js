// Simple local development server
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MAX_ATTEMPTS = 10;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper function to call OpenRouter API
async function callOpenRouter(prompt) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper function to call Google Gemini API
async function callGemini(prompt) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// AI Handler function
async function handleAIRequest(body) {
  const { userInput, currentStep, problemData, conversationHistory } = body;

  // Check attempt limit
  if (conversationHistory && conversationHistory.length >= MAX_ATTEMPTS) {
    return {
      hint: `הסתיימה מכסת ${MAX_ATTEMPTS} ניסיונות. להלן הפתרון המלא:\n\n` + problemData.fullSolution
    };
  }

  // Determine which AI provider to use
  const aiProvider = process.env.AI_PROVIDER || 'google';

  // Build conversation history text
  let conversationText = '';
  if (conversationHistory && conversationHistory.length > 0) {
    conversationHistory.forEach(turn => {
      conversationText += `תשובת סטודנט: ${turn.user}\nתגובת מורה: ${turn.ai}\n\n`;
    });
  }

  const prompt = `
# CRITICAL INSTRUCTIONS
1. Respond in HEBREW only
2. Be PRACTICAL and SPECIFIC - give concrete mathematical guidance
3. Keep responses 2-4 sentences
4. Use gender-neutral language (plural forms)
5. NEVER give the complete final answer until ${MAX_ATTEMPTS} attempts exhausted
6. NEVER repeat the same hint - check conversation history and progress
7. NEVER put quotes around equations - write them directly without '' or "" marks
8. ACCEPT ANY MATHEMATICALLY EQUIVALENT FORM of the correct answer

---

# The Exercise: 2×2 ODE System with Complex Eigenvalues

## The Problem:
x' = Ax, x(0) = [1, 0]^T
A = [3, -2; 4, -1]

Find the solution without using complex numbers.

## COMPLETE SOLUTIONS (your reference):

**Step 1 - Find Eigenvalues:**
- Characteristic polynomial: |λI - A| = (λ-3)(λ+1) - (-2)(4) = λ² - 2λ + 5
- Using quadratic formula: λ = (2 ± √(4-20))/2 = (2 ± √(-16))/2 = (2 ± 4i)/2
- ANSWER: λ = 1 ± 2i (α = 1, β = 2)

**Step 2 - Find Eigenvector for λ = 1 + 2i:**
- (λI - A)v = 0
- [(-2+2i), 2; -4, (2+2i)][v₁; v₂] = 0
- From first equation: (-2+2i)v₁ + 2v₂ = 0
- v₂ = (2-2i)v₁/2 = (1-i)v₁
- Choose v₁ = 1: ANSWER: v = [1, 1-i]^T

**Step 3 - General Solution:**
- Complex solution: e^{(1+2i)t}v = e^t·e^{2it}[1; 1-i]
- Using Euler: e^{2it} = cos2t + i·sin2t
- Real part: x₁(t) = e^t[cos2t; cos2t + sin2t]
- Imaginary part: x₂(t) = e^t[sin2t; sin2t - cos2t]
- ANSWER: x(t) = C₁e^t[cos2t; cos2t+sin2t] + C₂e^t[sin2t; sin2t-cos2t]

**Step 4 - Apply Initial Conditions x(0) = [1, 0]^T:**
- At t=0: [1; 0] = C₁[1; 1] + C₂[0; -1]
- From first component: C₁ = 1
- From second component: C₁ - C₂ = 0 → C₂ = 1
- ANSWER: C₁ = 1, C₂ = 1
- FINAL: x(t) = e^t(cos2t + sin2t), y(t) = 2e^t·sin2t

---

## Current Step: ${currentStep}
## Expected Answer: ${problemData.correctAnswer}
## Student Input: ${userInput}

${conversationText ? `## Previous Conversation:\n${conversationText}` : ''}

---

# SPECIFIC HINTS BY STEP (give progressively):

## If Step 1 (eigenvalues):
- Hint 1: "חשבו את הפולינום האופייני |λI - A| = 0. הדטרמיננטה היא (λ-3)(λ+1) - (-2)(4)."
- Hint 2: "הפולינום הוא λ² - 2λ + 5 = 0. השתמשו בנוסחה הריבועית."
- Hint 3: "הדיסקרימיננטה היא 4 - 20 = -16, שלילית! לכן הפתרונות מרוכבים."
- Hint 4: "λ = (2 ± √(-16))/2 = (2 ± 4i)/2 = 1 ± 2i. המספר הממשי הוא α=1, המדומה β=2."

## If Step 2 (eigenvector):
- Hint 1: "הציבו λ = 1+2i במטריצה (λI - A) ופתרו את המערכת (λI - A)v = 0."
- Hint 2: "המשוואה הראשונה היא (-2+2i)v₁ + 2v₂ = 0. בחרו v₁ = 1 ומצאו את v₂."
- Hint 3: "מהמשוואה: v₂ = -(−2+2i)/2 = (2-2i)/2 = 1-i"
- Hint 4: "הוקטור העצמי הוא v = [1, 1-i]^T"

## If Step 3 (general solution):
- Hint 1: "השתמשו בנוסחת אוילר: e^{iθ} = cosθ + i·sinθ"
- Hint 2: "הפתרון המרוכב הוא e^{(1+2i)t}[1; 1-i] = e^t(cos2t + i·sin2t)[1; 1-i]"
- Hint 3: "פתחו את המכפלה והפרידו לחלק ממשי ומדומה."
- Hint 4: "החלק הממשי נותן פתרון אחד, החלק המדומה נותן פתרון שני."

## If Step 4 (initial conditions):
- Hint 1: "הציבו t=0 בפתרון הכללי. זכרו: cos0=1, sin0=0"
- Hint 2: "תקבלו [1; 0] = C₁[1; 1] + C₂[0; -1]"
- Hint 3: "מהרכיב הראשון: C₁ = 1. מהרכיב השני: C₁ - C₂ = 0"
- Hint 4: "לכן C₂ = C₁ = 1"

# COMMON ERRORS TO CHECK:
- Wrong sign in characteristic polynomial
- Confusion between real and imaginary parts of eigenvector
- Forgetting to use Euler's formula correctly
- Mixing up C₁ and C₂ in initial conditions
- Wrong sign when splitting complex solution

# YOUR RESPONSE:
1. If CORRECT: "נכון! [brief confirmation]" and encourage next step
2. If INCORRECT: Identify the specific error and give the appropriate hint from above
3. If student asks for help/hint: Give the next hint in progression
4. After 3+ attempts: Give more explicit guidance, show intermediate steps
`;

  // Call the appropriate AI provider
  let hint;
  if (aiProvider === 'openrouter') {
    hint = await callOpenRouter(prompt);
  } else {
    // Default to Google Gemini
    hint = await callGemini(prompt);
  }

  return { hint, provider: aiProvider };
}

// Create server
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API endpoint
  if (req.url === '/api/ai-hint' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const result = await handleAIRequest(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error('AI API Error:', error);
        const aiProvider = process.env.AI_PROVIDER || 'google';
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'שגיאה בעיבוד הבקשה. נסו שוב.',
          provider: aiProvider,
          details: error.message
        }));
      }
    });
    return;
  }

  // Static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  const aiProvider = process.env.AI_PROVIDER || 'google';
  const providerName = aiProvider === 'openrouter' ? 'OpenRouter GPT-4o-mini' : 'Google Gemini 2.5 Flash';

  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`\n🤖 AI Provider: ${providerName}`);
  console.log(`\n📝 Open this URL in your browser to test the exercise`);
  console.log(`\n🧐 Click "Digital Friend" to test the AI assistant`);
  console.log(`\n   Press Ctrl+C to stop the server\n`);
});
