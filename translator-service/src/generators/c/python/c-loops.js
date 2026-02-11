export class LoopsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'loop_statement';
  }

  generate(astNode, context) {
    switch (astNode.loop_type) {
      case 'for':
        return this.generateForLoop(astNode, context);
      case 'while':
        return this.generateWhileLoop(astNode, context);
      default:
        return '// Unknown loop type';
    }
  }

  generateForLoop(astNode, context) {
    const variable = astNode.variable;
    const iterable = astNode.iterable;
    const body = astNode.body || [];
    
    // Check if it's a range() loop
    if (iterable && iterable.type === 'range') {
      return this.generateRangeLoop(variable, iterable, body, context);
    }
    
    // Check if it's a list iteration
    if (typeof iterable === 'string') {
      return this.generateListLoop(variable, iterable, body, context);
    }
    
    // Default for loop
    return this.generateGenericForLoop(variable, iterable, body, context);
  }

  generateRangeLoop(variable, range, body, context) {
    let loopHeader = '';
    const start = range.start !== undefined ? range.start : 0;
    const end = range.end !== undefined ? range.end : '5'; // Default
    const step = range.step !== undefined ? range.step : 1;
    
    // Add loop variable to context as int
    context.addVariable(variable, 'int');
    
    // Generate loop header based on step
    if (step === 1) {
      loopHeader = `for (int ${variable} = ${start}; ${variable} < ${end}; ${variable}++)`;
    } else if (step > 0) {
      loopHeader = `for (int ${variable} = ${start}; ${variable} < ${end}; ${variable} += ${step})`;
    } else if (step < 0) {
      loopHeader = `for (int ${variable} = ${start}; ${variable} > ${end}; ${variable} += ${step})`;
    } else {
      loopHeader = `for (int ${variable} = ${start}; ${variable} < ${end}; ${variable}++)`;
    }
    
    const bodyCode = this.generateLoopBody(body, context, 2);
    
    return `${loopHeader} {\n${bodyCode}    }`;
  }

  generateListLoop(variable, listName, body, context) {
    // Add loop variable to context as char* (for strings)
    context.addVariable(variable, 'char*');
    
    // FIXED INDENTATION ISSUE: Removed the extra spaces in generateLoopBody call
    const bodyCode = this.generateLoopBody(body, context, 2); // Start at indentation level 2 (since inside two nested blocks)
    
    // FIXED: Properly indent all generated code
    return `int ${listName}_size = sizeof(${listName}) / sizeof(${listName}[0]);\n    for (int i = 0; i < ${listName}_size; i++) {\n        char* ${variable} = ${listName}[i];\n${bodyCode}    }`;
  }

  generateGenericForLoop(variable, iterable, body, context) {
    // Generic for loop (fallback)
    context.addVariable(variable, 'int');
    
    const loopHeader = `// Generic for loop\nfor (int ${variable} = 0; ${variable} < 10; ${variable}++)`;
    const bodyCode = this.generateLoopBody(body, context, 2);
    
    return `${loopHeader} {\n${bodyCode}    }`;
  }

  generateWhileLoop(astNode, context) {
    const condition = astNode.condition;
    const body = astNode.body || [];
    
    const conditionCode = this.generateCondition(condition, context);
    const bodyCode = this.generateLoopBody(body, context, 2);
    
    return `while (${conditionCode}) {\n${bodyCode}    }`;
  }

  generateCondition(condition, context) {
    if (!condition) return '1';
    
    if (condition.type === 'comparison') {
      const left = this.extractOperand(condition.left, context);
      const operator = this.mapOperator(condition.operator);
      const right = this.extractOperand(condition.right, context);
      
      return `(${left} ${operator} ${right})`;
    } else if (condition.type === 'expression') {
      return this.parseExpression(condition.value, context);
    }
    
    return '1';
  }

  generateLoopBody(bodyStatements, context, indentLevel) {
    if (!bodyStatements || bodyStatements.length === 0) {
      const indent = '    '.repeat(indentLevel);
      return indent + '// empty\n';
    }
    
    let bodyCode = '';
    const statementIndent = '    '.repeat(indentLevel);
    
    for (const stmt of bodyStatements) {
      if (stmt.type === 'raw') {
        const translated = this.translateStatement(stmt.code, context);
        
        // Clean the translated statement
        let finalStmt = translated.trim();
        
        // Remove any existing indentation from the translated statement
        finalStmt = finalStmt.replace(/^\s+/, '');
        
        // Ensure statement ends properly
        if (!finalStmt.endsWith(';') && !finalStmt.endsWith('}') && !finalStmt.startsWith('/*')) {
          finalStmt += ';';
        }
        
        // Add proper indentation
        bodyCode += statementIndent + finalStmt + '\n';
      } else if (stmt.type === 'loop_statement') {
        // Handle nested loops
        const nestedLoop = this.generate(stmt, context);
        const nestedLines = nestedLoop.split('\n');
        
        for (const line of nestedLines) {
          if (line.trim()) {
            // Clean line and add proper indentation
            const cleanLine = line.trim();
            if(cleanLine.startsWith('for (') || cleanLine.startsWith('while (') || cleanLine === '}') {
                bodyCode += statementIndent + cleanLine + '\n';
            } else {
                bodyCode += statementIndent + '    ' + cleanLine + '\n';
            }
          }
        }
      }
    }
    
    return bodyCode;
  }

  translateStatement(rawCode, context) {
    // Handle print statements
    if (rawCode.includes('print(')) {
      return this.translatePrintStatement(rawCode, context);
    }
    // Handle variable assignments (including augmented like +=)
    else if (rawCode.includes('=')) {
      return this.translateAssignment(rawCode, context);
    }
    // Handle for/while loops (should be handled separately)
    
    return `/* ${rawCode} */`;
  }

  translatePrintStatement(rawCode, context) {
    // Extract the print content
    const match = rawCode.match(/print\((.+)\)/);
    if (!match) return rawCode;
    
    let content = match[1].trim();
    
    // Handle f-strings
    if (content.includes('f"') || content.includes("f'")) {
      return this.translateFString(content, context);
    }
    
    // Remove Python quotes and add C quotes
    if ((content.startsWith('"') && content.endsWith('"')) || 
        (content.startsWith("'") && content.endsWith("'"))) {
      const strContent = content.substring(1, content.length - 1);
      
      // Escape special characters for C string literal
      const escapedContent = this.escapeCString(strContent);
      
      return `printf("${escapedContent}\\n");`;
    }
    
    // If it's not a simple string, use generic print
    return `printf("${content}\\n");`;
  }

  escapeCString(str) {
    // Escape special characters for C string literals
    return str
      .replace(/\\/g, '\\\\')    // Escape backslashes first
      .replace(/"/g, '\\"')      // Escape double quotes
      .replace(/'/g, "\\'")      // Escape single quotes
      .replace(/\n/g, '\\n')     // Escape newlines
      .replace(/\t/g, '\\t')     // Escape tabs
      .replace(/\r/g, '\\r');    // Escape carriage returns
  }

  translateFString(fstring, context) {
    // Remove f-prefix and quotes
    let content = fstring;
    if (content.startsWith('f"') && content.endsWith('"')) {
      content = content.substring(2, content.length - 1);
    } else if (content.startsWith("f'") && content.endsWith("'")) {
      content = content.substring(2, content.length - 1);
    } else {
      return `printf("${content}\\n");`;
    }
    
    // Simple f-string handling (could be enhanced)
    // Replace {variable} with %d or %s based on context
    const varRegex = /\{([^}]+)\}/g;
    let format = content;
    const values = [];
    
    let match;
    while ((match = varRegex.exec(content)) !== null) {
      const varName = match[1].trim();
      const varType = context.getVariableType(varName);
      
      if (varType === 'char*') {
        format = format.replace(match[0], '%s');
        values.push(varName);
      } else {
        format = format.replace(match[0], '%d');
        values.push(varName);
      }
    }
    
    if (values.length > 0) {
      return `printf("${format}\\n", ${values.join(', ')});`;
    } else {
      return `printf("${format}\\n");`;
    }
  }

  translateAssignment(rawCode, context) {
    // Handle augmented assignments like count += 1
    const augMatch = rawCode.match(/^(\w+)\s*([+\-*/%])=(.+)$/);
    if (augMatch) {
      const varName = augMatch[1].trim();
      const operator = augMatch[2];
      const value = augMatch[3].trim();
      
      const cOperator = this.mapOperator(operator);
      return `${varName} ${cOperator}= ${value};`;
    }
    
    // Regular assignment
    const parts = rawCode.split('=');
    if (parts.length !== 2) return rawCode;
    
    const varName = parts[0].trim();
    let value = parts[1].trim();
    
    // Handle string values
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      const strContent = value.substring(1, value.length - 1);
      value = `"${strContent}"`;
    }
    
    // Check if variable already declared
    if (context.hasVariable(varName)) {
      return `${varName} = ${value};`;
    } else {
      // Need to declare variable first
      const cType = this.inferCType(value, context);
      context.addVariable(varName, cType);
      return `${cType} ${varName} = ${value};`;
    }
  }

  extractOperand(operand, context) {
    if (!operand) return '0';
    
    if (operand.type === 'variable') {
      return operand.name;
    } else if (operand.type === 'number') {
      return operand.value;
    } else if (typeof operand === 'string') {
      return operand;
    }
    
    return '0';
  }

  parseExpression(expr, context) {
    expr = expr.trim();
    
    // Replace Python operators
    expr = expr.replace(/\b(and)\b/g, '&&');
    expr = expr.replace(/\b(or)\b/g, '||');
    expr = expr.replace(/\b(not)\b/g, '!');
    expr = expr.replace(/\b(is)\b/g, '==');
    expr = expr.replace(/\b(is not)\b/g, '!=');
    
    return expr;
  }

  mapOperator(pythonOp) {
    const operatorMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      'and': '&&',
      'or': '||',
      '+=': '+=',
      '-=': '-=',
      '*=': '*=',
      '/=': '/=',
      '%=': '%='
    };
    
    return operatorMap[pythonOp] || pythonOp;
  }

  inferCType(value, context) {
    value = value.trim();
    
    // Check if it's a string
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return 'char*';
    }
    
    // Check if it's a boolean
    if (value === 'true' || value === 'false') {
      return 'bool';
    }
    
    // Check if it's a float
    if (value.includes('.')) {
      return 'float';
    }
    
    // Default to int
    return 'int';
  }
}