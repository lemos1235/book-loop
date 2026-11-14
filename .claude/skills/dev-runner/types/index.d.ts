declare module 'claude-code' {
  interface PluginState {
    'dev-runner': {
      /** Whether the session's directory holds a package.json. */
      hasPackageJson: boolean;
      /** Whether the session's directory is a git repository. */
      isGitRepo: boolean;
      /** Whether the working tree has changes worth committing. */
      hasChanges: boolean;
      /** Whether `npm run dev` is running from this module. */
      isRunning: boolean;
      /** The latest non-empty line the command wrote. */
      lastOutput: string;
      /** Whether Claude was asked to format, check and commit. */
      isRequested: boolean;
    };
  }
}
