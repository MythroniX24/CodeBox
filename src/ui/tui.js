const blessed = require('blessed');
const ToolManager = require('../core/ToolManager');
const DependencyManager = require('../core/DependencyManager');
const ProjectManager = require('../projects/ProjectManager');

function renderTUI() {
  const screen = blessed.screen({
    smartCSR: true,
    title: 'CodeBox Manager',
    cursor: {
      artificial: true,
      shape: 'line',
      blink: true,
      color: null
    }
  });

  const header = blessed.box({
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: ' {bold}⚡ CodeBox - Termux Developer Tools Manager{/bold}',
    tags: true,
    style: {
      fg: 'white',
      bg: 'blue',
    },
    valign: 'middle'
  });

  const menu = blessed.list({
    top: 3,
    left: 0,
    width: '30%',
    height: '100%-3',
    items: ['Dashboard', 'Manage Tools', 'Recent Projects', 'System Doctor', 'Exit'],
    keys: true,
    vi: true,
    mouse: true,
    border: { type: 'line' },
    style: {
      selected: { bg: 'cyan', fg: 'black' },
      border: { fg: 'cyan' }
    }
  });

  const contentPanel = blessed.box({
    top: 3,
    left: '30%',
    width: '70%',
    height: '100%-3',
    content: 'Loading...',
    tags: true,
    border: { type: 'line' },
    style: {
      border: { fg: 'cyan' }
    }
  });

  screen.append(header);
  screen.append(menu);
  screen.append(contentPanel);

  function updateDashboard() {
    const env = DependencyManager.detect();
    const tools = ToolManager.getTools();
    let content = '{bold}System Status{/bold}\n\n';
    content += `Termux:       ${env.termux ? '{green-fg}✓{/green-fg}' : '{red-fg}✗{/red-fg}'}\n`;
    content += `Architecture: {yellow-fg}${env.architecture}{/yellow-fg}\n`;
    content += `Node.js:      ${env.node ? '{green-fg}✓{/green-fg}' : '{red-fg}✗{/red-fg}'}\n`;
    content += `Python:       ${env.python ? '{green-fg}✓{/green-fg}' : '{red-fg}✗{/red-fg}'}\n`;
    content += `Git:          ${env.git ? '{green-fg}✓{/green-fg}' : '{red-fg}✗{/red-fg}'}\n\n`;
    
    content += '{bold}Tools Overview{/bold}\n\n';
    tools.forEach(tool => {
      const installed = ToolManager.isInstalled(tool);
      content += `${tool.name.padEnd(16)}: ${installed ? '{green-fg}Installed{/green-fg}' : '{gray-fg}Available{/gray-fg}'}\n`;
    });
    
    contentPanel.setContent(content);
    screen.render();
  }

  function showToolsMenu() {
    const tools = ToolManager.getTools();
    const toolNames = tools.map(t => t.name);
    toolNames.push('Back');

    const toolMenu = blessed.list({
      top: 3,
      left: 0,
      width: '30%',
      height: '100%-3',
      items: toolNames,
      keys: true,
      vi: true,
      border: { type: 'line' },
      style: {
        selected: { bg: 'cyan', fg: 'black' },
        border: { fg: 'cyan' }
      }
    });

    screen.append(toolMenu);
    toolMenu.focus();

    toolMenu.on('select', (item, index) => {
      if (item.getText() === 'Back') {
        toolMenu.destroy();
        menu.focus();
        updateDashboard();
      } else {
        showToolActionMenu(tools[index]);
      }
    });

    toolMenu.on('item', (item, index) => {
      if (index < tools.length) {
        const t = tools[index];
        const installed = ToolManager.isInstalled(t);
        let info = `{bold}${t.name}{/bold}\n\n`;
        info += `${t.description}\n\n`;
        info += `Status: ${installed ? '{green-fg}● Installed{/green-fg}' : '{gray-fg}○ Not Installed{/gray-fg}'}\n\n`;
        info += `Command: ${t.command}\n`;
        info += `Package: ${t.installation.package}\n\n`;
        info += `Press ENTER to manage.`;
        contentPanel.setContent(info);
        screen.render();
      }
    });

    screen.render();
  }

  function showToolActionMenu(tool) {
    const installed = ToolManager.isInstalled(tool);
    const actions = installed ? ['Open Project', 'Update', 'Uninstall', 'Back'] : ['Install', 'Back'];
    
    const actionMenu = blessed.list({
      top: 'center',
      left: 'center',
      width: 40,
      height: actions.length + 2,
      items: actions,
      keys: true,
      vi: true,
      border: { type: 'line' },
      label: ` Action: ${tool.name} `,
      style: {
        selected: { bg: 'green', fg: 'black' },
        border: { fg: 'green' }
      }
    });

    screen.append(actionMenu);
    actionMenu.focus();
    screen.render();

    actionMenu.on('select', (item) => {
      const action = item.getText();
      actionMenu.destroy();
      screen.render();

      if (action === 'Install') {
        runActionInTerminal(`node -e "require('./src/core/ToolManager').installTool('${tool.id}')"`);
      } else if (action === 'Uninstall') {
        runActionInTerminal(`node -e "require('./src/core/ToolManager').uninstallTool('${tool.id}')"`);
      } else if (action === 'Update') {
        runActionInTerminal(`node -e "require('./src/core/ToolManager').updateTool('${tool.id}')"`);
      } else if (action === 'Open Project') {
         // Show project selection
         showProjectSelector(tool);
      } else {
         screen.render();
      }
    });
  }

  function showProjectSelector(tool) {
    const recent = ProjectManager.getRecentProjects();
    const items = ['Create New Folder'].concat(recent).concat(['Back']);

    const pMenu = blessed.list({
      top: 'center',
      left: 'center',
      width: '80%',
      height: '80%',
      items: items,
      keys: true,
      vi: true,
      border: { type: 'line' },
      label: ` Select Project for ${tool.name} `,
      style: {
        selected: { bg: 'yellow', fg: 'black' },
        border: { fg: 'yellow' }
      }
    });

    screen.append(pMenu);
    pMenu.focus();
    screen.render();

    pMenu.on('select', (item, index) => {
      pMenu.destroy();
      const txt = item.getText();
      if (txt === 'Back') {
        screen.render();
        return;
      }
      if (txt === 'Create New Folder') {
        // Need to prompt for path, for simplicity in TUI we'll run a CLI prompt script
        runActionInTerminal(`node -e "require('./src/ui/index').showDashboard()"`); // fallback to old UI temporarily
      } else {
        runActionInTerminal(`node -e "require('./src/core/ToolManager').launchTool('${tool.id}', '${txt}')"`);
      }
    });
  }

  function runActionInTerminal(cmd) {
    // To run a terminal action and return to TUI, we suspend TUI, run it, and resume.
    screen.leave();
    const { execSync } = require('child_process');
    try {
      execSync(cmd, { stdio: 'inherit' });
    } catch (e) {
      console.log('Action failed or was cancelled.');
    }
    console.log('\nPress any key to return to CodeBox...');
    execSync('read -n 1 -s', { stdio: 'inherit', shell: true });
    screen.enter();
    screen.render();
  }

  menu.on('select', (item) => {
    const selection = item.getText();
    if (selection === 'Exit') {
      return process.exit(0);
    }
    if (selection === 'Dashboard') {
      updateDashboard();
    }
    if (selection === 'Manage Tools') {
      showToolsMenu();
    }
    if (selection === 'Recent Projects') {
      const recent = ProjectManager.getRecentProjects();
      let content = '{bold}Recent Projects{/bold}\n\n';
      recent.forEach(p => content += `📁 ${p}\n`);
      contentPanel.setContent(content);
      screen.render();
    }
    if (selection === 'System Doctor') {
      screen.leave();
      require('../cli/index').runDoctor();
      console.log('\nPress any key to return to CodeBox...');
      require('child_process').execSync('read -n 1 -s', { stdio: 'inherit', shell: true });
      screen.enter();
      screen.render();
    }
  });

  menu.key(['q', 'C-c'], () => process.exit(0));

  menu.focus();
  updateDashboard();
}

module.exports = { renderTUI };
