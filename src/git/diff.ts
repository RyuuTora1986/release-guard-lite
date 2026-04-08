import { simpleGit, type DiffResultTextFile } from "simple-git";

export interface ChangedFile {
  path: string;
  insertions: number;
  deletions: number;
  binary: boolean;
}

export interface DiffResult {
  currentBranch: string;
  baseBranch: string;
  files: ChangedFile[];
  totalInsertions: number;
  totalDeletions: number;
}

export async function getFileDiff(
  baseBranch: string,
  cwd?: string
): Promise<DiffResult> {
  const git = simpleGit(cwd ?? process.cwd());

  // Verify we are in a git repo
  const isRepo = await git.checkIsRepo();
  if (!isRepo) {
    throw new Error(
      "Not a git repository. Run this command from inside a git project."
    );
  }

  // Get current branch name
  const currentBranch = (await git.revparse(["--abbrev-ref", "HEAD"])).trim();

  // Check that baseBranch exists
  try {
    await git.revparse(["--verify", baseBranch]);
  } catch {
    throw new Error(
      `Base branch "${baseBranch}" not found. ` +
        `Make sure it exists locally or run "git fetch" first.`
    );
  }

  // Get diff summary between baseBranch and HEAD
  const diff = await git.diffSummary([`${baseBranch}...HEAD`]);

  const files: ChangedFile[] = diff.files.map((file) => {
    const isText = !("before" in file && "after" in file);
    if (isText) {
      const textFile = file as DiffResultTextFile;
      return {
        path: textFile.file,
        insertions: textFile.insertions,
        deletions: textFile.deletions,
        binary: false,
      };
    }
    return {
      path: file.file,
      insertions: 0,
      deletions: 0,
      binary: true,
    };
  });

  return {
    currentBranch,
    baseBranch,
    files,
    totalInsertions: diff.insertions,
    totalDeletions: diff.deletions,
  };
}
