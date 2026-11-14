import { expect, test } from 'claude-code/testing';

const BAND = {
  plugin: 'dev-runner',
  component: 'AbovePrompt',
  surface: 'terminal',
  props: {
    hasSurvey: false,
    isCollapsed: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const;

const clean = {
  exitCode: 0,
  stdout: '',
  stderr: '',
  isStdoutTruncated: false,
  isStderrTruncated: false,
};
const dirty = { ...clean, stdout: ' M src/app.css\n' };

test('the band offers both buttons in a dirty repository', async ($, on) => {
  on('fs.exists', () => ({ value: true }));
  on('process.run', () => ({ value: dirty }));
  on('session.start', (_, e) => ({ cwd: e.cwd }));

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true });

  const ui = await $.ui.mount({ ...BAND });
  const run = await ui.find({ key: 'dev-runner-toggle' });
  const commit = await ui.find({ key: 'dev-runner-commit' });

  expect(run?.text).toContain('启动');
  expect(commit?.text).toContain('提交');
  await ui.unmount();
});

test('the band is CLI only, so other surfaces draw nothing', async ($, on) => {
  on('fs.exists', () => ({ value: true }));
  on('process.run', () => ({ value: dirty }));
  on('session.start', (_, e) => ({ cwd: e.cwd }));

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true });

  for (const surface of ['desktop', 'mobile', 'vscode'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface });

    expect(await ui.find({ key: 'dev-runner-toggle' })).toBeUndefined();
    expect(await ui.find({ key: 'dev-runner-commit' })).toBeUndefined();
    await ui.unmount();
  }
});

test('a press asks the agent to format, check and commit', async ($, on) => {
  let asked = '';

  on('fs.exists', () => ({ value: true }));
  on('process.run', () => ({ value: dirty }));
  on('prompt.submit', (_, e) => {
    asked = e.text;
    return { text: e.text };
  });
  on('session.start', (_, e) => ({ cwd: e.cwd }));

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true });

  const ui = await $.ui.mount({ ...BAND });
  await ui.press({ key: 'dev-runner-commit' });

  expect(asked).toContain('npm run format');
  expect(asked).toContain('npm run check');
  expect(asked).toContain('git commit');
  await ui.unmount();
});

test('the commit button waits for a change to commit', async ($, on) => {
  on('fs.exists', () => ({ value: true }));
  on('process.run', () => ({ value: clean }));
  on('session.start', (_, e) => ({ cwd: e.cwd }));

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true });

  const ui = await $.ui.mount({ ...BAND });

  expect(await ui.find({ key: 'dev-runner-toggle' })).toBeDefined();
  expect(await ui.find({ key: 'dev-runner-commit' })).toBeUndefined();
  await ui.unmount();
});

test('the commit button waits for a git repository', async ($, on) => {
  on('fs.exists', (_, e) => ({ value: e.path.endsWith('package.json') }));
  on('session.start', (_, e) => ({ cwd: e.cwd }));

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true });

  const ui = await $.ui.mount({ ...BAND });

  expect(await ui.find({ key: 'dev-runner-toggle' })).toBeDefined();
  expect(await ui.find({ key: 'dev-runner-commit' })).toBeUndefined();
  await ui.unmount();
});

test('the band stays empty without a package.json', async ($, on) => {
  on('fs.exists', () => ({ value: false }));
  on('session.start', (_, e) => ({ cwd: e.cwd }));

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true });

  const ui = await $.ui.mount({ ...BAND });

  expect(await ui.find({ key: 'dev-runner-toggle' })).toBeUndefined();
  await ui.unmount();
});

test('a survey holds the band, so the buttons wait', async ($, on) => {
  on('fs.exists', () => ({ value: true }));
  on('process.run', () => ({ value: dirty }));
  on('session.start', (_, e) => ({ cwd: e.cwd }));

  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true });

  const ui = await $.ui.mount({
    ...BAND,
    props: { ...BAND.props, hasSurvey: true },
  });

  expect(await ui.find({ key: 'dev-runner-toggle' })).toBeUndefined();
  expect(await ui.find({ key: 'dev-runner-commit' })).toBeUndefined();
  await ui.unmount();
});
