import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright-core';
import { approvedReplacement } from './replacement-policy.mjs';

const root = join(homedir(), 'Library', 'Application Support', 'SYNCRO SHIFT Executor');
const profilePath = join(root, 'chrome-profile');
const tokenPath = join(root, 'executor-token');
const baseUrl = 'https://syncro-shift.vercel.app';
const bitrixUrl = 'https://syncrosfera.bitrix24.eu';
const allowedScheduleIds = new Set([33]); // Primer despliegue: Recepción SyncroLab exclusivamente.

function readToken() {
  const permissions = statSync(tokenPath).mode & 0o077;
  if (permissions) throw new Error('TOKEN_PERMISSIONS_UNSAFE');
  const token = readFileSync(tokenPath, 'utf8').trim();
  if (token.length < 32) throw new Error('TOKEN_MISSING');
  return token;
}

async function api(token, method, body) {
  const response = await fetch(`${baseUrl}/api/planning/executor`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`EXECUTOR_API_${response.status}_${result.error || 'UNKNOWN'}`);
  return result;
}

function monthQuery(date) {
  const year = date.slice(0, 4);
  const month = date.slice(5, 7);
  const last = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  const format = day => `${String(day).padStart(2, '0')}.${month}.${year}`;
  return new URLSearchParams({
    apply_filter: 'Y', REPORT_PERIOD_datesel: 'RANGE',
    REPORT_PERIOD_from: format(1), REPORT_PERIOD_to: format(last)
  }).toString();
}

function expectedShiftName(shift) {
  return String(shift.name || '').trim();
}

async function cellState(cell) {
  return cell.evaluate(element => [...element.querySelectorAll('.timeman-grid-worktime-shift')]
    .map(block => ({
      name: (block.querySelector('[data-role="name"]')?.textContent || '').trim(),
      start: (block.querySelector('[data-role="start"]')?.textContent || '').trim(),
      end: (block.querySelector('[data-role="end"]')?.textContent || '').trim()
    })));
}

function matches(actual, desired) {
  return actual.name === expectedShiftName(desired)
    && (!desired.start || actual.start === desired.start.slice(0, 5))
    && (!desired.end || actual.end === desired.end.slice(0, 5));
}

async function openSchedule(page) {
  await page.goto(`${bitrixUrl}/timeman/schedules/`, {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  const row = page.locator('tr[data-id="33"]');
  await row.waitFor({ state: 'visible', timeout: 30000 });
  await row.locator('button.main-grid-row-action-button').click();
  await page.getByRole('menuitem', { name: 'Schedule', exact: true }).click();
  const frame = page.frameLocator('iframe[src*="/timeman/schedules/33/shiftplan/"]');
  await frame.locator('#TM_SHIFT_PLAN_GRID_33_table').waitFor({ state: 'visible', timeout: 30000 });
  const activeFrame = page.frames().find(item => item.url().includes('/timeman/schedules/33/shiftplan/'));
  if (!activeFrame) throw new Error('BITRIX_SHIFTPLAN_FRAME_MISSING');
  return { page, frame, activeFrame, month: null };
}

async function openCell(plan, assignment) {
  if (!allowedScheduleIds.has(Number(assignment.bitrix_schedule_id))) {
    throw new Error('SCHEDULE_NOT_ALLOWED');
  }
  const month = assignment.date.slice(0, 7);
  if (plan.month !== month) {
    const url = `${bitrixUrl}/timeman/schedules/${assignment.bitrix_schedule_id}/shiftplan/index.php`
      + `?IFRAME=Y&IFRAME_TYPE=SIDE_SLIDER&${monthQuery(assignment.date)}`;
    await plan.activeFrame.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await plan.frame.locator(`#TM_SHIFT_PLAN_GRID_${assignment.bitrix_schedule_id}_table`)
      .waitFor({ state: 'visible', timeout: 30000 });
    plan.month = month;
  }
  const table = plan.frame.locator(`#TM_SHIFT_PLAN_GRID_${assignment.bitrix_schedule_id}_table`);
  await table.waitFor({ state: 'visible', timeout: 30000 });
  const cell = table.locator(`td[class~="js-${assignment.bitrix_user_id}_${assignment.date}"]`);
  if (await cell.count() !== 1) throw new Error('BITRIX_CELL_NOT_UNIQUE');
  return cell;
}

async function reloadPlan(plan) {
  await plan.activeFrame.goto(plan.activeFrame.url(), { waitUntil: 'domcontentloaded', timeout: 30000 });
  await plan.frame.locator('#TM_SHIFT_PLAN_GRID_33_table').waitFor({ state: 'visible', timeout: 30000 });
}

async function deleteApprovedShift(plan, cell, assignment) {
  const menus = cell.locator('.timeman-grid-worktime-shift [data-role="shiftplan-menu-toggle"]');
  if (await menus.count() !== 1) throw new Error('BITRIX_DELETE_TARGET_NOT_UNIQUE');
  await menus.click();
  const deleteItem = plan.frame.getByRole('menuitem', { name: 'Delete shift', exact: true });
  if (await deleteItem.count() !== 1) throw new Error('BITRIX_DELETE_OPTION_NOT_UNIQUE');
  let unexpectedDialog = false;
  const handleDialog = async dialog => {
    if (dialog.type() === 'confirm' && /delete shift/i.test(dialog.message())) await dialog.accept();
    else { unexpectedDialog = true; await dialog.dismiss(); }
  };
  plan.page.on('dialog', handleDialog);
  try { await deleteItem.click(); }
  finally { plan.page.off('dialog', handleDialog); }
  if (unexpectedDialog) throw new Error('BITRIX_DELETE_CONFIRM_UNEXPECTED');
  await cell.locator('.timeman-grid-worktime-shift').waitFor({ state: 'detached', timeout: 15000 });
  await reloadPlan(plan);
  const refreshed = await openCell(plan, assignment);
  if ((await cellState(refreshed)).length !== 0) throw new Error('BITRIX_DELETE_NOT_CONFIRMED');
  console.log(`REPLACED_OLD_SHIFT ${assignment.bitrix_user_id} ${assignment.date}`);
  return refreshed;
}

async function verifyAssignment(plan, assignment, dryRun, job) {
  if (!/^\d+$/.test(assignment.bitrix_user_id) || !/^\d{4}-\d{2}-\d{2}$/.test(assignment.date)) {
    throw new Error('INVALID_JOB_TARGET');
  }
  let cell = await openCell(plan, assignment);
  let current = await cellState(cell);
  const replacement = approvedReplacement(job, assignment, current);
  if (assignment.day_type !== 'turno') {
    if (current.length && !replacement) throw new Error('BITRIX_NONWORK_CONFLICT');
    if (replacement && dryRun) return { assignment_id: assignment.id, status: 'would_replace', dry_run: true };
    if (replacement) cell = await deleteApprovedShift(plan, cell, assignment);
    return { assignment_id: assignment.id, status: 'verified' };
  }
  if (!assignment.shifts.length || assignment.shifts.some(shift => !shift.name)) {
    throw new Error('SHIFT_CATALOG_INCOMPLETE');
  }
  const unexpected = current.filter(actual => !assignment.shifts.some(desired => matches(actual, desired)));
  if (unexpected.length && !replacement) throw new Error('BITRIX_SHIFT_CONFLICT');
  let changed = replacement;
  if (replacement && !dryRun) {
    cell = await deleteApprovedShift(plan, cell, assignment);
    current = [];
  }
  let missingShift = false;
  for (const desired of assignment.shifts) {
    if (current.some(actual => matches(actual, desired))) continue;
    const candidates = cell.locator('[data-role="add-shiftplan-btn"]');
    const count = await candidates.count();
    const matchesByHint = [];
    for (let index = 0; index < count; index += 1) {
      const hint = await candidates.nth(index).getAttribute('data-hint');
      if (hint && hint.startsWith(`${expectedShiftName(desired)} (`)) matchesByHint.push(index);
    }
    if (matchesByHint.length !== 1) throw new Error('BITRIX_SHIFT_OPTION_NOT_UNIQUE');
    if (dryRun) { missingShift = true; continue; }
    await cell.hover();
    await candidates.nth(matchesByHint[0]).click({ timeout: 10000 });
    changed = true;
    await cell.locator('.timeman-grid-worktime-shift [data-role="name"]')
      .filter({ hasText: expectedShiftName(desired) })
      .waitFor({ state: 'visible', timeout: 15000 });
    current = await cellState(cell);
    if (!current.some(actual => matches(actual, desired))) throw new Error('BITRIX_SHIFT_WRITE_NOT_CONFIRMED');
  }
  if (dryRun) return { assignment_id: assignment.id,
    status: replacement ? 'would_replace' : missingShift ? 'would_add' : 'verified', dry_run: true };
  if (!changed && current.length === assignment.shifts.length) {
    return { assignment_id: assignment.id, status: 'verified' };
  }
  await reloadPlan(plan);
  const verifiedCell = await openCell(plan, assignment);
  const verified = await cellState(verifiedCell);
  if (verified.length !== assignment.shifts.length
      || assignment.shifts.some(desired => !verified.some(actual => matches(actual, desired)))) {
    throw new Error('BITRIX_SHIFT_RELOAD_MISMATCH');
  }
  return { assignment_id: assignment.id, status: 'verified' };
}

async function run() {
  const login = process.argv.includes('--login');
  const checkSession = process.argv.includes('--check-session');
  const dryRun = process.argv.includes('--dry-run');
  let token;
  let job;
  if (!login && !checkSession) {
    token = readToken();
    ({ job } = await api(token, 'GET'));
    if (!job) { console.log('NO_PENDING_JOB'); return; }
    if (job.blocked) {
      console.log(`BLOCKED ${job.week_id} v${job.version} ${job.blocked}`);
      if (!dryRun) await api(token, 'POST', { week_id: job.week_id, version: job.version,
        result: 'blocked', error: job.blocked, evidence: [] });
      return;
    }
  }
  const context = await chromium.launchPersistentContext(profilePath, {
    channel: 'chrome', headless: !login,
    viewport: { width: 1600, height: 900 },
    locale: 'en-US', timezoneId: 'Europe/Madrid'
  });
  try {
    const page = context.pages()[0] || await context.newPage();
    if (login) {
      await page.goto(`${bitrixUrl}/timeman/schedules/`, { waitUntil: 'domcontentloaded' });
      console.log('Cierra esta ventana al terminar de iniciar sesión en Bitrix.');
      await new Promise(resolve => context.on('close', resolve));
      return;
    }
    const plan = await openSchedule(page).catch(error => {
      console.error(`BITRIX_SESSION_OR_GRID_UNAVAILABLE ${error.message}`);
      return null;
    });
    if (!plan) {
      if (checkSession) process.exitCode = 2;
      return; // La solicitud permanece en cola para reintentar tras iniciar sesión.
    }
    if (checkSession) { console.log('BITRIX_SESSION_READY'); return; }
    if (!job || !Array.isArray(job.assignments)) {
      console.error('BITRIX_SESSION_OR_GRID_UNAVAILABLE');
      return;
    }
    const preflight = [];
    for (const assignment of job.assignments) {
      try {
        preflight.push(await verifyAssignment(plan, assignment, true, job));
      } catch (error) {
        preflight.push({ assignment_id: assignment.id, status: 'conflict' });
        console.error(`CONFLICT ${assignment.id} ${error.message}`);
        break;
      }
    }
    if (dryRun) { console.log(`DRY_RUN ${preflight.length}/${job.assignments.length}`); return; }
    if (preflight.length !== job.assignments.length || preflight.some(item => item.status === 'conflict')) {
      await api(token, 'POST', { week_id: job.week_id, version: job.version,
        result: 'error', error: 'BITRIX_PREFLIGHT_CONFLICT', evidence: preflight });
      console.log(`RESULT ${job.week_id} v${job.version} error`);
      return;
    }
    const evidence = [];
    for (const assignment of job.assignments) {
      try {
        evidence.push(await verifyAssignment(plan, assignment, false, job));
      } catch (error) {
        evidence.push({ assignment_id: assignment.id, status: 'conflict' });
        console.error(`WRITE_OR_VERIFY_FAILED ${assignment.id} ${error.message}`);
        break;
      }
    }
    const allVerified = evidence.length === job.assignments.length
      && evidence.every(item => item.status === 'verified');
    const absencePending = job.assignments.some(item =>
      ['ausencia', 'vacaciones', 'festivo'].includes(item.day_type));
    const result = !allVerified ? 'error' : absencePending ? 'partial' : 'verified_shifts';
    await api(token, 'POST', { week_id: job.week_id, version: job.version,
      result, error: allVerified ? null : 'BITRIX_SHIFT_CONFLICT', evidence });
    console.log(`RESULT ${job.week_id} v${job.version} ${result}`);
  } finally {
    await context.close().catch(() => {});
  }
}

run().catch(error => { console.error(`EXECUTOR_FAILED ${error.message}`); process.exitCode = 1; });
