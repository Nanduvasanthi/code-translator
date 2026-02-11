const ParserBase = require('./java-parser-base');
const { parseVariables } = require('./java-variables');
const { parseFunctions } = require('./java-functions');
const { parseLoops } = require('./java-loops');
const { parseControlFlow } = require('./java-control-flow');
const { parseArrays } = require('./java-arrays');
const { parseOperators } = require('./java-operators');
const { parsePrint } = require('./java-print');

class JavaParser extends ParserBase {
    constructor() {
        super();
        this.initializeRules();
    }

    initializeRules() {
        // Add all parsing rules
        this.addRule('class_declaration', this.parseClass.bind(this));
        this.addRule('method_declaration', parseFunctions.parseMethod.bind(this));
        this.addRule('variable_declaration', parseVariables.parseVariable.bind(this));
        this.addRule('for_statement', parseLoops.parseFor.bind(this));
        this.addRule('while_statement', parseLoops.parseWhile.bind(this));
        this.addRule('do_statement', parseLoops.parseDoWhile.bind(this));
        this.addRule('if_statement', parseControlFlow.parseIf.bind(this));
        this.addRule('switch_statement', parseControlFlow.parseSwitch.bind(this));
        this.addRule('array_creation', parseArrays.parseArrayCreation.bind(this));
        this.addRule('array_access', parseArrays.parseArrayAccess.bind(this));
        this.addRule('binary_expression', parseOperators.parseBinaryExpression.bind(this));
        this.addRule('assignment', parseOperators.parseAssignment.bind(this));
        this.addRule('method_invocation', parsePrint.parsePrintStatement.bind(this));
    }

    parseClass(input) {
        const pattern = /^\s*(public\s+)?class\s+(\w+)\s*\{/;
        const match = input.match(pattern);
        
        if (!match) return null;
        
        const className = match[2];
        const classStart = match[0];
        
        // Find matching closing brace
        let braceCount = 1;
        let i = classStart.length;
        let content = '';
        
        while (i < input.length && braceCount > 0) {
            const char = input[i];
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (braceCount > 0) content += char;
            i++;
        }
        
        return {
            type: 'ClassDeclaration',
            name: className,
            body: this.parse(content),
            consumed: i
        };
    }

    parse(input) {
        input = input.trim();
        if (!input) return [];
        
        const statements = [];
        let position = 0;
        
        while (position < input.length) {
            // Skip whitespace
            if (/\s/.test(input[position])) {
                position++;
                continue;
            }
            
            // Try each parsing rule
            let parsed = null;
            for (const [type, parser] of this.rules) {
                parsed = parser(input.slice(position));
                if (parsed) {
                    statements.push(parsed.ast);
                    position += parsed.consumed;
                    break;
                }
            }
            
            // If nothing parsed, move forward
            if (!parsed) {
                position++;
            }
        }
        
        return statements;
    }
}

module.exports = JavaParser;