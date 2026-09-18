const { execSync } = require('child_process');
const os = require('os');

class DependencyManager {
  isTermux() {
    return process.env.PREFIX && process.env.PREFIX.includes('com.termux');
  }

  getArchitecture() {
    return os.arch();
  }

  getNormalizedArchitecture() {
    const arch = this.getArchitecture();
    if (arch === 'arm64') return 'aarch64';
    if (arch === 'arm') return 'armv7l';
    if (arch === 'x32') return 'i686';
    if (arch === 'x64') return 'x86_64';
    return arch;
  }

  hasCommand(cmd) {
    if (!/^[a-zA-Z0-9_-]+$/.test(cmd)) return false; // Sanitize input
    try {
      execSync(`command -v ${cmd}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  detect() {
    return {
      termux: !!this.isTermux(),
      architecture: this.getNormalizedArchitecture(),
      node: this.hasCommand('node'),
      npm: this.hasCommand('npm'),
      python: this.hasCommand('python'),
      git: this.hasCommand('git')
    };
  }

  install(pkg) {
    if (!/^[a-zA-Z0-9_-]+$/.test(pkg)) throw new Error('Invalid package name');
    if (!this.isTermux()) {
      throw new Error(`Cannot automatically install ${pkg} outside of Termux.`);
    }
    console.log(`Installing ${pkg} via pkg...`);
    try {
      execSync(`pkg install -y ${pkg}`, { stdio: 'inherit' });
    } catch (e) {
      console.error(`Failed to install ${pkg}: ${e.message}`);
    }
  }

  verify(dependencies) {
    for (const dep of dependencies) {
      if (dep === 'node' || dep === 'npm') {
        if (!this.hasCommand('node')) this.install('nodejs');
      } else if (dep === 'python') {
        if (!this.hasCommand('python')) this.install('python');
      } else if (dep === 'git') {
        if (!this.hasCommand('git')) this.install('git');
      }
    }
  }
}

module.exports = new DependencyManager();
