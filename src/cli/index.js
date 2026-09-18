const { program } = require('commander');
const ToolManager = require('../core/ToolManager');
const DependencyManager = require('../core/DependencyManager');
const ui = require('../ui/index');
const chalk = require('chalk');

function runDoctor() {
  console.log(chalk.bold.cyan('\nCodeBox Doctor\n'));
  const env = DependencyManager.detect();
  
  console.log(`${env.termux ? chalk.green('✓') : chalk.red('✗')} Termux`);
  console.log(`${chalk.green('✓')} PATH`);
  console.log(`${chalk.green('✓')} Architecture: ${env.architecture}`);
  console.log(`${env.git ? chalk.green('✓') : chalk.red('✗')} Git`);
  console.log(`${env.node ? chalk.green('✓') : chalk.red('✗')} Node.js`);
  console.log(`${env.npm ? chalk.green('✓') : chalk.red('✗')} npm`);
  
  console.log('\nTools:');
  const tools = ToolManager.getTools();
  tools.forEach(tool => {
    const installed = ToolManager.isInstalled(tool);
    console.log(`${installed ? chalk.green('✓') : chalk.red('✗')} ${tool.name}`);
  });
  console.log('');
}

program
  .name('codebox')
  .description('CodeBox CLI Tool Manager')
  .version('1.0.0');

program
  .command('list')
  .description('List available tools')
  .action(() => {
    const tools = ToolManager.getTools();
    console.log(chalk.cyan('Available Tools:'));
    tools.forEach(tool => {
      const status = ToolManager.isInstalled(tool) ? chalk.green('[Installed]') : chalk.dim('[Not Installed]');
      console.log(`${status} ${tool.name} (${tool.id})`);
    });
  });

program
  .command('install <tool>')
  .description('Install a tool')
  .action((tool) => {
    try {
      ToolManager.installTool(tool);
    } catch (e) {
      console.error(chalk.red(e.message));
    }
  });

program
  .command('uninstall <tool>')
  .description('Uninstall a tool')
  .action((tool) => {
    try {
      ToolManager.uninstallTool(tool);
    } catch (e) {
      console.error(chalk.red(e.message));
    }
  });

program
  .command('update [tool]')
  .description('Update CodeBox or a specific tool')
  .action((tool) => {
    if (tool) {
      try {
        ToolManager.updateTool(tool);
      } catch (e) {
        console.error(chalk.red(e.message));
      }
    } else {
      console.log('Updating CodeBox and all tools...');
      // Logic for updating all tools
    }
  });

program
  .command('doctor')
  .description('Diagnose environment issues')
  .action(runDoctor);

program
  .command('status')
  .description('Show system and tool status')
  .action(runDoctor);

program
  .command('open <tool>')
  .description('Launch a tool')
  .action((tool) => {
    ui.showToolCard(ToolManager.getTool(tool));
  });

program
  .command('projects')
  .description('List recent projects')
  .action(() => {
    const ProjectManager = require('../projects/ProjectManager');
    const recent = ProjectManager.getRecentProjects();
    if (recent.length === 0) console.log('No recent projects.');
    else recent.forEach(p => console.log(p));
  });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  require("../ui/tui").renderTUI();
}

module.exports = { runDoctor };
