const core = require('@actions/core');
const github = require('@actions/github');


// most @actions toolkit packages have async methods
async function run() {
  try {
    const owner = core.getInput('owner');
    const repo = core.getInput('repo');
    const pr_number = core.getInput('pr_number');
    const token = core.getInput('token');

    const octokit = new github.getOctokit(token);

    const { data: changedFiles } = octokit.rest.pulls.listFiles({
      owner,
      repo,
      pr_number
    });

    let diffData = {
      addition: 0,
      deletions: 0,
      changes: 0
    }

    diffData = changedFiles.reduce((acc,file) => {
      acc.addition += file.addition;
      acc.deletions += file.deletions;
      acc.changes += file.changes;
      return acc;
    },diffData);

    await octokit.rest.issues.createcomment({
      owner,
      repo,
      issue_number: pr_number,
      body: `
        Pull request #${pr_number} has be updated with : \n
        - #${diffData.changes} changes \n
        - #${diffData.addition} addition \n
        - #${diffData.deletions} deletions
      `
    });

    for(const file of changedFiles){
      //readme.md
      //['readme','md']
      const fileExtension = file.filename.split('.').pop()
      let label = ''
      switch(fileExtension){
        case 'md':
          label = 'markdown'
          break;
        case 'js':
          label = 'Javascript'
          break;
        case 'yml':
          label = 'YAML'
          break;
        default:
          label = 'noextension'
          break;
      }
      await octokit.rest.issues.addLabel({
        owner,
        repo,
        issue_number: pr_number,
        labels: [label]
      })
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
