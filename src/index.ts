interface Env {
  AI: Ai;
  SCAN_SESSION: DurableObjectNamespace;
}

interface ScanRequest {
  url: string;
  sessionId: string;
}

interface ChatRequest {
  message: string;
  sessionId: string;
}

export class ScanSession implements DurableObject {
  private state: DurableObjectState;
  private env: Env;
  private scans: Array<any>;
  private chatHistory: Array<{ role: string; content: string }>;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.scans = [];
    this.chatHistory = [];
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/init' && request.method === 'POST') {
      await this.state.blockConcurrencyWhile(async () => {
        const stored = await this.state.storage.get('scans');
        this.scans = (stored as Array<any>) || [];
        const chatStored = await this.state.storage.get('chatHistory');
        this.chatHistory = (chatStored as Array<any>) || [];
      });
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/scan' && request.method === 'POST') {
      const { url: targetUrl } = await request.json() as { url: string };
      const result = await this.performSecurityScan(targetUrl);
      
      await this.state.blockConcurrencyWhile(async () => {
        this.scans.push({
          url: targetUrl,
          timestamp: Date.now(),
          ...result
        });
        if (this.scans.length > 50) {
          this.scans = this.scans.slice(-50);
        }
        await this.state.storage.put('scans', this.scans);
      });

      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/chat' && request.method === 'POST') {
      const { message } = await request.json() as { message: string };
      const response = await this.handleChat(message);
      
      await this.state.blockConcurrencyWhile(async () => {
        this.chatHistory.push(
          { role: 'user', content: message },
          { role: 'assistant', content: response }
        );
        if (this.chatHistory.length > 20) {
          this.chatHistory = this.chatHistory.slice(-20);
        }
        await this.state.storage.put('chatHistory', this.chatHistory);
      });

      return new Response(JSON.stringify({ response }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/history') {
      return new Response(JSON.stringify({ 
        scans: this.scans,
        chatHistory: this.chatHistory
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  private async performSecurityScan(url: string): Promise<any> {
    const vulnerabilities: Array<any> = [];
    
    const urlLower = url.toLowerCase();
    if (urlLower.includes('http://') && !urlLower.includes('localhost')) {
      vulnerabilities.push({
        type: 'Insecure Protocol',
        severity: 'HIGH',
        description: 'Using HTTP instead of HTTPS exposes data in transit',
        recommendation: 'Always use HTTPS for secure communication'
      });
    }

    if (urlLower.match(/\.(php|asp|jsp)$/)) {
      vulnerabilities.push({
        type: 'Potential Server-Side Script',
        severity: 'MEDIUM',
        description: 'Server-side scripts may be vulnerable to injection attacks',
        recommendation: 'Ensure proper input validation and sanitization'
      });
    }

    if (urlLower.includes('admin') || urlLower.includes('login') || urlLower.includes('dashboard')) {
      vulnerabilities.push({
        type: 'Sensitive Endpoint Detected',
        severity: 'MEDIUM',
        description: 'Admin or login endpoints should have extra security',
        recommendation: 'Implement rate limiting, 2FA, and strong authentication'
      });
    }

    if (urlLower.match(/id=|user=|file=|page=/)) {
      vulnerabilities.push({
        type: 'Potential Parameter Injection',
        severity: 'HIGH',
        description: 'URL parameters may be vulnerable to SQL injection or LFI',
        recommendation: 'Use parameterized queries and validate all inputs'
      });
    }

    const systemPrompt = 'You are a cybersecurity expert analyzing web application security. Provide professional, actionable security assessments.';
    
    const userPrompt = 'Analyze this URL for security vulnerabilities: ' + url + '\n\nAlready detected issues:\n' + vulnerabilities.map(v => '- ' + v.type + ' (' + v.severity + '): ' + v.description).join('\n') + '\n\nProvide additional security insights and recommendations in clear, professional language.';

    try {
      const aiResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiAnalysis = aiResponse.response || 'AI analysis unavailable';
      const riskScore = this.calculateRiskScore(vulnerabilities);

      return {
        url,
        vulnerabilities,
        aiAnalysis,
        riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        scannedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        url,
        vulnerabilities,
        aiAnalysis: 'AI analysis temporarily unavailable',
        riskScore: this.calculateRiskScore(vulnerabilities),
        riskLevel: this.getRiskLevel(this.calculateRiskScore(vulnerabilities)),
        scannedAt: new Date().toISOString()
      };
    }
  }

  private async handleChat(message: string): Promise<string> {
    const recentScans = this.scans.slice(-5);
    const context = recentScans.length > 0 
      ? 'Recent security scans:\n' + recentScans.map(s => '- ' + s.url + ' (Risk: ' + s.riskLevel + ', Vulnerabilities: ' + s.vulnerabilities.length + ')').join('\n')
      : 'No scans performed yet.';

    const systemPrompt = 'You are a friendly cybersecurity assistant helping users understand their security scan results. Speak in clear, simple language. Be helpful and educational.\n\n' + context;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.chatHistory.slice(-6),
      { role: 'user', content: message }
    ];

    try {
      const aiResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages,
        max_tokens: 500,
        temperature: 0.8
      });

      return aiResponse.response || 'I apologize, but I cannot provide a response at this time. Please try again.';
    } catch (error) {
      return 'I apologize, but I am temporarily unavailable. Please try again in a moment.';
    }
  }

  private calculateRiskScore(vulnerabilities: Array<any>): number {
    const severityPoints = { 'CRITICAL': 10, 'HIGH': 7, 'MEDIUM': 4, 'LOW': 2 };
    return vulnerabilities.reduce((sum, v) => sum + (severityPoints[v.severity as keyof typeof severityPoints] || 0), 0);
  }

  private getRiskLevel(score: number): string {
    if (score >= 20) return 'CRITICAL';
    if (score >= 10) return 'HIGH';
    if (score >= 5) return 'MEDIUM';
    return 'LOW';
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (url.pathname === '/' && request.method === 'GET') {
      return new Response(getHTML(), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (url.pathname === '/api/session/init' && request.method === 'POST') {
      const sessionId = crypto.randomUUID();
      const id = env.SCAN_SESSION.idFromName(sessionId);
      const stub = env.SCAN_SESSION.get(id);
      await stub.fetch(new Request('http://internal/init', { method: 'POST' }));
      return new Response(JSON.stringify({ sessionId }), { headers: corsHeaders });
    }

    if (url.pathname === '/api/scan' && request.method === 'POST') {
      const { url: targetUrl, sessionId } = await request.json() as ScanRequest;
      const id = env.SCAN_SESSION.idFromName(sessionId);
      const stub = env.SCAN_SESSION.get(id);
      const response = await stub.fetch(new Request('http://internal/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      }));
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const { message, sessionId } = await request.json() as ChatRequest;
      const id = env.SCAN_SESSION.idFromName(sessionId);
      const stub = env.SCAN_SESSION.get(id);
      const response = await stub.fetch(new Request('http://internal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      }));
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    if (url.pathname === '/api/history' && request.method === 'POST') {
      const { sessionId } = await request.json() as { sessionId: string };
      const id = env.SCAN_SESSION.idFromName(sessionId);
      const stub = env.SCAN_SESSION.get(id);
      const response = await stub.fetch(new Request('http://internal/history'));
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: corsHeaders });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

function getHTML(): string {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AI Security Scanner</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;background:linear-gradient(135deg,#1e3c72 0,#2a5298 100%);min-height:100vh;padding:20px}.container{max-width:1400px;margin:0 auto}.header{text-align:center;color:#fff;padding:40px 20px}.header h1{font-size:3rem;margin-bottom:10px;text-shadow:2px 2px 4px rgba(0,0,0,.3)}.header p{font-size:1.2rem;opacity:.95}.main-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:30px}.panel{background:#fff;border-radius:15px;padding:30px;box-shadow:0 10px 30px rgba(0,0,0,.3)}.panel h2{color:#1e3c72;margin-bottom:20px;font-size:1.8rem;border-bottom:3px solid #2a5298;padding-bottom:10px}.input-group{margin-bottom:20px}label{display:block;font-weight:600;margin-bottom:8px;color:#333}input[type=text]{width:100%;padding:15px;border:2px solid #ddd;border-radius:8px;font-size:1rem;transition:border-color .3s}input[type=text]:focus{outline:0;border-color:#2a5298}button{background:linear-gradient(135deg,#1e3c72 0,#2a5298 100%);color:#fff;border:none;padding:15px 30px;font-size:1.1rem;font-weight:600;border-radius:8px;cursor:pointer;transition:transform .2s,box-shadow .2s;width:100%}button:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 5px 15px rgba(30,60,114,.4)}button:disabled{opacity:.6;cursor:not-allowed}.results{margin-top:20px;display:none}.results.show{display:block}.risk-badge{display:inline-block;padding:8px 16px;border-radius:20px;font-weight:600;font-size:.9rem;margin-bottom:15px}.risk-CRITICAL{background:#d32f2f;color:#fff}.risk-HIGH{background:#f57c00;color:#fff}.risk-MEDIUM{background:#fbc02d;color:#333}.risk-LOW{background:#388e3c;color:#fff}.vuln-list{margin-top:20px}.vuln-item{background:#f5f5f5;padding:15px;border-radius:8px;margin-bottom:10px;border-left:4px solid #2a5298}.vuln-header{display:flex;justify-content:space-between;margin-bottom:8px}.vuln-type{font-weight:600;color:#1e3c72}.severity-badge{padding:4px 12px;border-radius:12px;font-size:.8rem;font-weight:600}.severity-CRITICAL{background:#d32f2f;color:#fff}.severity-HIGH{background:#f57c00;color:#fff}.severity-MEDIUM{background:#fbc02d;color:#333}.severity-LOW{background:#388e3c;color:#fff}.ai-analysis{background:#e3f2fd;padding:20px;border-radius:8px;margin-top:20px;border-left:4px solid #1976d2}.ai-analysis h3{color:#1976d2;margin-bottom:10px}.loading{text-align:center;padding:30px;display:none}.loading.show{display:block}.spinner{border:4px solid #f3f3f3;border-top:4px solid #2a5298;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin:0 auto 15px}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}.chat-container{max-height:500px;display:flex;flex-direction:column}.chat-messages{flex:1;overflow-y:auto;padding:20px;background:#f9f9f9;border-radius:8px;margin-bottom:15px;min-height:300px;max-height:400px}.chat-message{margin-bottom:15px;padding:12px;border-radius:8px}.chat-message.user{background:#2a5298;color:#fff;margin-left:20%}.chat-message.assistant{background:#fff;border:1px solid #ddd;margin-right:20%}.chat-input-group{display:flex;gap:10px}.chat-input-group input{flex:1}.chat-input-group button{width:auto;padding:15px 25px}.example-urls{background:#fff3e0;padding:15px;border-radius:8px;margin-bottom:20px}.example-urls h4{color:#f57c00;margin-bottom:10px}.example-url{display:block;color:#1976d2;text-decoration:none;padding:5px 0;cursor:pointer}.example-url:hover{text-decoration:underline}@media (max-width:1024px){.main-grid{grid-template-columns:1fr}}</style></head><body><div class="container"><div class="header"><h1>🛡️ AI Security Scanner</h1><p>Powered by Cloudflare Workers AI & Llama 3.3</p></div><div class="main-grid"><div class="panel"><h2>🔍 Security Scan</h2><div class="example-urls"><h4>Try these examples:</h4><a class="example-url" onclick="fillExample(\'http://example.com/admin/login.php?id=123\')">http://example.com/admin/login.php?id=123</a> <a class="example-url" onclick="fillExample(\'https://secure-site.com/user=admin\')">https://secure-site.com/user=admin</a> <a class="example-url" onclick="fillExample(\'http://vulnerable.com/page?file=../../etc/passwd\')">http://vulnerable.com/page?file=../../etc/passwd</a></div><div class="input-group"><label for="urlInput">Enter URL to scan:</label> <input type="text" id="urlInput" placeholder="https://example.com/page?id=123"></div><button onclick="startScan()" id="scanBtn">🔍 Start Security Scan</button><div class="loading" id="loading"><div class="spinner"></div><p>Scanning for vulnerabilities...</p></div><div class="results" id="results"><div id="riskBadge"></div><div class="vuln-list" id="vulnList"></div><div class="ai-analysis" id="aiAnalysis"></div></div></div><div class="panel"><h2>💬 Security Assistant</h2><div class="chat-container"><div class="chat-messages" id="chatMessages"><div class="chat-message assistant">Hello! I\'m your AI security assistant. I can help you understand the vulnerabilities found in your scans. Try asking me questions like "What vulnerabilities did you find?" or "How can I fix these issues?"</div></div><div class="chat-input-group"><input type="text" id="chatInput" placeholder="Ask about security findings..." onkeypress="if(event.key===\'Enter\') sendMessage()"> <button onclick="sendMessage()">Send</button></div></div></div></div></div><script>let sessionId=null;async function initSession(){const e=await fetch("/api/session/init",{method:"POST"}),t=await e.json();sessionId=t.sessionId}function fillExample(e){document.getElementById("urlInput").value=e}async function startScan(){const e=document.getElementById("urlInput").value.trim();if(!e)return void alert("Please enter a URL to scan");sessionId||await initSession();const t=document.getElementById("scanBtn"),n=document.getElementById("loading"),s=document.getElementById("results");t.disabled=!0,n.classList.add("show"),s.classList.remove("show");try{const t=await fetch("/api/scan",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:e,sessionId:sessionId})}),n=await t.json();displayResults(n)}catch(e){alert("Error during scan. Please try again.")}finally{n.classList.remove("show"),t.disabled=!1}}function displayResults(e){const t=document.getElementById("riskBadge"),n=document.getElementById("vulnList"),s=document.getElementById("aiAnalysis"),a=document.getElementById("results");t.innerHTML=`<span class="risk-badge risk-${e.riskLevel}">Risk Level: ${e.riskLevel} (Score: ${e.riskScore})</span>`,0===e.vulnerabilities.length?n.innerHTML=\'<p style="color:#388e3c;font-weight:600">✓ No obvious vulnerabilities detected</p>\':n.innerHTML=\'<h3 style="margin-bottom:15px">Found Vulnerabilities:</h3>\'+e.vulnerabilities.map(e=>`<div class="vuln-item"><div class="vuln-header"><span class="vuln-type">${e.type}</span><span class="severity-badge severity-${e.severity}">${e.severity}</span></div><p style="margin-bottom:8px;color:#666">${e.description}</p><p style="color:#1976d2;font-weight:500">💡 ${e.recommendation}</p></div>`).join(""),s.innerHTML=`<h3>🤖 AI Security Analysis</h3><p style="line-height:1.6;white-space:pre-wrap">${e.aiAnalysis}</p>`,a.classList.add("show")}async function sendMessage(){const e=document.getElementById("chatInput"),t=e.value.trim();if(!t||!sessionId)return;const n=document.getElementById("chatMessages");n.innerHTML+=`<div class="chat-message user">${t}</div>`,e.value="",n.scrollTop=n.scrollHeight;try{const e=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t,sessionId:sessionId})}),s=await e.json();n.innerHTML+=`<div class="chat-message assistant">${s.response}</div>`,n.scrollTop=n.scrollHeight}catch(e){n.innerHTML+=\'<div class="chat-message assistant">Sorry, I encountered an error. Please try again.</div>\',n.scrollTop=n.scrollHeight}}initSession()</script></body></html>';
}
