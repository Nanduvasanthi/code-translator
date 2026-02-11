class JavaFunctionParser {
    parseMethod(input) {
        // Match public static void main(String[] args) pattern
        const mainPattern = /^\s*public\s+static\s+void\s+main\s*\(\s*String\s*\[\]\s*\w+\s*\)\s*\{/;
        const mainMatch = input.match(mainPattern);
        
        if (mainMatch) {
            return this.parseMethodBody(input, mainMatch[0], 'main');
        }
        
        // Match general method pattern
        const methodPattern = /^\s*(public|private|protected)?\s*(static)?\s*(\w+)\s+(\w+)\s*\(([^)]*)\)\s*\{/;
        const methodMatch = input.match(methodPattern);
        
        if (methodMatch) {
            const modifiers = [];
            if (methodMatch[1]) modifiers.push(methodMatch[1]);
            if (methodMatch[2]) modifiers.push('static');
            
            return this.parseMethodBody(input, methodMatch[0], methodMatch[4], methodMatch[3], modifiers, methodMatch[5]);
        }
        
        return null;
    }

    parseMethodBody(input, signature, name, returnType = 'void', modifiers = [], params = '') {
        let braceCount = 1;
        let i = signature.length;
        let body = '';
        
        while (i < input.length && braceCount > 0) {
            const char = input[i];
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            if (braceCount > 0) body += char;
            i++;
        }
        
        // Parse parameters
        const parameters = params.split(',')
            .map(p => p.trim())
            .filter(p => p)
            .map(p => {
                const parts = p.split(/\s+/);
                return {
                    type: parts[0],
                    name: parts[1] || ''
                };
            });
        
        return {
            ast: {
                type: 'MethodDeclaration',
                name: name,
                returnType: returnType,
                modifiers: modifiers,
                parameters: parameters,
                body: this.parseStatements(body)
            },
            consumed: i
        };
    }

    parseStatements(body) {
        // Simple statement parser - in real implementation, use a proper parser
        const statements = [];
        let current = '';
        let braceCount = 0;
        
        for (let i = 0; i < body.length; i++) {
            const char = body[i];
            
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
            
            if (char === ';' && braceCount === 0) {
                statements.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        return statements.filter(s => s);
    }
}

module.exports = new JavaFunctionParser();