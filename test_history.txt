Failed to retrieve history: Command failed: git log -p -n 12 src/components/LibraryMap.tsx
fatal: not a git repository (or any of the parent directories): .git

Error: Command failed: git log -p -n 12 src/components/LibraryMap.tsx
fatal: not a git repository (or any of the parent directories): .git

    at genericNodeError (node:internal/errors:983:15)
    at wrappedFn (node:internal/errors:537:14)
    at checkExecSyncError (node:child_process:916:11)
    at execSync (node:child_process:988:15)
    at <anonymous> (/app/applet/src/git_history.ts:5:18)
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)