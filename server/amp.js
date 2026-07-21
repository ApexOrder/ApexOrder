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
    if (value === undefined || value === null || value === '') continue;
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

function normaliseKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findDeepValue(root, candidateKeys) {
  const wanted = new Set(candidateKeys.map(normaliseKey));
  const seen = new Set();
  const queue = [root];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (wanted.has(normaliseKey(key)) && value !== undefined && value !== null && value !== '') return value;
      if (value && typeof value === 'object') queue.push(value);
    }
  }

  return null;
}

function collectNamedMetrics(root) {
  const metrics = {};
  const seen = new Set();
  const queue = [root];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object' || seen.has(current)) continue;
    seen.add(current);

    if (Array.isArray(current)) {
      for (const item of current) queue.push(item);
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const rawValue = value.RawValue ?? value.rawValue ?? value.Value ?? value.value;
        const maxValue = value.MaxValue ?? value.maxValue;
        const percent = value.Percent ?? value.percent;
        const units = firstText(value.Units, value.units);

        if (rawValue !== undefined && rawValue !== null) {
          metrics[normaliseKey(key)] = { rawValue, maxValue, percent, units };
        }
      }
    }

    const name = firstText(current.Name, current.name, current.MetricName, current.metricName, current.Label, current.label);
    const rawValue = current.RawValue ?? current.rawValue ?? current.Value ?? current.value;
    if (name && rawValue !== undefined && rawValue !== null) {
      metrics[normaliseKey(name)] = {
        rawValue,
        maxValue: current.MaxValue ?? current.maxValue,
        percent: current.Percent ?? current.percent,
        units: firstText(current.Units, current.units),
      };
    }

    for (const valueToVisit of Object.values(current)) {
      if (valueToVisit && typeof valueToVisit === 'object') queue.push(valueToVisit);
    }
  }

  return metrics;
}

function metricObject(metrics, ...names) {
  for (const name of names) {
    const value = metrics[normaliseKey(name)];
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function normaliseMemoryBytes(value, units = '') {
  if (value === undefined || value === null || value === '') return null;
  const number = Number.parseFloat(String(value).replace(/,/g, ''));
  if (!Number.isFinite(number)) return null;

  const unit = String(units || value).toLowerCase();
  if (unit.includes('tib') || unit.includes('tb')) return Math.round(number * 1024 ** 4);
  if (unit.includes('gib') || unit.includes('gb')) return Math.round(number * 1024 ** 3);
  if (unit.includes('mib') || unit.includes('mb')) return Math.round(number * 1024 ** 2);
  if (unit.includes('kib') || unit.includes('kb')) return Math.round(number * 1024);
  return number;
}

function normalisePercent(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number.parseFloat(String(value).replace('%', '').trim());
  return Number.isFinite(number) ? number : null;
}

function normaliseUptimeSeconds(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const text = String(value).trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) return Number(text);

  const parts = text.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return null;

  if (parts.length === 4) {
    const [days, hours, minutes, seconds] = parts;
    return days * 86400 + hours * 3600 + minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
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
    const reason = firstText(response?.resultReason, response?.reason, response?.Reason, response?.message, response?.Message);
    throw new Error(reason || 'AMP rejected the supplied username or password.');
  }

  const sessionId = firstText(response?.sessionID, response?.sessionId, response?.SessionID, response?.session_id);
  if (!sessionId) {
    const reason = firstText(response?.resultReason, response?.reason, response?.Reason, response?.message, response?.Message);
    throw new Error(reason || 'AMP login succeeded but did not return a session ID.');
  }

  return { baseUrl, sessionId };
}

export function normaliseAmpStatus(...responses) {
  const sources = responses.map(unwrap).filter(Boolean);
  const combined = { sources };
  const namedMetrics = collectNamedMetrics(combined);

  const stateValue = findDeepValue(combined, ['State', 'ApplicationState']);
  const applicationState = normaliseAmpApplicationState(stateValue);

  const activeUsers = metricObject(namedMetrics, 'Active Users', 'Players', 'Player Count', 'Current Players');
  const cpu = metricObject(namedMetrics, 'CPU Usage', 'CPU', 'Processor Usage');
  const memory = metricObject(namedMetrics, 'Memory Usage', 'Memory', 'RAM Usage');

  const playersCurrent = firstNumber(
    findDeepValue(combined, ['PlayerCount', 'PlayersCurrent', 'CurrentPlayers']),
    activeUsers?.rawValue,
  );

  const playersMax = firstNumber(
    findDeepValue(combined, ['MaxPlayers', 'PlayersMax', 'PlayerLimit']),
    activeUsers?.maxValue,
  );

  const cpuPercent = normalisePercent(
    cpu?.percent ?? cpu?.rawValue ?? findDeepValue(combined, ['CPUPercent', 'ProcessorUsage']),
  );

  const memoryBytes = normaliseMemoryBytes(
    memory?.rawValue ?? findDeepValue(combined, ['MemoryBytes', 'RAMUsage']),
    memory?.units,
  );

  const uptimeSeconds = normaliseUptimeSeconds(
    findDeepValue(combined, ['UptimeSeconds', 'Uptime', 'RunningFor']),
  );

  return {
    online: applicationState.online,
    state: applicationState.state,
    stateId: applicationState.stateId,
    playersCurrent,
    playersMax,
    cpuPercent,
    memoryBytes,
    uptimeSeconds,
    map: firstText(findDeepValue(combined, ['CurrentMap', 'MapName', 'Map'])),
    version: firstText(findDeepValue(combined, ['ApplicationVersion', 'GameVersion', 'Version'])),
    name: firstText(findDeepValue(combined, ['InstanceName', 'FriendlyName', 'ServerName', 'DisplayName'])),
    fetchedAt: new Date().toISOString(),
  };
}

export async function getAmpStatus(instanceUrl) {
  const { baseUrl, sessionId } = await ampLogin(instanceUrl);
  const auth = { SESSIONID: sessionId };

  const [statusResult, updatesResult] = await Promise.allSettled([
    postJson(`${baseUrl}/API/Core/GetStatus`, auth),
    postJson(`${baseUrl}/API/Core/GetUpdates`, {
      ...auth,
      LastMessageSerial: 0,
      LastMetricsSerial: 0,
      LastEventSerial: 0,
      LastStateSerial: 0,
    }),
  ]);

  if (statusResult.status === 'rejected' && updatesResult.status === 'rejected') {
    throw new Error(`AMP status requests failed: ${statusResult.reason?.message || 'GetStatus failed'}; ${updatesResult.reason?.message || 'GetUpdates failed'}`);
  }

  return normaliseAmpStatus(
    statusResult.status === 'fulfilled' ? statusResult.value : null,
    updatesResult.status === 'fulfilled' ? updatesResult.value : null,
  );
}

export async function testAmpConnection(instanceUrl) {
  const status = await getAmpStatus(instanceUrl);
  return { ok: true, status };
}
