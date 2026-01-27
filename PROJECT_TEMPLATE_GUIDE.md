# Digital Friend Project Template Guide

## Project Structure
```
project-folder/
├── api/
│   └── ai-hint.js       # Vercel serverless function (AI logic)
├── index.html           # Exercise page with DF button
├── server.js            # Local development server
├── package.json         # Dependencies
├── vercel.json          # Vercel configuration
├── .env                 # API key (local only, NOT in git)
├── .gitignore           # Excludes .env and node_modules
└── README.md            # Project documentation
```

## Key Components

### 1. AI Prompt (in api/ai-hint.js and server.js)
The prompt should include:
- **CRITICAL INSTRUCTIONS**: Hebrew only, practical hints, no quotes around equations, gender-neutral
- **The Exercise**: Full problem statement
- **Complete Solutions**: For AI reference (never reveal fully)
- **Step-specific Hints**: Progressive hints in Hebrew for each step
- **Common Errors**: What mistakes to look for
- **Response Format**: How to respond to correct/incorrect answers

### 2. Environment Variables
- **Local**: `.env` file with `GOOGLE_API_KEY=your-key`
- **Vercel**: Add in Dashboard → Settings → Environment Variables

### 3. CORS Settings (in api/ai-hint.js)
```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://shir-openu.github.io'
];
```

### 4. Model
Currently using: `gemini-2.5-flash`

## Deployment Steps

### GitHub
1. Create new repo at github.com/new (empty, no README)
2. Initialize and push:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/shir-openu/PROJECT_NAME.git
git branch -M main
git push -u origin main
```
3. Enable GitHub Pages: Settings → Pages → Branch: main, Folder: / (root)

### Vercel
1. Go to vercel.com, sign in with GitHub
2. Import the repository
3. Add environment variable: `GOOGLE_API_KEY`
4. Deploy
5. **IMPORTANT**: Settings → Deployment Protection → Disable Vercel Authentication

## Important Lessons Learned

1. **API Endpoint in index.html**: Must point to Vercel URL
   ```javascript
   const API_ENDPOINT = 'https://PROJECT_NAME.vercel.app/api/ai-hint';
   ```

2. **Icon**: Using 🧐 (monocle) instead of 🤔 (thinking)

3. **No Quotes**: AI instructed not to put quotes around equations

4. **Hints Should Be Specific**: Include actual Hebrew mathematical hints, not generic guidance

5. **Git Identity**: May need to set per-repo:
   ```bash
   git config user.email "shir-openu@users.noreply.github.com"
   git config user.name "shir-openu"
   ```

## What Changes Per Exercise

| Component | What to Change |
|-----------|----------------|
| index.html | Exercise content, step structure, input fields |
| api/ai-hint.js | Problem description, solutions, step-specific hints |
| server.js | Same as api/ai-hint.js (for local dev) |
| API_ENDPOINT | Project-specific Vercel URL |
| package.json | Project name |
| README.md | Project description |

## Testing Checklist
- [ ] Local server works (npm start)
- [ ] Vercel deployment successful
- [ ] Vercel Authentication disabled
- [ ] GitHub Pages enabled
- [ ] DF button responds with Hebrew hints
- [ ] Hints are practical and step-specific
- [ ] No quotes around equations
