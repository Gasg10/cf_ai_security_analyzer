# 🛡️ AI Security Vulnerability Scanner

**AI-Powered Web Application Security Analysis using Cloudflare Workers AI and Llama 3.3**

A production-ready security scanner that analyzes URLs for common web vulnerabilities and provides intelligent, AI-powered security recommendations. Built entirely on Cloudflare's edge computing infrastructure.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-success)](https://cf-ai-security-analyzer.goncalogoncalves2006.workers.dev)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)
[![AI Model](https://img.shields.io/badge/AI-Llama%203.3%2070B-blue)](https://ai.cloudflare.com/)

**Live Demo:** https://cf-ai-security-analyzer.goncalogoncalves2006.workers.dev

---

## 🎯 What This Application Does

This is an AI-powered security scanner that analyzes web application URLs for common vulnerabilities and provides intelligent recommendations using Llama 3.3 70B. It combines pattern matching with natural language AI to deliver professional security assessments.

**Key Features:**

* 🔍 **Automated Vulnerability Detection** - Scans for SQL injection, XSS, insecure protocols, and more
* 🤖 **AI-Powered Analysis** - Llama 3.3 70B provides detailed security insights
* 💬 **Interactive Security Assistant** - Ask questions about findings in natural language
* 📊 **Risk Scoring System** - Automatic calculation of overall security risk
* 🎨 **Modern UI** - Clean, responsive interface with real-time updates
* 💾 **Persistent Sessions** - Durable Objects maintain scan history and chat context
* ⚡ **Edge Computing** - Deployed globally on Cloudflare's network

---

## 🚀 Live Demo

Try it now: **https://cf-ai-security-analyzer.goncalogoncalves2006.workers.dev**

### Example URLs to Test:

1. **High Risk:** `http://example.com/admin/login.php?id=123`
   - Expected: Multiple HIGH severity findings

2. **Medium Risk:** `https://secure-site.com/user=admin`
   - Expected: Parameter injection warnings

3. **Path Traversal:** `http://vulnerable.com/page?file=../../etc/passwd`
   - Expected: Critical path traversal detection

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
* Single-page application (HTML/CSS/JavaScript)
* Responsive design with modern CSS Grid
* Real-time updates via Fetch API

**Backend:**
* Cloudflare Workers (Serverless edge computing)
* TypeScript for type-safe development
* Workers AI with Llama 3.3 70B model

**State Management:**
* Durable Objects for persistent storage
* Session-based data isolation
* In-memory caching for performance

### System Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloudflare Edge │ ──► Main Worker
└────────┬────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
┌─────────────┐   ┌───────────────┐  ┌──────────────┐
│   Durable   │   │  Workers AI   │  │  Durable     │
│   Object    │   │  (Llama 3.3)  │  │  Object      │
│(ScanSession)│   │               │  │  (Storage)   │
└─────────────┘   └───────────────┘  └──────────────┘
```

---

## 🤖 Cloudflare Workers AI Requirements

This project fulfills **ALL** Cloudflare Workers AI application requirements:

### ✅ 1. LLM Integration

**Model:** `@cf/meta/llama-3.3-70b-instruct-fp8-fast`

**Usage:**
* Security vulnerability analysis
* Natural language security recommendations
* Interactive chat assistant
* Context-aware responses

**Implementation:**
```typescript
const aiResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  max_tokens: 1000,
  temperature: 0.7
});
```

### ✅ 2. Workflow Coordination

**Durable Objects:**
* **ScanSession** - Manages scan results and chat history
* Persistent storage using Durable Object storage
* Session-based isolation for multiple users

**Workflow:**
```
URL Input → Pattern Detection → AI Analysis → Risk Scoring → Results Display
                                       ↓
                              Durable Object Storage
                                       ↓
                              Chat Assistant Context
```

### ✅ 3. User Input

**Multiple Input Methods:**
* URL input field for security scans
* Interactive chat interface for questions
* Example URLs for quick testing
* Real-time form validation

**Chat Features:**
* Natural language queries
* Context-aware responses
* Conversation history
* Security-focused assistance

### ✅ 4. Memory & State

**Persistent Storage:**
* Up to 50 scans per session
* Last 20 chat messages retained
* Risk scores and vulnerability details
* Timestamps for all activities

**Session Management:**
* UUID-based session identification
* Durable Object storage for persistence
* Cross-request state continuity
* Chat history for context

---

## 🔍 Security Detection Capabilities

### Vulnerability Types Detected

1. **Insecure Protocol (HIGH)**
   * Detection: HTTP instead of HTTPS
   * Risk: Data exposure in transit
   * Recommendation: Always use HTTPS

2. **Server-Side Script Exposure (MEDIUM)**
   * Detection: .php, .asp, .jsp extensions
   * Risk: Potential injection vulnerabilities
   * Recommendation: Input validation and sanitization

3. **Sensitive Endpoint Detection (MEDIUM)**
   * Detection: Admin, login, dashboard paths
   * Risk: Unauthorized access
   * Recommendation: Rate limiting, 2FA, strong auth

4. **Parameter Injection (HIGH)**
   * Detection: URL parameters (id=, user=, file=, page=)
   * Risk: SQL injection, LFI, path traversal
   * Recommendation: Parameterized queries, input validation

### AI Analysis Features

* Detailed vulnerability explanations
* Professional security recommendations
* Plain-language communication
* Contextual follow-up suggestions
* Best practice guidance

---

## 📋 Quick Start

### Prerequisites

* Node.js 18+ and npm installed
* Free Cloudflare account ([sign up here](https://dash.cloudflare.com/sign-up))
* Wrangler CLI: `npm install -g wrangler`

### Installation

```bash
git clone https://github.com/Gasg10/cf_ai_security_analyzer.git
cd cf_ai_security_analyzer
npm install
```

### Development

```bash
wrangler login
npm run dev
```

Open `http://localhost:8787` in your browser.

### Deployment

```bash
npm run deploy
```

Your app will be deployed to `https://cf-ai-security-analyzer.<your-subdomain>.workers.dev`

---

## 📊 API Documentation

### POST /api/session/init

Initialize a new security scan session.

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### POST /api/scan

Perform security scan on a URL.

**Request:**
```json
{
  "url": "http://example.com/login.php?id=123",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "url": "http://example.com/login.php?id=123",
  "vulnerabilities": [
    {
      "type": "Insecure Protocol",
      "severity": "HIGH",
      "description": "Using HTTP instead of HTTPS exposes data in transit",
      "recommendation": "Always use HTTPS for secure communication"
    }
  ],
  "aiAnalysis": "The main security concern with this URL...",
  "riskScore": 14,
  "riskLevel": "HIGH",
  "scannedAt": "2025-12-31T17:00:00.000Z"
}
```

### POST /api/chat

Send message to AI security assistant.

**Request:**
```json
{
  "message": "What vulnerabilities did you find?",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "response": "I found several security vulnerabilities in your recent scan..."
}
```

---

## 💡 Example Usage

### Security Scan

1. Visit the live demo
2. Click on an example URL or enter your own
3. Click "Start Security Scan"
4. Wait 2-5 seconds for AI analysis
5. Review vulnerabilities and recommendations

### Chat Interaction

**User:** "What vulnerabilities did you find?"

**AI Response:**
```
I found 2 security vulnerabilities in your most recent scan:

1. Sensitive Endpoint Detected (MEDIUM) - This appears to be an 
   admin or login page that requires extra security measures.

2. Potential Parameter Injection (HIGH) - The 'user' parameter 
   may be vulnerable to SQL injection attacks.

Would you like me to explain how to fix any of these issues?
```

---

## 🎨 Features in Detail

### Risk Scoring System

**Severity Points:**
* CRITICAL: 10 points
* HIGH: 7 points
* MEDIUM: 4 points
* LOW: 2 points

**Risk Levels:**
* CRITICAL: Score ≥ 20
* HIGH: Score 10-19
* MEDIUM: Score 5-9
* LOW: Score < 5

### UI Components

**Security Scan Panel:**
* URL input with validation
* Example URL suggestions
* Loading indicator
* Results with color-coded risk badges
* Vulnerability details
* AI analysis section

**Chat Assistant Panel:**
* Scrollable message history
* User/Assistant message differentiation
* Real-time message updates
* Keyboard shortcuts (Enter to send)

---

## 🔧 Configuration

### Environment Variables

No environment variables needed! All configuration is done via Cloudflare bindings.

### wrangler.toml Configuration

```toml
name = "cf-ai-security-analyzer"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[ai]
binding = "AI"

[[durable_objects.bindings]]
name = "SCAN_SESSION"
class_name = "ScanSession"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["ScanSession"]
```

---

## 📊 Technical Details

### Performance

* **Cold Start:** < 50ms (Durable Objects)
* **Average Scan Time:** 2-4 seconds (including AI analysis)
* **Chat Response Time:** 1-3 seconds
* **Global Edge Deployment:** 300+ locations worldwide

### Scalability

* **Concurrent Users:** Unlimited (Cloudflare Workers auto-scaling)
* **Storage:** Durable Objects provide persistent, distributed storage
* **AI Requests:** Subject to Workers AI limits (generous free tier)

### Security

* **No API Keys in Code:** All AI access via Cloudflare bindings
* **CORS Enabled:** For cross-origin requests
* **Session Isolation:** UUID-based session separation
* **Input Validation:** All user inputs sanitized

---

## 🧪 Testing

### Manual Testing

Visit: https://cf-ai-security-analyzer.goncalogoncalves2006.workers.dev

**Test Cases:**

1. **High Risk URL:**
   ```
   http://admin.example.com/login.php?id=1
   ```
   Expected: Multiple HIGH severity findings

2. **Secure URL:**
   ```
   https://example.com/about
   ```
   Expected: LOW or no vulnerabilities

3. **Chat Test:**
   ```
   User: "How do I fix the SQL injection?"
   Expected: Detailed explanation with steps
   ```

---

## 📚 Project Structure

```
cf_ai_security_analyzer/
├── src/
│   └── index.ts              # Main Worker with embedded HTML
├── package.json              # Dependencies and scripts
├── wrangler.toml             # Cloudflare Workers configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # This file
└── PROMPTS.md                # AI prompts documentation
```

---

## 🎓 Learning Outcomes

This project demonstrates:

* ✅ Workers AI integration with Llama 3.3
* ✅ Durable Objects for state management
* ✅ TypeScript development for Workers
* ✅ Security vulnerability detection
* ✅ Natural language AI interfaces
* ✅ Modern web UI development
* ✅ Serverless architecture patterns
* ✅ Edge computing best practices

---

## 🚀 Deployment

### Using Wrangler CLI

```bash
npm run deploy
```

### Using GitHub Actions

Add `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## 🛠️ Troubleshooting

### Issue: AI responses are empty

**Solution:** Verify Workers AI is enabled in your Cloudflare account. Check free tier limits.

### Issue: Session not persisting

**Solution:** Ensure Durable Objects are properly configured in `wrangler.toml`.

### Issue: CORS errors

**Solution:** Check that CORS headers are properly set in all API responses.

---

## 📖 Additional Resources

* **PROMPTS.md** - Complete AI prompt documentation
* [Cloudflare Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
* [Durable Objects Guide](https://developers.cloudflare.com/durable-objects/)
* [Llama 3.3 Model Info](https://developers.cloudflare.com/workers-ai/models/llama-3-3-70b-instruct-fp8-fast/)

---

## 📝 License

MIT License - Free to use for learning and portfolio purposes.

---

## 👤 Author

**Gonçalo Gonçalves**
* Computer Engineering Student at Universidade Lusófona
* IBM Z Student Ambassador
* Cybersecurity Enthusiast
* Email: goncalogoncalves2006@gmail.com
* LinkedIn: [linkedin.com/in/goncalo-goncalves-308980317](https://www.linkedin.com/in/goncalo-goncalves-308980317)
* GitHub: [github.com/Gasg10](https://github.com/Gasg10)

---

## 🙏 Acknowledgments

* Built with Cloudflare Workers AI
* Powered by Llama 3.3 70B
* Uses Durable Objects for state management
* Inspired by modern cybersecurity tools

---

## 📈 Project Stats

* **Total Code:** ~500 lines of TypeScript
* **AI Model:** Llama 3.3 70B Instruct FP8 Fast
* **Deployment Time:** ~30 seconds
* **Global Availability:** 300+ edge locations
* **Vulnerability Types:** 4 detection patterns
* **AI Features:** 2 (analysis + chat)

---

**Built entirely on Cloudflare's edge infrastructure** 🚀

**Deployed in 300+ locations worldwide** 🌍

**AI-powered security analysis at the edge** 🤖

---

## 🔗 Links

* **Live Demo:** https://cf-ai-security-analyzer.goncalogoncalves2006.workers.dev
* **GitHub:** https://github.com/Gasg10/cf_ai_security_analyzer
* **Cloudflare Dashboard:** https://dash.cloudflare.com

---

*Created as part of the Cloudflare Summer Internship 2026 application*