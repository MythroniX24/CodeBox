const fs = require('fs');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor() {
    this.configDir = path.join(os.homedir(), '.config', 'codebox');
    this.configFile = path.join(this.configDir, 'config.json');
    this.ensureConfig();
  }

  ensureConfig() {
    try {
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true });
      }
      if (!fs.existsSync(this.configFile)) {
        this.saveConfig({ recentProjects: [] });
      }
    } catch (e) {
      console.warn('Warning: Could not initialize config directory:', e.message);
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        return JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
      }
    } catch (err) {
      console.warn('Warning: Could not read config file:', err.message);
    }
    return { recentProjects: [] };
  }

  saveConfig(data) {
    try {
      fs.writeFileSync(this.configFile, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.warn('Warning: Could not save config file:', e.message);
    }
  }

  addRecentProject(projectPath) {
    const config = this.loadConfig();
    if (!config.recentProjects) config.recentProjects = [];
    config.recentProjects = config.recentProjects.filter(p => p !== projectPath);
    config.recentProjects.unshift(projectPath);
    if (config.recentProjects.length > 20) config.recentProjects.pop();
    this.saveConfig(config);
  }

  getRecentProjects() {
    return this.loadConfig().recentProjects || [];
  }

  removeRecentProject(projectPath) {
    const config = this.loadConfig();
    if (config.recentProjects) {
      config.recentProjects = config.recentProjects.filter(p => p !== projectPath);
      this.saveConfig(config);
    }
  }
}

module.exports = new ConfigManager();
