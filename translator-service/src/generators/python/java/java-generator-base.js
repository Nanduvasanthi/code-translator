class GeneratorBase {
    constructor() {
        this.generators = new Map();
    }

    addGenerator(nodeType, generator) {
        this.generators.set(nodeType, generator);
    }

    generate(node) {
        throw new Error('generate method must be implemented by subclass');
    }

    indent(code, levels = 1) {
        const indentStr = '    '.repeat(levels);
        return code.split('\n').map(line => indentStr + line).join('\n');
    }
}

module.exports = GeneratorBase;