import {expect} from 'chai';
import * as sinon from 'sinon';
import {ShebangCheck} from './shebang_check';
import * as fs from 'fs';

describe('ShebangCheck', () => {
  let readFileStub: sinon.SinonStub;
  afterEach(() => {
    sinon.restore();
  });
  context('.readFile()', () => {
    beforeEach(() => {
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves('');
    });
    it('should test readFile', async () => {
      const result = await ShebangCheck.readFile('./example.txt');
      expect(result).to.equal('');
      expect(readFileStub.calledOnce).to.equal(true);
      expect(readFileStub.args).to.deep.equal([['./example.txt', 'utf-8']]);
    });
  });
  context('.readJson()', () => {
    const JSON_FILE = JSON.stringify({foo: 'bar'});
    beforeEach(() => {
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON_FILE);
    });
    it('should test readJson', async () => {
      const result = await ShebangCheck.readJson('./example.json');
      expect(result).to.deep.equal(JSON.parse(JSON_FILE));
      expect(readFileStub.calledOnce).to.equal(true);
      expect(readFileStub.args).to.deep.equal([['./example.json', 'utf-8']]);
    });
  });
  context('.binFiles()', () => {
    it('should test json where bin is string', async () => {
      const JSON_FILE = JSON.stringify({bin: './example.js'});
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON_FILE);
      const result = await ShebangCheck.binFiles('./example.json');
      expect(result).to.deep.equal(['example.js']);
      expect(readFileStub.calledOnce).to.equal(true);
      sinon.restore();
    });
    it('should test json where bin is object', async () => {
      const JSON_FILE = JSON.stringify({bin: {example: './example.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON_FILE);
      const result = await ShebangCheck.binFiles('./example.json');
      expect(result).to.deep.equal(['example.js']);
      expect(readFileStub.calledOnce).to.equal(true);
      sinon.restore();
    });
    it('should test json where bin is missing', async () => {
      const JSON_FILE = JSON.stringify({});
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON_FILE);
      const result = await ShebangCheck.binFiles('./example.json');
      expect(result).to.deep.equal([]);
      expect(readFileStub.calledOnce).to.equal(true);
      sinon.restore();
    });
    it('should test json where bin is empty', async () => {
      const JSON_FILE = JSON.stringify({bin: {}});
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON_FILE);
      const result = await ShebangCheck.binFiles('./example.json');
      expect(result).to.deep.equal([]);
      expect(readFileStub.calledOnce).to.equal(true);
      sinon.restore();
    });
    it('should test json where bin is multi-object', async () => {
      const JSON_FILE = JSON.stringify({
        bin: {foo: './foo.js', bar: './bar.js'},
      });
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON_FILE);
      const result = await ShebangCheck.binFiles('./example.json');
      expect(result).to.deep.equal(['foo.js', 'bar.js']);
      expect(readFileStub.calledOnce).to.equal(true);
      sinon.restore();
    });
    it('should test js file', async () => {
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves('');
      const result = await ShebangCheck.binFiles('./example.js');
      expect(result).to.deep.equal(['./example.js']);
      expect(readFileStub.calledOnce).to.equal(false);
      sinon.restore();
    });
  });
  context('.uniqueBinFiles()', () => {
    it('should test json where bin is multi-object', async () => {
      const JSON_FILE = JSON.stringify({
        bin: {foo: './foo.js', bar: './foo.js'},
      });
      readFileStub = sinon.stub(fs.promises, 'readFile').resolves(JSON_FILE);
      const result = await ShebangCheck.uniqueBinFiles('./example.json');
      expect(result).to.deep.equal(['foo.js']);
      expect(readFileStub.calledOnce).to.equal(true);
      sinon.restore();
    });
  });
  context('.files()', () => {
    it('should test empty file', async () => {
      const JSON_FILE = JSON.stringify({bin: {foo: './foo.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves(JSON_FILE);
      readFileStub.onCall(1).returns('');
      const result = await ShebangCheck.files('./example.json');
      expect(result).to.deep.equal([
        {
          location: 'foo.js',
          content: '',
          hasShebang: false,
          basename: 'foo.js',
        },
      ]);
      sinon.restore();
    });
    it('should test valid file', async () => {
      const JSON_FILE = JSON.stringify({bin: {foo: './foo.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves(JSON_FILE);
      readFileStub
        .onCall(1)
        .returns('#!/usr/bin/env node\n console.log("hello")');
      const result = await ShebangCheck.files('./example.json');
      expect(result).to.deep.equal([
        {
          location: 'foo.js',
          content: '#!/usr/bin/env node\n console.log("hello")',
          hasShebang: true,
          basename: 'foo.js',
        },
      ]);
      sinon.restore();
    });
  });
  context('.multiFile()', () => {
    it('should test empty files', async () => {
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves('');
      readFileStub.onCall(1).returns('');
      const result = await ShebangCheck.multiFile('./foo.js', './bar.js');
      expect(result).to.deep.equal([
        {
          location: './foo.js',
          content: '',
          hasShebang: false,
          basename: 'foo.js',
        },
        {
          location: './bar.js',
          content: '',
          hasShebang: false,
          basename: 'bar.js',
        },
      ]);
      sinon.restore();
    });
    it('should test multi file', async () => {
      const JSON_FILE = JSON.stringify({bin: {foo: './foo.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves(JSON_FILE);
      readFileStub
        .onCall(1)
        .returns('#!/usr/bin/env node\n console.log("bar")');
      readFileStub
        .onCall(2)
        .returns('#!/usr/bin/env node\n console.log("foo")');
      const result = await ShebangCheck.multiFile('./foo.json', './bar.js');
      expect(result).to.deep.equal([
        {
          location: './bar.js',
          content: '#!/usr/bin/env node\n console.log("bar")',
          hasShebang: true,
          basename: 'bar.js',
        },
        {
          location: 'foo.js',
          content: '#!/usr/bin/env node\n console.log("foo")',
          hasShebang: true,
          basename: 'foo.js',
        },
      ]);
      sinon.restore();
    });
  });
  context('.check()', () => {
    it('should throw', async () => {
      const JSON_FILE = JSON.stringify({bin: {foo: './foo.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves(JSON_FILE);
      readFileStub.onCall(1).returns('');
      let error;
      try {
        await ShebangCheck.check('./example.json');
      } catch (e) {
        error = e;
      }
      expect(error).to.not.equal(undefined);
      sinon.restore();
    });
    it('should not throw', async () => {
      const JSON_FILE = JSON.stringify({bin: {foo: './foo.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves(JSON_FILE);
      readFileStub
        .onCall(1)
        .returns('#!/usr/bin/env node\n console.log("hello")');
      let error;
      let result;
      try {
        result = await ShebangCheck.check('./example.json');
      } catch (e) {
        // noop
      }
      expect(result).to.equal(undefined);
      expect(error).to.equal(undefined);
      sinon.restore();
    });
  });
  context('.cli()', () => {
    it('should return exit code with 1 [missing file]', async () => {
      const process = {
        argv: ['skip', 'skip'],
        stdout: {
          write: sinon.stub(),
        },
        stderr: {
          write: sinon.stub(),
        },
        exit: sinon.stub(),
      };
      const JSON_FILE = JSON.stringify({bin: {foo: './foo.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves(JSON_FILE);
      readFileStub.onCall(1).resolves('');
      await ShebangCheck.cli((process as unknown) as NodeJS.Process);
      expect(process.exit.args).to.deep.equal([[1]]);
      expect(process.stderr.write.calledOnce).to.equal(true);
      expect(process.stdout.write.calledOnce).to.equal(false);
      sinon.restore();
    });
    it('should return exit code with 1', async () => {
      const process = {
        argv: ['skip', 'skip', './example.json'],
        stdout: {
          write: sinon.stub(),
        },
        stderr: {
          write: sinon.stub(),
        },
        exit: sinon.stub(),
      };
      const JSON_FILE = JSON.stringify({bin: {foo: './foo.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves(JSON_FILE);
      readFileStub.onCall(1).resolves('');
      await ShebangCheck.cli((process as unknown) as NodeJS.Process);
      expect(process.exit.args).to.deep.equal([[1]]);
      expect(process.stderr.write.calledOnce).to.equal(true);
      expect(process.stdout.write.calledOnce).to.equal(false);
      sinon.restore();
    });
    it('should return exit code with 0', async () => {
      const process = {
        argv: ['skip', 'skip', './example.json'],
        stdout: {
          write: sinon.stub(),
        },
        stderr: {
          write: sinon.stub(),
        },
        exit: sinon.stub(),
      };
      const JSON_FILE = JSON.stringify({bin: {foo: './foo.js'}});
      readFileStub = sinon.stub(fs.promises, 'readFile');
      readFileStub.onCall(0).resolves(JSON_FILE);
      readFileStub
        .onCall(1)
        .resolves('#!/usr/bin/env node\n console.log("hello")');
      await ShebangCheck.cli((process as unknown) as NodeJS.Process);
      expect(process.exit.args).to.deep.equal([[0]]);
      expect(process.stderr.write.calledOnce).to.equal(false);
      expect(process.stdout.write.calledOnce).to.equal(true);
      sinon.restore();
    });
  });
});
