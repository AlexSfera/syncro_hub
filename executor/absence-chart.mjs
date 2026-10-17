import { absenceDefinition, bitrixDate, classifyAbsence, parseAbsenceEntry } from './absence-policy.mjs';

const bitrixUrl = 'https://syncrosfera.bitrix24.eu';
const departmentLabel = 'Recepción SyncroLab y clínica';

function monthOf(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) throw new Error('INVALID_ABSENCE_DATE');
  return date.slice(0, 7);
}

async function readVisibleEntries(page) {
  const raw = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('tr[id^="bx_calendar_user_"]')]
      .map(element => ({ userId: element.id.replace('bx_calendar_user_', ''),
        top: element.getBoundingClientRect().top }));
    return [...document.querySelectorAll('.bx-calendar-entry')].map(element => {
      const top = element.getBoundingClientRect().top;
      const matching = rows.filter(row => Math.abs(row.top - top) < 2);
      return { userId: matching.length === 1 ? matching[0].userId : '',
        text: element.textContent.trim(), testId: element.getAttribute('data-testid') || '' };
    });
  });
  const parsed = raw.map(parseAbsenceEntry);
  if (parsed.some(item => !item || !item.start || !item.end)) throw new Error('BITRIX_ABSENCE_CHART_UNPARSEABLE');
  return parsed;
}

export async function openAbsenceChart(context, assignments) {
  const page = await context.newPage();
  const chart = { page, month: null, entries: [], assignments };
  await ensureMonth(chart, assignments[0]);
  return chart;
}

async function ensureMonth(chart, assignment, reload = false) {
  const month = monthOf(assignment.date);
  if (!reload && chart.month === month) return;
  const [year, number] = month.split('-').map(Number);
  const [from, to] = await chart.page.evaluate(({ year, number }) => [
    new Date(year, number - 1, 1).getTime(), new Date(year, number, 1).getTime()
  ], { year, number });
  await chart.page.goto(`${bitrixUrl}/timeman/#AP:month|${from}|${to}`, {
    waitUntil: 'domcontentloaded', timeout: 30000
  });
  const department = chart.page.getByRole('combobox', { name: 'Department:' });
  await department.waitFor({ state: 'visible', timeout: 30000 });
  const selected = await department.locator('option:checked').textContent();
  if (String(selected || '').trim() !== departmentLabel) {
    await department.selectOption({ label: departmentLabel });
  }
  await chart.page.getByText('This view does not display absences shorter than a day.')
    .waitFor({ state: 'visible', timeout: 30000 });
  for (const item of chart.assignments.filter(value => monthOf(value.date) === month)) {
    await chart.page.locator(`tr#bx_calendar_user_${item.bitrix_user_id}`)
      .waitFor({ state: 'visible', timeout: 30000 });
  }
  chart.entries = await readVisibleEntries(chart.page);
  chart.month = month;
}

export async function checkAbsence(chart, assignment) {
  await ensureMonth(chart, assignment);
  return classifyAbsence(assignment, chart.entries);
}

export async function createAndVerifyAbsence(chart, assignment) {
  const definition = absenceDefinition(assignment.day_type);
  if (!definition || !/^\d+$/.test(assignment.bitrix_user_id)
      || !assignment.employee_name) throw new Error('INVALID_ABSENCE_TARGET');
  // Una segunda lectura del servidor justo antes del alta reduce duplicados
  // si alguien ha añadido el mismo día desde el preflight.
  await ensureMonth(chart, assignment, true);
  const before = classifyAbsence(assignment, chart.entries);
  if (before === 'verified') return;
  if (before !== 'missing') throw new Error('BITRIX_ABSENCE_CONFLICT');

  await chart.page.getByRole('button', { name: 'Add Entry' }).click();
  const form = chart.page.locator('#BXAbsence');
  await form.waitFor({ state: 'visible', timeout: 10000 });
  await form.locator('#single-user-choice').click();
  const picker = chart.page.locator('#single-employee-popup');
  const search = picker.locator('input.finder-box-search-textbox');
  await search.fill(assignment.employee_name);
  await search.press('Enter');
  const choice = picker.locator('.finder-box-tab-content-selected .finder-box-item')
    .filter({ has: picker.locator(`input[value="${assignment.bitrix_user_id}"]`) });
  await choice.waitFor({ state: 'visible', timeout: 15000 });
  if (await choice.count() !== 1) throw new Error('BITRIX_ABSENCE_USER_NOT_UNIQUE');
  await choice.click();
  if (await form.locator('#user_id').inputValue() !== assignment.bitrix_user_id) {
    throw new Error('BITRIX_ABSENCE_USER_MISMATCH');
  }
  await form.locator('#absence_type').selectOption(definition.category);
  await form.locator('#NAME').fill(`${definition.label} — SYNCRO SHIFT`);
  await form.locator('#ACTIVE_FROM').fill(bitrixDate(assignment.date));
  await form.locator('#ACTIVE_TO').fill(bitrixDate(assignment.date));
  await form.locator('.popup-window-button-accept').click();
  await form.waitFor({ state: 'hidden', timeout: 15000 });
  await ensureMonth(chart, assignment, true);
  if (classifyAbsence(assignment, chart.entries) !== 'verified') {
    throw new Error('BITRIX_ABSENCE_WRITE_NOT_CONFIRMED');
  }
}
