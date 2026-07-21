const DEFAULT_TIMEOUT_MS = 10000;

const AMP_APPLICATION_STATES = Object.freeze({
  [-1]: 'Undefined',
  0: 'Stopped',
  5: 'Pre-start',
  7: 'Configuring',
  10: 'Starting',
  20: 'Ready',
  30: 'Restarting',
  40: 'Stopping',
  45: 'Preparing for sleep',
  50: 'Sleeping',
  60: 'Waiting',
  70: 'Installing',
  75: 'Updating',
  80: 'Awaiting user input',
  100: 'Failed',
  200: 'Suspended',
  250: 'Maintenance',
  999: 'Indeterminate',
});

function cleanBaseUrl(value) {
  const raw = String(value || '').trim().replace(/\/+$/, '');
  if (!raw) throw new Error('AMP instance URL is required.');
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('AMP URL must use http or https.');
  return url.toString().replace(/\/$/, '');
}

async function postJson(url, body, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'ApexOrder-AMP-Integration/1.0',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!response.ok) {
      const message = data?.Message || data?.message || data?.Title || `AMP request failed with status ${response.status}`;
      throw new Error(message);
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('AMP request timed out.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function unwrap(result) {
  return result?.result ?? result?.Result ?? result;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function firstText(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim()) return String(value);
  }
  return null;
}

function normaliseAmpApplicationState(value) {
  const rawValue = value === undefined || value === null ? null : String(value).trim();
  if (!rawValue) return { stateId: null, state: 'Unknown', online: false };

  const numericState = Number(rawValue);
  if (Number.isInteger(numericState)) {
    return {
      stateId: numericState,
      state: AMP_APPLICATION_STATES[numericState] || `Unknown (${numericState})`,
      online: numericState === 20,
    };
  }

  const state = rawValue;
  const stateLower = state.toLowerCase();
  return {
    stateId: null,
    state,
    online: ['ready', 'running', 'online', 'started'].some((candidate) => stateLower.includes(candidate)),
  };
}

export function ampEnvironment() {
  const username = String(process.env.AMP_USERNAME || '').trim();
  const password = String(process.env.AMP_PASSWORD || '').trim();
  return {
    username,
    password,
    configured: Boolean(username && password),
  };
}

export async function ampLogin(instanceUrl) {
  const baseUrl = cleanBaseUrl(instanceUrl);
  const credentials = ampEnvironment();
  if (!credentials.configured) throw new Error('AMP username and password are not configured on the ApexOrder server.');

  const response = await postJson(`${baseUrl}/API/Core/Login`, {
    username: credentials.username,
    password: credentials.password,
    token: '',
    rememberMe: false,
  });

  if (response?.success === false) {
    const reason = firstText(
      response?.resultReason,
      response?.reason,
      response?.Reason,
      response?.message,
      response?.Message,
    );
    throw new Error(reason || 'AMP rejected the supplied username or password.');
  }

  const sessionId = firstText(response?.sessionID, response?.sessionId, response?.SessionID, response?.session_id);
  if (!sessionId) {
    const reason = firstText(
      response?.resultReason,
      response?.reason,
      response?.Reason,
      response?.message,
      response?.Message,
    );
    throw new Error(reason || 'AMP login succeeded but did not return a session ID.');
  }

  return { baseUrl, sessionId };
}

export function normaliseAmpStatus(rawStatus) {
  const raw = unwrap(rawStatus) || {};
  const metrics = raw.Metrics || raw.metrics || {};
  const applicationState = normaliseAmpApplicationState(
    raw.State ?? raw.state ?? raw.ApplicationState ?? raw.applicationState ?? raw.Status ?? raw.status,
  );

  const playersCurrent = firstNumber(
    raw.PlayerCount,
    raw.playerCount,
    raw.Players,
    raw.players,
    metrics['Active Users'],
    metrics.Players,
  );
  const playersMax = firstNumber(
    raw.MaxPlayers,
    raw.maxPlayers,
    raw.PlayerLimit,
    raw.playerLimit,
    metrics['Maximum Users'],
  );
  const cpuPercent = firstNumber(raw.CPUUsage, raw.cpuUsage, metrics['CPU Usage'], metrics.CPU);
  const memoryBytes = firstNumber(raw.MemoryUsage, raw.memoryUsage, metrics['Memory Usage'], metrics.Memory);
  const uptimeSeconds = firstNumber(raw.Uptime, raw.uptime, raw.UptimeSeconds, raw.uptimeSeconds);

  return {
    online: applicationState.online,
    state: applicationState.state,
    stateId: applicationState.stateId,
    playersCurrent,
    playersMax,
    cpuPercent,
    memoryBytes,
    uptimeSeconds,
    map: firstText(raw.Map, raw.map, raw.CurrentMap, raw.currentMap, metrics.Map),
    version: firstText(raw.Version, raw.version, raw.ApplicationVersion, raw.applicationVersion),
    name: firstText(raw.InstanceName, raw.instanceName, raw.FriendlyName, raw.friendlyName),
    fetchedAt: new Date().toISOString(),
  };
}

export async function getAmpStatus(instanceUrl) {
  const { baseUrl, sessionId } = await ampLogin(instanceUrl);
  const status = await postJson(`${baseUrl}/API/Core/GetStatus`, { SESSIONID: sessionId });
  return normaliseAmpStatus(status);
}

export async function testAmpConnection(instanceUrl) {
  const status = await getAmpStatus(instanceUrl);
  return { ok: true, status };
}
