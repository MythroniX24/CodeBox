const inquirer = require('inquirer');
const chalk = require('chalk');
const ToolManager = require('../core/ToolManager');
const DependencyManager = require('../core/DependencyManager');
const ProjectManager = require('../projects/ProjectManager');
const os = require('os');

async function showDashboard() {
  const env = DependencyManager.detect();
  const tools = ToolManager.getTools();
  
  console.clear();
  console.log(chalk.cyan(`
╔════════════════════════════════╗
║          ⚡ CodeBox             ║
╠════════════════════════════════╣`));
  console.log(`║                                ║
║  System                        ║
║  Termux          ${env.termux ? chalk.green('✓') : chalk.red('✗')}             ║
║  Architecture    ${chalk.yellow(env.architecture.padEnd(14))}║
║  Node.js         ${env.node ? chalk.green('✓') : chalk.red('✗')}             ║
║  Python          ${env.python ? chalk.green('✓') : chalk.red('✗')}             ║
║  Git             ${env.git ? chalk.green('✓') : chalk.red('✗')}             ║
║                                ║
║  Coding Tools                  ║
║                                ║`);

  tools.forEach(tool => {
    const installed = ToolManager.isInstalled(tool);
    const status = installed ? chalk.green('✓ Installed') : chalk.dim('○ Available');
    console.log(`║  ${tool.name.padEnd(16)}${status.padEnd(23)}║`);
  });

  console.log(chalk.cyan(`╚════════════════════════════════╝\n`));

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Navigation',
    choices: [
      'Tools',
      'Projects',
      'Doctor',
      'Exit'
    ]
  }]);

  if (action === 'Tools') await showTools();
  else if (action === 'Projects') await showProjects();
  else if (action === 'Doctor') require('../cli/index').runDoctor();
  else process.exit(0);
}

async function showTools() {
  const tools = ToolManager.getTools();
  const choices = tools.map(t => ({
    name: `${t.name} ${ToolManager.isInstalled(t) ? chalk.green('(Installed)') : chalk.dim('(Available)')}`,
    value: t
  }));
  choices.push(new inquirer.Separator());
  choices.push({ name: 'Back', value: 'back' });

  const { selectedTool } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedTool',
    message: 'Select a tool to manage:',
    choices
  }]);

  if (selectedTool === 'back') return showDashboard();

  await showToolCard(selectedTool);
}

async function showToolCard(tool) {
  console.clear();
  const installed = ToolManager.isInstalled(tool);
  console.log(chalk.bold.cyan(`\n${tool.name}`));
  console.log(chalk.dim(tool.description));
  console.log(installed ? chalk.green('● Installed') : chalk.dim('○ Not Installed'));
  console.log('');

  const choices = [];
  if (installed) {
    choices.push('Open');
    choices.push('Update');
    choices.push('Remove');
  } else {
    choices.push('Install');
  }
  choices.push('Back');

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'Action:',
    choices
  }]);

  if (action === 'Back') return showTools();
  
  if (action === 'Install') {
    try {
      ToolManager.installTool(tool.id);
      console.log(chalk.green(`\n${tool.name} installed successfully!`));
    } catch (e) {
      console.error(chalk.red(`\nError: ${e.message}`));
    }
  } else if (action === 'Remove') {
    ToolManager.uninstallTool(tool.id);
    console.log(chalk.green(`\n${tool.name} removed.`));
  } else if (action === 'Update') {
    ToolManager.updateTool(tool.id);
    console.log(chalk.green(`\n${tool.name} updated.`));
  } else if (action === 'Open') {
    return await promptProjectLaunch(tool);
  }

  const { cont } = await inquirer.prompt([{ type: 'confirm', name: 'cont', message: 'Press enter to continue', default: true }]);
  return showToolCard(tool);
}

async function promptProjectLaunch(tool) {
  const recent = ProjectManager.getRecentProjects();
  const choices = recent.map(p => ({ name: `📁 ${p}`, value: p }));
  choices.push(new inquirer.Separator());
  choices.push({ name: '[ New Folder ]', value: 'new' });
  choices.push({ name: '[ Enter Path ]', value: 'enter' });
  choices.push({ name: 'Back', value: 'back' });

  const { target } = await inquirer.prompt([{
    type: 'list',
    name: 'target',
    message: `Recent Projects for ${tool.name}`,
    choices
  }]);

  if (target === 'back') return showToolCard(tool);

  let launchPath = target;

  if (target === 'new') {
    const { loc, folderName } = await inquirer.prompt([
      { type: 'input', name: 'loc', message: 'Location:', default: '~/projects/' },
      { type: 'input', name: 'folderName', message: 'Name:' }
    ]);
    launchPath = ProjectManager.createProject(loc, folderName);
  } else if (target === 'enter') {
    const { loc } = await inquirer.prompt([{ type: 'input', name: 'loc', message: 'Enter full path:' }]);
    let resolved = loc.startsWith('~/') ? require('path').join(os.homedir(), loc.slice(2)) : loc;
    if (!require('fs').existsSync(resolved)) {
      console.log(chalk.red(`Path does not exist: ${resolved}`));
      return promptProjectLaunch(tool);
    }
    launchPath = resolved;
    ProjectManager.addRecentProject(launchPath);
  }

  console.log(chalk.cyan(`\nOpening ${tool.name} in ${launchPath}...\n`));
  ToolManager.launchTool(tool.id, launchPath);
  
  // Return to dashboard after tool exits
  showDashboard();
}

async function showProjects() {
  console.clear();
  const recent = ProjectManager.getRecentProjects();
  console.log(chalk.bold.cyan(`\nRecent Projects`));
  if (recent.length === 0) console.log(chalk.dim('No recent projects.'));
  else recent.forEach(p => console.log(`📁 ${p}`));
  console.log('');
  
  const { cont } = await inquirer.prompt([{ type: 'confirm', name: 'cont', message: 'Press enter to return', default: true }]);
  showDashboard();
}

module.exports = { showDashboard };
