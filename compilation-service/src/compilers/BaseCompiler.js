class BaseCompiler {
    constructor(language) {
        this.language = language;
        this.name = 'BaseCompiler';
    }

    async compile(code) {
        throw new Error('compile() method must be implemented by child class');
    }

    getSupportedLanguages() {
        throw new Error('getSupportedLanguages() method must be implemented by child class');
    }
}

module.exports = BaseCompiler;