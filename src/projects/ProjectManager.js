const fs = require('fs');
const path = require('path');
const os = require('os');
const ConfigManager = require('../core/ConfigManager');

class ProjectManager {
  constructor() {
    this.defaultProjectsDir = path.join(os.homedir(), 'projects');
  }

  getRecentProjects() {
    return ConfigManager.getRecentProjects();
  }

  addRecentProject(projectPath) {
    ConfigManager.addRecentProject(projectPath);
  }

  removeRecentProject(projectPath) {
    ConfigManager.removeRecentProject(projectPath);
  }

  createProject(location, name) {
    // Resolve ~ if present
    if (location.startsWith('~/')) {
      location = path.join(os.homedir(), location.slice(2));
    }
    
    const fullPath = path.resolve(location, name);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    this.addRecentProject(fullPath);
    return fullPath;
  }
}

module.exports = new ProjectManager();
