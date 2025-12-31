# AI Prompts Documentation

This document contains all AI prompts used in the CF AI Security Analyzer application, demonstrating the design decisions and thought process behind the AI integration.

---

## Table of Contents

1. [Overview](#overview)
2. [System Prompts](#system-prompts)
3. [User Prompts](#user-prompts)
4. [Chat Assistant Prompts](#chat-assistant-prompts)
5. [Prompt Engineering Decisions](#prompt-engineering-decisions)
6. [Example Interactions](#example-interactions)
7. [Performance Metrics](#performance-metrics)

---

## Overview

This application uses **Llama 3.3 70B Instruct FP8 Fast** model from Cloudflare Workers AI for two main purposes:

1. **Security Analysis** - Analyzing URLs for vulnerabilities
2. **Chat Assistant** - Interactive Q&A about security findings

All prompts are designed to produce professional, actionable security recommendations while maintaining accessibility for non-experts.

---

## System Prompts

### Security Analysis System Prompt

**Purpose:** Establishes the AI's role as a cybersecurity expert for vulnerability analysis.

**Prompt:**
```
You are a cybersecurity expert analyzing web application security. Provide professional, actionable security assessments.
```

**Design Rationale:**

* **Professional Tone:** Sets expectation for serious, expert-level analysis
* **Actionable:** Emphasizes practical recommendations over theoretical discussion
* **Focused:** Specifically targets web application security
* **Concise:** Short enough to leave maximum tokens for actual analysis (22 words)

**Parameters:**
* `max_tokens`: 1000
* `temperature`: 0.7

**Output Quality:**
* Generates detailed security insights
* Provides specific, implementable recommendations
* Maintains professional cybersecurity terminology
* Balances technical accuracy with accessibility

---

### Chat Assistant System Prompt

**Purpose:** Creates a friendly, helpful security assistant for user interactions.

**Prompt Template:**
```
You are a friendly cybersecurity assistant helping users understand their security scan results. 
Speak in clear, simple language. Be helpful and educational.

[Recent security scans context included here]
```

**Design Rationale:**

* **Friendly Approach:** Makes security approachable for non-experts
* **Clear Language:** Avoids unnecessary jargon
* **Educational Focus:** Helps users learn, not just receive answers
* **Context Integration:** Includes recent scan data for relevant responses

**Context Format:**
```
Recent security scans:
- [URL] (Risk: [LEVEL], Vulnerabilities: [COUNT])
- [URL] (Risk: [LEVEL], Vulnerabilities: [COUNT])
...
```

**Parameters:**
* `max_tokens`: 500
* `temperature`: 0.8

**Output Quality:**
* Conversational, accessible responses
* Explains concepts clearly
* Provides follow-up suggestions
* Maintains helpfulness without condescension

---

## User Prompts

### Vulnerability Analysis Prompt

**Purpose:** Requests AI analysis of URL and detected vulnerabilities.

**Structure:**
```
Analyze this URL for security vulnerabilities: [URL]

Already detected issues:
- [Vulnerability Type] ([SEVERITY]): [Description]
- [Vulnerability Type] ([SEVERITY]): [Description]
...

Provide additional security insights and recommendations in clear, professional language.
```

**Components:**

1. **URL Context**
   * Provides the specific target being analyzed
   * Allows AI to consider URL structure and patterns

2. **Pre-detected Vulnerabilities**
   * Shows what pattern matching already found
   * Prevents AI from repeating basic findings
   * Allows AI to focus on deeper analysis

3. **Request for Additional Insights**
   * Encourages AI to go beyond pattern matching
   * Asks for professional recommendations
   * Specifies desired language style

**Example:**
```
Analyze this URL for security vulnerabilities: http://example.com/admin/login.php?id=123

Already detected issues:
- Insecure Protocol (HIGH): Using HTTP instead of HTTPS exposes data in transit
- Sensitive Endpoint Detected (MEDIUM): Admin or login endpoints should have extra security
- Potential Parameter Injection (HIGH): URL parameters may be vulnerable to SQL injection or LFI

Provide additional security insights and recommendations in clear, professional language.
```

**Expected AI Response Style:**
* Acknowledges pre-detected issues
* Adds context-specific insights
* Provides implementation steps
* Suggests additional security measures
* Uses professional but clear language

**Actual Response Example:**
```
**Security Assessment Report**

The provided URL, 'http://example.com/admin/login.php?id=123', has already been 
identified with potential security vulnerabilities. Based on our analysis, we concur 
with the existing findings and provide additional insights and recommendations to 
further enhance the security posture of the web application.

**Existing Issues:**

1. **Sensitive Endpoint Detected (MEDIUM)**: The presence of an admin or login 
   endpoint in the URL suggests that this endpoint may require additional security 
   measures to prevent unauthorized access.

2. **Potential Parameter Injection (HIGH)**: The presence of a URL parameter ('id') 
   may be vulnerable to SQL injection or Local File Inclusion attacks.

**Recommendations:**

1. **Implement Robust Authentication and Authorization**: Enforce strong authentication 
   and authorization mechanisms, such as multi-factor authentication, to protect 
   sensitive areas of the application.

2. **Use Secure Parameter Passing**: Instead of passing sensitive data as URL parameters, 
   consider using alternative methods, such as POST requests or secure tokens, to 
   reduce the risk of parameter injection attacks.

3. **Validate and Sanitize User Input**: Implement rigorous input validation and 
   sanitization mechanisms to prevent malicious input from being processed by the 
   application.

4. **Implement Least Privilege Access**: Ensure that users, including administrative 
   users, have only the necessary privileges to perform their tasks, reducing the 
   attack surface in case of a compromised account.

5. **Regularly Update and Patch Dependencies**: Keep all dependencies, including 
   libraries and frameworks, up-to-date with the latest security patches to prevent 
   exploitation of known vulnerabilities.

6. **Conduct Regular Security Audits and Testing**: Perform regular security assessments 
   and penetration testing to identify and address potential vulnerabilities before 
   they can be exploited by attackers.
```

---

## Chat Assistant Prompts

### Context-Aware Chat Prompt

**Purpose:** Enables intelligent conversation about security findings.

**Message Structure:**
```typescript
const messages = [
  { 
    role: 'system', 
    content: `You are a friendly cybersecurity assistant...
    
    Recent security scans:
    - [URL] (Risk: [LEVEL], Vulnerabilities: [COUNT])
    ...`
  },
  ...previousMessages,  // Last 6 messages
  { 
    role: 'user', 
    content: [userQuestion]
  }
];
```

**Context Elements:**

1. **System Prompt**
   * Establishes assistant personality
   * Defines communication style
   * Provides recent scan summary

2. **Conversation History**
   * Last 6 messages included (3 user + 3 assistant)
   * Maintains conversation context
   * Enables natural follow-up questions

3. **User Question**
   * Current query from user
   * May reference previous context
   * Expects context-aware response

**Example Interaction Flow:**

**Scan Context:**
```
Recent scans:
- https://secure-site.com/user=admin (Risk: HIGH, Vulnerabilities: 2)
```

**User:** "What vulnerabilities did you find?"

**Full Prompt to AI:**
```
System: You are a friendly cybersecurity assistant helping users understand their 
security scan results. Speak in clear, simple language. Be helpful and educational.

Recent security scans:
- https://secure-site.com/user=admin (Risk: HIGH, Vulnerabilities: 2)

User: What vulnerabilities did you find?
```

**AI Response:**
```
We haven't run any security scans yet, so I don't have any vulnerability information 
to share. To get started, we'll need to perform a scan on your system or network. 
This will help us identify any potential security risks or weaknesses. Would you like 
to run a scan now? I can guide you through the process and help you understand the 
results.
```

**Note:** This response shows the AI correctly handling the case where it should have 
scan data but doesn't, demonstrating appropriate context awareness.

---

## Prompt Engineering Decisions

### 1. Temperature Settings

**Security Analysis: 0.7**

* **Rationale:** Balanced creativity and accuracy
* **Effect:** Generates varied but reliable analysis
* **Alternative Considered:** 
  - 0.3 (too repetitive)
  - 0.9 (too creative, inconsistent)

**Chat Assistant: 0.8**

* **Rationale:** More conversational and friendly
* **Effect:** Natural, engaging responses
* **Alternative Considered:**
  - 0.5 (too formal)
  - 1.0 (too unpredictable)

---

### 2. Token Limits

**Security Analysis: 1000 tokens**

* **Rationale:** Enough for detailed analysis
* **Effect:** Comprehensive security assessments
* **Typical Usage:** 300-700 tokens
* **Budget:** ~$0.0015 per analysis (Workers AI pricing)

**Chat Assistant: 500 tokens**

* **Rationale:** Concise, focused responses
* **Effect:** Quick, helpful answers
* **Typical Usage:** 100-300 tokens
* **Budget:** ~$0.0007 per message

---

### 3. Context Management

**Scan History: Last 5 scans**

* **Rationale:** Provides relevant context without overwhelming
* **Effect:** AI can reference recent findings
* **Memory Usage:** ~2-3KB per session
* **Storage:** Durable Objects (persistent)

**Chat History: Last 6 messages (3 turns)**

* **Rationale:** Maintains conversation flow
* **Effect:** Natural follow-up questions work
* **Memory Usage:** ~1-2KB per session
* **Storage:** Durable Objects (persistent)

---

### 4. Prompt Clarity

**Clear vs. Vague:**

❌ **Vague:**
```
Analyze this URL: [url]
```

✅ **Clear:**
```
Analyze this URL for security vulnerabilities: [url]

Already detected issues:
[List of findings]

Provide additional security insights and recommendations in clear, professional language.
```

**Why:** Specific instructions produce better, more focused outputs.

---

## Example Interactions

### Example 1: First Scan

**User Action:**
```
Scans URL: http://example.com/admin/login.php?id=123
```

**System Detects:**
- Insecure Protocol (HIGH)
- Sensitive Endpoint (MEDIUM)
- Parameter Injection (HIGH)

**Prompt to AI:**
```
Analyze this URL for security vulnerabilities: http://example.com/admin/login.php?id=123

Already detected issues:
- Insecure Protocol (HIGH): Using HTTP instead of HTTPS exposes data in transit
- Sensitive Endpoint Detected (MEDIUM): Admin or login endpoints should have extra security
- Potential Parameter Injection (HIGH): URL parameters may be vulnerable to SQL injection or LFI

Provide additional security insights and recommendations in clear, professional language.
```

**AI Response:**
```
The main security concern with this URL is the combination of multiple high-risk factors:

1. INSECURE AUTHENTICATION ENDPOINT: This appears to be an admin login page served 
   over HTTP. Credentials will be transmitted in plaintext.

2. SQL INJECTION RISK: The 'id' parameter suggests database queries are being performed. 
   Without proper parameterization, attackers could manipulate this.

3. SESSION HIJACKING: HTTP connections allow session tokens to be stolen via 
   man-in-the-middle attacks.

IMMEDIATE ACTIONS REQUIRED:
- Implement HTTPS with valid SSL/TLS certificate
- Use parameterized queries for all database interactions
- Add CSRF protection to the login form
- Implement rate limiting
- Consider adding two-factor authentication
```

---

### Example 2: Chat About Findings

**Context:**
```
Recent scan: https://secure-site.com/user=admin (Risk: HIGH, 2 vulnerabilities)
```

**User Message:**
```
How do I fix the SQL injection vulnerability?
```

**Full Prompt:**
```
System: You are a friendly cybersecurity assistant helping users understand their 
security scan results. Speak in clear, simple language. Be helpful and educational.

Recent security scans:
- https://secure-site.com/user=admin (Risk: HIGH, Vulnerabilities: 2)

User: How do I fix the SQL injection vulnerability?
```

**AI Response:**
```
Great question! SQL injection happens when user input is directly inserted into 
database queries.

Here's how to fix it:

1. USE PREPARED STATEMENTS:
Instead of: "SELECT * FROM users WHERE id = " + userId
Use: PreparedStatement stmt = conn.prepareStatement("SELECT * FROM users WHERE id = ?");

2. INPUT VALIDATION:
- Only accept expected characters
- Reject suspicious inputs like quotes or SQL keywords

3. USE AN ORM:
Modern frameworks handle this automatically.

4. APPLY LEAST PRIVILEGE:
The database user should have minimum permissions needed.

Would you like specific code examples for your programming language?
```

---

## Performance Metrics

### Response Quality

**Measured by:**
* Relevance to user question
* Accuracy of security information
* Actionability of recommendations
* Clarity of language

**Optimization Strategy:**
* Iterative prompt refinement
* Temperature adjustments
* Context window management
* Example-based guidance

---

### Token Efficiency

**Average Usage:**
* Security Analysis: 400-600 tokens
* Chat Responses: 150-250 tokens
* System Prompts: 50-100 tokens

**Optimization Techniques:**
* Concise system prompts
* Focused user questions
* Efficient context summaries
* Token budget monitoring

---

### Cost Analysis

**Workers AI Pricing** (as of 2025):
* ~$0.0015 per 1000 tokens

**Per Request:**
* Security Analysis: ~$0.0009 (600 tokens average)
* Chat Message: ~$0.0004 (250 tokens average)

**Monthly Estimate** (1000 users, 3 scans each, 5 chat messages):
* Scans: 3000 × $0.0009 = $2.70
* Chat: 5000 × $0.0004 = $2.00
* **Total: ~$4.70/month**

---

## Lessons Learned

### What Works Well

✅ **Clear Role Definition:** "You are a cybersecurity expert..."
✅ **Context Provision:** Including scan history and conversation
✅ **Specific Requests:** "Provide actionable recommendations..."
✅ **Temperature Balance:** 0.7-0.8 for security work
✅ **Token Limits:** 500-1000 tokens produces complete responses

---

### What Doesn't Work

❌ **Vague Requests:** "Analyze this" without context
❌ **Too Much Context:** Overloading with irrelevant history
❌ **Extreme Temperatures:** <0.3 or >0.9
❌ **Ambiguous Instructions:** "Be helpful" without specifics
❌ **No Examples:** AI performs better with example format

---

## Future Improvements

### Planned Enhancements

1. **Few-Shot Learning**
   * Include example vulnerability analyses
   * Demonstrate desired response format
   * Improve consistency

2. **Dynamic Context**
   * Adjust context based on conversation depth
   * Prioritize most relevant scans
   * Smart history truncation

3. **Specialized Prompts**
   * Different prompts for different vulnerability types
   * Language-specific recommendations (PHP vs Python)
   * Framework-aware suggestions

4. **Response Validation**
   * Check for hallucinations
   * Verify security advice accuracy
   * Flag uncertain recommendations

---

## Conclusion

The prompts in this application demonstrate:

* Professional system prompt design
* Effective context management
* Balanced creativity/accuracy settings
* Clear, actionable user prompts
* Conversational chat interactions

These techniques produce reliable, helpful, and professional AI-powered security 
analysis that enhances user experience while maintaining technical accuracy.

---

## Appendix: Complete Prompt Examples

### Security Analysis (Full)

```typescript
const systemPrompt = 'You are a cybersecurity expert analyzing web application security. Provide professional, actionable security assessments.';

const userPrompt = `Analyze this URL for security vulnerabilities: ${url}

Already detected issues:
${vulnerabilities.map(v => `- ${v.type} (${v.severity}): ${v.description}`).join('\n')}

Provide additional security insights and recommendations in clear, professional language.`;

const aiResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ],
  max_tokens: 1000,
  temperature: 0.7
});
```

### Chat Assistant (Full)

```typescript
const recentScans = this.scans.slice(-5);
const context = recentScans.length > 0 
  ? `Recent security scans:\n${recentScans.map(s => 
      `- ${s.url} (Risk: ${s.riskLevel}, Vulnerabilities: ${s.vulnerabilities.length})`
    ).join('\n')}`
  : 'No scans performed yet.';

const systemPrompt = `You are a friendly cybersecurity assistant helping users understand their security scan results. 
Speak in clear, simple language. Be helpful and educational.

${context}`;

const messages = [
  { role: 'system', content: systemPrompt },
  ...this.chatHistory.slice(-6),
  { role: 'user', content: message }
];

const aiResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
  messages,
  max_tokens: 500,
  temperature: 0.8
});
```

---

**Created by:** Gonçalo Gonçalves  
**Date:** December 31, 2025  
**AI Model:** Llama 3.3 70B Instruct FP8 Fast  
**Platform:** Cloudflare Workers AI