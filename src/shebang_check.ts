import * as fs from 'fs';
import * as path from 'path';

interface File {
  location: string;
  content: string;
  hasShebang: boolean;
  basename: string;
}

/** checks if a file has a shebang at the top, or if provided a package.json,
 * checks that all bin provided have shebangs, throws an error if they do not
 * have it, useful for testing within CI for npm packages and reliably asserting
 * that a executable file indeed has a shebang at the top. */
export class ShebangCheck {
  static pattern = /^#!(.*)/;
  static async readFile(location: string) {
    return await fs.promises.readFile(location, 'utf-8');
  }
  static async readJson(location: string) {
    const content = await ShebangCheck.readFile(location);
    return JSON.parse(content);
  }
  static joinDirname(location: string) {
    const dirname = path.dirname(location);
    return (p: string) => path.join(dirname, p);
  }
  static async binFiles(location: string) {
    if (path.extname(location) === '.json') {
      const joinDirname = ShebangCheck.joinDirname(location);
      const json = await ShebangCheck.readJson(location);
      if (!json.bin) return [];
      if (typeof json.bin === 'string') return [joinDirname(json.bin)];
      return Object.values(json.bin)
        .map(s => (typeof s === 'string' ? joinDirname(s) : ''))
        .filter(f => f);
    }
    return [location];
  }
  static async uniqueBinFiles(location: string) {
    return (await ShebangCheck.binFiles(location)).filter(
      (value, index, self) => self.indexOf(value) === index
    );
  }
  static async files(location: string) {
    const files = await ShebangCheck.uniqueBinFiles(location);
    return await Promise.all(
      files.map(async location => {
        const content = await ShebangCheck.readFile(location);
        const hasShebang = Boolean(content.match(ShebangCheck.pattern));
        const basename = path.basename(location);
        return {location, content, hasShebang, basename};
      })
    );
  }
  static async multiFile(...locations: string[]) {
    let results: File[] = [];
    await Promise.all(
      locations.map(async location => {
        const data = await ShebangCheck.files(location);
        results = [...results, ...data];
      })
    );
    return results;
  }
  static async check(...location: string[]) {
    const files = await ShebangCheck.multiFile(...location);
    if (!files.length) throw new Error(`file ${location} is missing shebang`);
    files.forEach(({basename, hasShebang}) => {
      if (!hasShebang) throw new Error(`file ${basename} is missing shebang`);
    });
  }
  static async cli(process: NodeJS.Process) {
    const locations = process.argv.slice(2);
    if (!locations.length) {
      process.stderr.write('no file passed in\n');
      return process.exit(1);
    }
    let code = 0;
    const files = await ShebangCheck.multiFile(...locations);
    if (!files.length) {
      const noun = locations.length === 1 ? ['file', 'is'] : ['files', 'are'];
      process.stderr.write(
        `${noun[0]} ${locations.join(', ')} ${noun[1]} missing shebang\n`
      );
      code = 1;
    }
    files.forEach(({basename, hasShebang}) => {
      if (hasShebang) {
        process.stdout.write(`file ${basename} has shebang\n`);
      } else {
        process.stderr.write(`file ${basename} is missing shebang\n`);
        code = 1;
      }
    });
    process.exit(code);
  }
}
