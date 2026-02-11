export class ConditionalsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'conditional_statement';
  }

  generate(astNode, context) {
  let cCode = '';
  
  // Generate if clause
  const ifCondition = this.generateCondition(astNode.condition, context);
  const ifBody = this.generateBody(astNode.then_branch, context);
  
  cCode += `if (${ifCondition}) {\n`;
  cCode += ifBody;
  cCode += '    }';  // Changed: Added spaces before }
  
  // Generate elif clauses
  if (astNode.elif_branches && astNode.elif_branches.length > 0) {
    for (const elifBranch of astNode.elif_branches) {
      const elifCondition = this.generateCondition(elifBranch.condition, context);
      const elifBody = this.generateBody(elifBranch.thenBranch, context);
      
      // Put else if on new line with proper indentation
      cCode += '\n    else if (';
      cCode += elifCondition;
      cCode += ') {\n';
      cCode += elifBody;
      cCode += '    }';
    }
  }
  
  // Generate else clause
  if (astNode.else_branch) {
    const elseBody = this.generateBody(astNode.else_branch, context);
    cCode += '\n    else {\n';  // Changed: New line with indentation
    cCode += elseBody;
    cCode += '    }';
  }
  
  return cCode;
}

  generateCondition(condition, context) {
    if (!condition) return '1'; // Default to true
    
    if (condition.type === 'comparison') {
      const left = condition.left;
      const operator = this.mapOperator(condition.operator);
      const right = condition.right;
      
      // Check if right is a variable or literal
      const rightValue = this.isNumber(right) ? right : right;
      
      return `(${left} ${operator} ${rightValue})`;
    } else if (condition.type === 'raw') {
      // Parse raw expression
      return this.parseRawExpression(condition.value, context);
    }
    
    return '1'; // Default to true
  }

  generateBody(bodyStatements, context) {
  if (!bodyStatements || bodyStatements.length === 0) {
    return '        // empty\n';  // Changed: 8 spaces
  }
  
  let bodyCode = '';
  
  for (const stmt of bodyStatements) {
    if (stmt.type === 'raw') {
      const translated = this.translateStatement(stmt.code, context);
      // Add proper indentation (8 spaces for code inside if blocks)
      bodyCode += '        ' + translated + '\n';  // Changed: 8 spaces
    }
  }
  
  return bodyCode;
}

  translateStatement(rawCode, context) {
    // Simple translation for common patterns
    let translated = rawCode;
    
    // Handle print statements
    if (rawCode.includes('print(')) {
      translated = this.translatePrintStatement(rawCode, context);
    }
    // Handle variable assignments
    else if (rawCode.includes('=')) {
      translated = this.translateAssignment(rawCode, context);
    }
    
    return translated || `/* ${rawCode} */`;
  }

  translatePrintStatement(rawCode, context) {
  // Extract the print content
  const match = rawCode.match(/print\((.+)\)/);
  if (!match) return rawCode;
  
  const content = match[1].trim();
  
  // Remove outer quotes if present
  let printContent = content;
  if ((content.startsWith('"') && content.endsWith('"')) || 
      (content.startsWith("'") && content.endsWith("'"))) {
    printContent = content.substring(1, content.length - 1);
  }
  
  return `printf("${printContent}\\n");`;
}

  translateAssignment(rawCode, context) {
  const parts = rawCode.split('=');
  if (parts.length !== 2) return rawCode;
  
  const varName = parts[0].trim();
  let value = parts[1].trim();
  
  // Handle string values (remove Python quotes, add C quotes)
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

  extractValue(valueNode, context) {
    if (!valueNode) return null;
    
    if (valueNode.type === 'literal') {
      if (valueNode.data_type === 'str') {
        return `"${valueNode.value || ''}"`;
      }
      return valueNode.value;
    } else if (valueNode.type === 'identifier') {
      return valueNode.name;
    }
    
    return null;
  }

  parseRawExpression(expr, context) {
    // Simple expression parsing
    expr = expr.trim();
    
    // Replace Python operators with C operators
    expr = expr.replace(/\b(and)\b/g, '&&');
    expr = expr.replace(/\b(or)\b/g, '||');
    expr = expr.replace(/\b(not)\b/g, '!');
    expr = expr.replace(/\b(is)\b/g, '==');
    expr = expr.replace(/\b(is not)\b/g, '!=');
    
    // Handle comparison operators (already C compatible)
    
    return expr;
  }

  mapOperator(pythonOp) {
    const operatorMap = {
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      'is': '==',
      'is not': '!='
    };
    
    return operatorMap[pythonOp] || pythonOp;
  }

  mapPythonTypeToC(pythonType) {
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'str': 'char*',
      'string': 'char*',
      'bool': 'bool',
      'Object': 'int'
    };
    
    return typeMap[pythonType] || 'int';
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

  isNumber(str) {
    return /^-?\d+(\.\d+)?$/.test(str);
  }
}