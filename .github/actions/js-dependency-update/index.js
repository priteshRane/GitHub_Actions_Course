const core = require('@actions/core');
const exec= require('@actions/exec');
const github = require('@actions/github');
const { GitHub } = require('@actions/github/lib/utils');

const setupGit = async () => {
    await exec.exec('git config --global user.name "gh-automation"');
    await exec.exec('git config --global user.email "gh-automation@gmail.com"');
}

const validateBranchName = ({branchName}) => /^[a-zA-Z0-9_\-\,\/]+$/.test(branchName);
const validateDirectoryName = ({branchName}) => /^[a-zA-Z0-9_\-\/]+$/.test(branchName);

const setupLogger = ({ debug, prefix } = { debug: false, prefix: ''}) => ({
    debug: (message) => {
        if (debug) {
            core.info(`DEBUG ${prefix}${prefix ? ' : ' : ''}${message}`);
            // extend the logging functionality
        }
    },
    info: (message) => {
        core.info(`${prefix}${prefix ? ' : ' : ''}${message}`);
    },
    error: (message) => {
        core.error(`${prefix}${prefix ? ' : ' : ''}${message}`);
    }
});

async function run() {
    const baseBranch = core.getInput('base-branch', {required: true});
    const headBranch = core.getInput('head-branch', {required: true});
    const ghToken = core.getInput('gh-token', {required: true});
    const workingDir = core.getInput('working-directory', {required: true})
    const debug = core.getBooleanInput('debug');
    const logger = setupLogger({debug, prefix: '[js-dependency-update]'})

    const commonExecOpts = {
        cwd: workingDir,
    }

    core.setSecret(ghToken);

    logger.debug('Validating inputs')

    if (validateBranchName({branchName: baseBranch})) {
        core.setFailed('Invalid base branch name')
        return;
    }

    if (validateBranchName({branchName: headBranch})) {
        core.setFailed('Invalid head branch name')
        return;
    }
    
    if (!validateDirectoryName({dirName: workingDir})) {
        core.setFailed('Invalid working dir')
        return;
    }

    logger.debug('base branch is: ${baseBranch}');
    logger.debug('base branch is: ${headBranch}');
    logger.debug('base branch is: ${workingDir}');

    logger.debug('Checking for updates')

    await exec.exec('npm update', [], {
        ...commonExecOpts
    });

    const gitStatus = await exec.getExecOutput('get status -s package.json', [], {
        ...commonExecOpts
    });

    if (gitStatus.stdout.length > 0) {
        logger.debug('There are updates available');
        logger.debug('Setting up git')
        setupGit()

        logger.debug('Commiting and pushing changes')
        await exec.exec('git checkout -b ${{headBranch}}', [], {
            ...commonExecOpts
        });
        await exec.exec('git add package.json package-lock.json', [], {
            ...commonExecOpts
        });
        await exec.exec('git commit -m "chore: update dependency"', [], {
            ...commonExecOpts
        });
        await exec.exec('git push -u origin ${headBranch} --force', [], {
            ...commonExecOpts
        });

        logger.debug('fetching octokit api')
        const octokit = github.getOctokit(ghToken);
        try {

            logger.debug('Creating PR using head branch')
            await octokit.rest.pulls.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: 'Update NPM Dependency',
                body: 'This pull updates npm packages',
                base: baseBranch,
                head: headBranch
            });
        } catch (e) {
            logger.error('error on the PR');
            logger.error(e.message);
            logger.error(e);
            core.setFailed(e.message);
        }
        
    } else {
        logger.info('No updates point in time');
    }


    /*
    1. Parse inputs:
        1.1 base-branch from which to check for updates
        1.2 head-branch to use to create the PR
        1.3 GitHub token for auth purpose
        1.4 working directory for which to check for dependencies
    2. Execute the npm update command within the working directory
    3. Check whether there are modified package.json files
    4. If there are modified files:
        4.1 Add and Commit files to the head-branch
        4.2 Create a PR to the base-branch using the octokit API
    5. Otherwise, conclude the custom action
    */
    logger.info('I am a custom JS action');
}

run();



