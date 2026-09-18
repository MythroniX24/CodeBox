const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const DependencyManager = require('./DependencyManager');

class ToolManager {
  constructor() {
    this.toolsDir = path.join(__dirname, '..', '..', 'tools');
  }

  getTools() {
    const tools = [];
    try {
      if (!fs.existsSync(this.toolsDir)) return tools;
      const folders = fs.readdirSync(this.toolsDir);
      for (const folder of folders) {
        const manifestPath = path.join(this.toolsDir, folder, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            tools.push(manifest);
          } catch (err) {
            console.error(`Error parsing manifest for ${folder}:`, err.message);
          }
        }
      }
    } catch (e) {
      console.error('Failed to read tools directory:', e.message);
    }
    return tools;
  }

  getTool(id) {
    return this.getTools().find(t => t.id === id);
  }

  isInstalled(tool) {
    return DependencyManager.hasCommand(tool.command);
  }

  checkCompatibility(tool) {
    const arch = DependencyManager.getNormalizedArchitecture();
    if (tool.architectures && !tool.architectures.includes(arch)) {
      return { compatible: false, reason: `Architecture ${arch} not supported.` };
    }
    if (tool.compatibility && tool.compatibility.termux && !DependencyManager.isTermux()) {
      console.warn(`Warning: ${tool.name} expects a Termux environment, but you are not in Termux.`);
    }
    return { compatible: true };
  }

  installTool(id) {
    const tool = this.getTool(id);
    if (!tool) throw new Error(`Tool ${id} not found.`);

    console.log(`\n────────────────────────`);
    console.log(`Installing ${tool.name}`);
    console.log(`────────────────────────\n`);
    console.log(`✓ Checking Termux... ${DependencyManager.isTermux() ? 'Yes' : 'No'}`);
    
    const compat = this.checkCompatibility(tool);
    if (!compat.compatible) throw new Error(`Unsupported on this device: ${compat.reason}`);
    
    console.log(`✓ Checking architecture... ${DependencyManager.getNormalizedArchitecture()}`);
    if (tool.dependencies) {
      console.log(`✓ Checking dependencies...`);
      DependencyManager.verify(tool.dependencies);
    }

    if (tool.installation.type === 'npm') {
      console.log(`\nInstalling ${tool.name} via npm...`);
      const args = ['install', ...tool.installation.args, tool.installation.package];
      const result = spawnSync('npm', args, { stdio: 'inherit' });
      if (result.error || result.status !== 0) throw new Error(`Installation failed.`);
      console.log(`✓ Package installed`);
    } else {
      throw new Error(`Installation type ${tool.installation.type} not supported yet.`);
    }

    console.log(`Verifying executable...`);
    if (this.isInstalled(tool)) {
      console.log(`✓ ${tool.command} found\nInstallation successful.`);
    } else {
      throw new Error(`Executable ${tool.command} not found after installation.`);
    }
  }

  uninstallTool(id) {
    const tool = this.getTool(id);
    if (!tool) throw new Error(`Tool ${id} not found.`);
    if (tool.installation.type === 'npm') {
      console.log(`Uninstalling ${tool.name}...`);
      const args = ['uninstall', ...tool.installation.args, tool.installation.package];
      spawnSync('npm', args, { stdio: 'inherit' });
      console.log(`✓ Uninstalled`);
    }
  }

  updateTool(id) {
    const tool = this.getTool(id);
    if (!tool) throw new Error(`Tool ${id} not found.`);
    if (tool.installation.type === 'npm') {
      console.log(`Updating ${tool.name}...`);
      const args = ['update', ...tool.installation.args, tool.installation.package];
      spawnSync('npm', args, { stdio: 'inherit' });
      console.log(`✓ Updated`);
    }
  }

  launchTool(id, cwd) {
    const tool = this.getTool(id);
    if (!tool) throw new Error(`Tool ${id} not found.`);
    if (!this.isInstalled(tool)) throw new Error(`${tool.name} is not installed.`);

    console.log(`Launching ${tool.name} in ${cwd}...`);
    const child = spawnSync(tool.command, [], {
      cwd: cwd,
      stdio: 'inherit',
      env: process.env,
      shell: false
    });
    
    if (child.error) {
      console.error(`Failed to launch ${tool.command}:`, child.error.message);
    }
  }
}

module.exports = new ToolManager();
