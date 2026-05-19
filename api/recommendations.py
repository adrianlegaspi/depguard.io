"""
Vercel Python serverless function: AI-generated vulnerability recommendations.

POST /api/recommendations
Body: { id, summary, details, severity, cwes, package: {name, ecosystem}, fixedVersion }
Returns: { prevention, considerations, remediation, cached, generatedAt }

Cache: Vercel KV (Upstash Redis), key `vuln-rec:v1:{id}`, TTL 30 days.
Model: gemini-3.1-flash-lite (free tier).
"""
import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler

import google.generativeai as genai
from upstash_redis import Redis

CACHE_PREFIX = "vuln-rec:v1:"
CACHE_TTL_SECONDS = 60 * 60 * 24 * 30
MODEL_NAME = "gemini-3.1-flash-lite"
MAX_DETAILS_CHARS = 2000

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "prevention": {"type": "string"},
        "considerations": {"type": "string"},
        "remediation": {"type": "string"},
    },
    "required": ["prevention", "considerations", "remediation"],
}

SYSTEM_INSTRUCTION = (
    "You are a senior application-security engineer writing concise, actionable "
    "guidance for developers triaging a specific vulnerability. Output strict JSON "
    "matching the provided schema. Each field is markdown. Be terse, dev-focused, "
    "and reference the specific package/version when relevant. No marketing fluff, "
    "no apologies, no preamble. Use short markdown bullets where helpful. "
    "2-4 sentences or bullets per field."
)

FIELD_GUIDANCE = (
    "prevention: How to avoid this class of vulnerability in future code or deps "
    "(coding practices, lint rules, dep pinning, supply-chain hygiene).\n"
    "considerations: Context and trade-offs — does this trigger only on user-supplied "
    "input, is it remote-exploitable, are there mitigating defaults, does the CVSS "
    "score overstate real-world risk for typical use?\n"
    "remediation: Concrete action plan if currently affected — upgrade command, "
    "config changes, audit steps, rotate-secrets if relevant."
)


def _redis():
    url = os.environ.get("KV_REST_API_URL") or os.environ.get("UPSTASH_REDIS_REST_URL")
    token = os.environ.get("KV_REST_API_TOKEN") or os.environ.get("UPSTASH_REDIS_REST_TOKEN")
    if not url or not token:
        return None
    return Redis(url=url, token=token)


def _cache_get(vuln_id):
    r = _redis()
    if r is None:
        return None
    try:
        raw = r.get(CACHE_PREFIX + vuln_id)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def _cache_set(vuln_id, payload):
    r = _redis()
    if r is None:
        return
    try:
        r.set(CACHE_PREFIX + vuln_id, json.dumps(payload), ex=CACHE_TTL_SECONDS)
    except Exception:
        pass


def _build_prompt(body):
    pkg = body.get("package") or {}
    details = (body.get("details") or "")[:MAX_DETAILS_CHARS]
    cwes = ", ".join(body.get("cwes") or []) or "none"
    return (
        f"{FIELD_GUIDANCE}\n\n"
        f"Vulnerability ID: {body.get('id', 'unknown')}\n"
        f"Severity: {body.get('severity', 'UNKNOWN')}\n"
        f"CWEs: {cwes}\n"
        f"Package: {pkg.get('name', 'unknown')} ({pkg.get('ecosystem', 'unknown')})\n"
        f"Fixed in: {body.get('fixedVersion') or 'no fix available'}\n"
        f"Summary: {body.get('summary', '')}\n"
        f"Details:\n{details}\n"
    )


def _generate(body):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=SYSTEM_INSTRUCTION,
        generation_config={
            "response_mime_type": "application/json",
            "response_schema": RESPONSE_SCHEMA,
            "temperature": 0.4,
        },
    )
    result = model.generate_content(_build_prompt(body))
    parsed = json.loads(result.text)
    return {
        "prevention": parsed["prevention"],
        "considerations": parsed["considerations"],
        "remediation": parsed["remediation"],
    }


class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(204, {})

    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            body = json.loads(raw or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._send(400, {"error": "invalid JSON body"})

        vuln_id = body.get("id")
        if not vuln_id or not isinstance(vuln_id, str):
            return self._send(400, {"error": "missing required field: id"})

        cached = _cache_get(vuln_id)
        if cached:
            cached["cached"] = True
            return self._send(200, cached)

        try:
            recs = _generate(body)
        except Exception as exc:
            return self._send(502, {"error": f"generation failed: {type(exc).__name__}"})

        payload = {
            **recs,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "cached": False,
        }
        _cache_set(vuln_id, {**recs, "generatedAt": payload["generatedAt"]})
        return self._send(200, payload)
