import { atom, read, update } from 'claude-code';
import type {
  EngineInterface,
  HookStream,
  ProcessSpawnChunk,
  ProcessSpawnResult,
  Register,
} from 'claude-code';

const hasPackageJson = atom({ plugin: 'dev-runner', key: 'hasPackageJson' } as const, false);
const isGitRepo = atom({ plugin: 'dev-runner', key: 'isGitRepo' } as const, false);
const hasChanges = atom({ plugin: 'dev-runner', key: 'hasChanges' } as const, false);
const isRunning = atom({ plugin: 'dev-runner', key: 'isRunning' } as const, false);
const lastOutput = atom({ plugin: 'dev-runner', key: 'lastOutput' } as const, '');
const isRequested = atom({ plugin: 'dev-runner', key: 'isRequested' } as const, false);

const COMMAND = 'npm run dev';
const ANSI = /\u001B\[[0-9;?]*[ -/]*[@-~]/g;

const COMMIT_PROMPT = [
  'Format, check and commit the current changes:',
  '- run `npm run format`, then `npm run check`; fix errors and re-run until it passes',
  "- commit with `git add -A && git commit`, using AGENTS.md's conventional format",
  '  `<type>(<scope>): <summary>`',
  'Only commit existing changes. If checks cannot pass, explain why and leave them uncommitted.',
  'Report the commit message when done.',
].join('\n');

/** The last non-empty line of a chunk, without ANSI escapes or carriage returns. */
function lastLine(text: string): string {
  const lines = text
    .replace(ANSI, '')
    .replaceAll('\r', '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines[lines.length - 1] ?? '';
}

// Guards a second press before the card redraws with `isRequested`.
let requesting = false;

/** Re-reads the working tree; a clean tree ends a pending commit request. */
// A function declaration: the engine lets `$` reach only one declared here.
async function syncChanges($: EngineInterface): Promise<void> {
  try {
    const status = await $.process.run(['git', 'status', '--porcelain'], {
      timeoutMs: 10_000,
    });
    if (status.exitCode !== 0) return;

    const dirty = status.stdout.trim().length > 0;
    if ((await read($, hasChanges)) !== dirty) {
      await update($, hasChanges, () => dirty);
    }

    if (!dirty) {
      requesting = false;
      if (await read($, isRequested)) {
        await update($, isRequested, () => false).catch(() => {});
      }
    }
  } catch {
    // git is gone, or the module is unloading
  }
}

export const register: Register = (on) => {
  // The running child, as this copy of the module knows it. A reload starts
  // the module over, and the engine kills the child the previous copy spawned.
  let child: HookStream<ProcessSpawnChunk, ProcessSpawnResult> | null = null;

  on('session.start', async ($, e, next) => {
    const [hasPackage, isRepo] = await Promise.all([
      $.fs.exists(`${e.cwd}/package.json`),
      $.fs.exists(`${e.cwd}/.git`),
    ]);

    await update($, hasPackageJson, () => hasPackage);
    await update($, isGitRepo, () => isRepo);
    // Any child of a previous copy of this module went with it.
    await update($, isRunning, () => false);
    await update($, lastOutput, () => '');
    await update($, isRequested, () => false);
    await update($, hasChanges, () => false);
    requesting = false;

    if (isRepo) {
      await syncChanges($);
      // Changes made elsewhere too (an editor, another terminal) reach the
      // button without a turn of ours.
      $.clock.every(5_000, () => {
        void syncChanges($);
      });
    }

    return next(e);
  });

  // The requested turn ended: let the button offer another request if the
  // working tree is still dirty.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined && requesting) {
      requesting = false;
      await update($, isRequested, () => false).catch(() => {});
      void syncChanges($);
    }

    return next(e);
  });

  // CLI only: the terminal surface. `$.process` is CLI only, so the row is
  // not drawn anywhere else (desktop, mobile, vscode).
  on('ui.render', { component: 'AbovePrompt', surface: 'terminal' }, async ($, e, next) => {
    const canRun = await read($, hasPackageJson);

    if (!canRun || e.props.hasSurvey) {
      return next(e);
    }

    const running = await read($, isRunning);
    const output = await read($, lastOutput);
    const requested = await read($, isRequested);
    const canCommit = await read($, isGitRepo);
    const dirty = await read($, hasChanges);
    const { Box, Button, Text } = $.ui.resolve(e);

    // A card narrower than the band, and never wider than it: the border and
    // the padding take four cells, the rest is the latest output, cut where
    // it no longer fits.
    const cardWidth = Math.min(64, Math.max(1, e.props.bodyColumns));
    const room = Math.max(8, cardWidth - 6);
    const shown = output.length > room ? `${output.slice(0, Math.max(1, room - 1))}…` : output;

    const toast = (text: string) => {
      try {
        $.ui.toast(text);
      } catch {
        // The module may have gone.
      }
    };

    const toggle = async () => {
      if (child !== null) {
        // Ending the loop is what kills the child.
        const stream = child;
        child = null;
        await update($, isRunning, () => false).catch(() => {});
        void stream.return({ code: null, signal: 'SIGTERM' }).catch(() => {});
        return;
      }

      const stream = $.process.spawn({ argv: COMMAND.split(' ') });

      child = stream;
      await update($, isRunning, () => true);
      await update($, lastOutput, () => '');

      let exit: ProcessSpawnResult | null = null;

      try {
        for await (const piece of stream) {
          const line = lastLine(piece.text);
          if (line.length > 0) {
            await update($, lastOutput, (current) => (current === line ? current : line));
          }
        }
        // Read on its own: a stream closed by our stop rejects here.
        exit = await stream.result.catch(() => null);
      } catch (error) {
        toast(`${COMMAND} 启动失败：${error instanceof Error ? error.message : String(error)}`);
      } finally {
        if (child === stream) {
          child = null;
          await update($, isRunning, () => false).catch(() => {});

          if (exit !== null) {
            toast(`${COMMAND} 已退出（${exit.code ?? exit.signal ?? '未知'}）`);
          }
        }
      }
    };

    const requestCommit = async () => {
      if (requesting) return;
      requesting = true;

      await update($, isRequested, () => true);

      try {
        await $.prompt.submit({ text: COMMIT_PROMPT });
        toast('已请 Claude 格式化、检查并提交');
      } catch (error) {
        requesting = false;
        await update($, isRequested, () => false).catch(() => {});
        toast(`提交请求发送失败：${error instanceof Error ? error.message : String(error)}`);
      }
    };

    return (
      <Box
        flexDirection="column"
        width={cardWidth}
        borderStyle="round"
        borderColor={running ? 'border-success' : 'border'}
        paddingX={1}>
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" gap={1}>
          <Box flexDirection="row" alignItems="center" gap={1}>
            <Text color={running ? 'text-success' : undefined} dimColor={!running}>
              {running ? '●' : '○'}
            </Text>
            <Text weight="semibold">开发服务器</Text>
            <Text dimColor>{COMMAND}</Text>
          </Box>
          <Box flexDirection="row" alignItems="center" gap={1}>
            <Button
              key="dev-runner-toggle"
              label={running ? '停止' : '启动'}
              variant={running ? 'secondary' : 'primary'}
              onPress={() => void toggle()}
            />
            {canCommit && (dirty || requested) && (
              <Button
                key="dev-runner-commit"
                label={requested ? '提交中…' : '提交'}
                variant="secondary"
                onPress={() => void requestCommit()}
              />
            )}
          </Box>
        </Box>
        {(requested || shown.length > 0) && (
          <Text dimColor>{requested ? '· 等待 Claude 完成检查与提交…' : shown}</Text>
        )}
      </Box>
    );
  });
};
