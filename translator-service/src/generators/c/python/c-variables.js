export class VariablesGenerator {
  canGenerate(astNode) {
    return astNode.type === 'variable_declaration';
  }

  generate(astNode, context) {
    const varName = astNode.name;
    const pythonType = astNode.data_type;
    const value = astNode.value;
    
    // Map Python type to C type
    const cType = this.mapPythonTypeToC(pythonType);
    context.addVariable(varName, cType);
    
    // Extract value
    const cValue = this.extractValue(value, context);
    
    if (cValue !== null && cValue !== undefined) {
      return `${cType} ${varName} = ${cValue};`;
    } else {
      return `${cType} ${varName};`;
    }
  }

  extractValue(valueNode, context) {
    if (!valueNode) return null;
    
    // Handle different value node structures
    if (valueNode.type === 'literal') {
      return this.convertLiteralToC(valueNode);
    } else if (valueNode.type === 'identifier') {
      return valueNode.name;
    } else if (valueNode.type === 'ternary_expression') {
      return this.generateTernaryExpression(valueNode, context);
    }
    
    return null;
  }

  convertLiteralToC(literal) {
    if (!literal || !literal.data_type) return '0';
    
    switch (literal.data_type) {
      case 'str':
        return `"${literal.value || ''}"`;
      case 'int':
        return literal.value?.toString() || '0';
      case 'float':
        return literal.value?.toString() || '0.0';
      case 'bool':
        return literal.value ? 'true' : 'false';
      default:
        return '0';
    }
  }

  generateTernaryExpression(ternary, context) {
  const condition = this.extractCondition(ternary.condition, context);
  const thenValue = this.extractTernaryValue(ternary.thenValue, context) || '0';
  const elseValue = this.extractTernaryValue(ternary.elseValue, context) || '0';
  
  // Remove extra outer parentheses if condition already has them
  let cleanCondition = condition;
  if (cleanCondition.startsWith('(') && cleanCondition.endsWith(')')) {
    // Check if it's a simple wrapped condition
    const inner = cleanCondition.substring(1, cleanCondition.length - 1);
    if (!inner.includes('(') || inner.match(/\(/g).length === inner.match(/\)/g).length) {
      cleanCondition = inner;
    }
  }
  
  return `(${cleanCondition}) ? ${thenValue} : ${elseValue}`;
}

  extractCondition(condition, context) {
    if (!condition) return '0';
    
    if (condition.type === 'binary_expression') {
      const left = this.extractOperand(condition.left, context);
      const right = this.extractOperand(condition.right, context);
      const operator = this.mapOperator(condition.operator);
      return `(${left} ${operator} ${right})`;
    } else if (condition.type === 'comparison_expression' || condition.type === 'comparison') {
      // FIX: Handle both 'comparison_expression' and 'comparison' types
      const left = this.extractOperand(condition.left, context);
      const right = this.extractOperand(condition.right, context);
      const operator = this.mapOperator(condition.operator);
      return `(${left} ${operator} ${right})`;
    }
    
    return '0';
  }

  extractTernaryValue(valueNode, context) {
    if (!valueNode) return '0';
    
    if (valueNode.type === 'string') {
      return `"${valueNode.value}"`;
    } else if (valueNode.type === 'variable') {
      return valueNode.name;
    } else if (valueNode.type === 'number') {
      return valueNode.value;
    } else if (valueNode.type === 'boolean') {
      return valueNode.value ? 'true' : 'false';
    }
    
    return '0';
  }

  extractOperand(operand, context) {
    if (!operand) return '0';
    
    if (operand.type === 'variable') {
      return operand.name;
    } else if (operand.type === 'number') {
      return operand.value;
    } else if (operand.type === 'string') {
      return `"${operand.value}"`;
    } else if (operand.type === 'boolean') {
      return operand.value ? 'true' : 'false';
    } else if (typeof operand === 'string') {
      // Handle string literals (like "score" from the comparison)
      return operand;
    }
    
    return '0';
  }

  mapOperator(pythonOp) {
    const operatorMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%',
      '**': '**', // Will handle separately
      '//': '/',
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      'and': '&&',
      'or': '||',
      'is': '==',
      'is not': '!='
    };
    
    return operatorMap[pythonOp] || pythonOp;
  }

  mapPythonTypeToC(pythonType) {
  const typeMap = {
    'int': 'int',
    'float': 'float',
    'double': 'double',
    'str': 'char*',          // Single string
    'string': 'char*',       // Single string
    'bool': 'bool',
    'boolean': 'bool',
    'Object': 'void*',       // Generic object pointer
    
    // Array types from parser (Java-style)
    'String': 'char*[]',     // String array → char*[]
    'int[]': 'int[]',        // int array
    'float[]': 'float[]',    // float array
    'boolean[]': 'bool[]',   // boolean array
    'Object[]': 'void*[]',   // Object array
    
    // Python-style list types
    'list': 'int[]',         // Default generic list (should be overridden by parser)
    'list[str]': 'char*[]',  // String list
    'list[int]': 'int[]',    // Int list
    'list[float]': 'float[]' // Float list
  };
  
  return typeMap[pythonType] || 'int';
}
}