const core = require('@actions/core');
const exec= require('@actions/exec');

const validateBranchName = ({branchName}) => /^[a-zA-Z0-9_\-\,\/]+$/.test(branchName);
const validateDirectoryName = ({branchName}) => /^[a-zA-Z0-9_\-\/]+$/.test(branchName);

async function run() {
    const baseBranch = core.getInput('base-branch');
    const targetBranch = core.getInput('target-branch');
    const ghToken = core.getInput('gh-token');
    const workingDir = core.getInput('working-directory')
    const debug = core.getBooleanInput('debug')

    core.setSecret(ghToken);

    if (validateBranchName({branchName: baseBranch})) {
        core.setFailed('Invalid base branch name')
        return;
    }

    if (validateBranchName({branchName: targetBranch})) {
        core.setFailed('Invalid target branch name')
        return;
    }
    
    if (!validateDirectoryName({dirName: workingDir})) {
        core.setFailed('Invalid working dir')
        return;
    }

    core.info('base branch is: ${baseBranch}');
    core.info('base branch is: ${targetBranch}');
    core.info('base branch is: ${workingDir}');

    await exec.exec('npm update', [], {
        cwd: workingDir
    });

    const gitStatus = await exec.getExecOutput('get status -s package.json', [], {
        cwd: workingDir
    });

    if (gitStatus.stdout.length > 0) {
        core.info('There are updates available');
    } else {
        core.info('No updates point in time');
    }
    /*
    1. Parse inputs:
        1.1 base-branch from which to check for updates
        1.2 target-branch to use to create the PR
        1.3 GitHub token for auth purpose
        1.4 working directory for which to check for dependencies
    2. Execute the npm update command within the working directory
    3. Check whether there are modified package.json files
    4. If there are modified files:
        4.1 Add and Commit files to the target-branch
        4.2 Create a PR to the base-branch using the octokit API
    5. Otherwise, conclude the custom action
    */
    core.info('I am a custom JS action');
}

run();



