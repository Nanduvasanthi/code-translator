import { 
  BinaryExpression, 
  UnaryExpression, 
  LogicalExpression,
  ComparisonExpression 
} from '../../../core/ast-nodes.js';

export class OperatorsGenerator {
  canGenerate(astNode) {
    return [
      'binary_expression',
      'unary_expression', 
      'logical_expression',
      'comparison_expression',
      'bitwise_expression',
      'ternary_expression',
      'assignment_expression'  // ADD THIS LINE
    ].includes(astNode.type);
  }

  generate(astNode, context) {
    console.log(`DEBUG OperatorsGenerator: Generating for type: ${astNode.type}`);
    
    switch (astNode.type) {
      case 'binary_expression':
        return this.generateBinaryExpression(astNode, context);
      case 'unary_expression':
        return this.generateUnaryExpression(astNode, context);
      case 'logical_expression':
        return this.generateLogicalExpression(astNode, context);
      case 'comparison_expression':
        return this.generateComparisonExpression(astNode, context);
      case 'bitwise_expression':
        return this.generateBitwiseExpression(astNode, context);
      case 'ternary_expression':
        return this.generateTernaryExpression(astNode, context);
      case 'assignment_expression':  // ADD THIS CASE
        return this.generateAssignmentExpression(astNode, context);
      default:
        return '';
    }
  }

  // ADD THIS NEW METHOD
  generateAssignmentExpression(astNode, context) {
    const { left, operator, right } = astNode;
    
    console.log(`DEBUG OperatorsGenerator: Generating assignment: ${JSON.stringify(left)} ${operator} ${JSON.stringify(right)}`);
    
    // Convert C assignment operators to Python
    const operatorMap = {
      '=': '=',
      '+=': '+=',
      '-=': '-=',
      '*=': '*=',
      '/=': '//=',
      '%=': '%=',
      '&=': '&=',
      '|=': '|=',
      '^=': '^=',
      '<<=': '<<=',
      '>>=': '>>='
    };
    
    const pyOperator = operatorMap[operator] || '=';
    
    // Convert left side (could be array access like numbers[0])
    let leftExpr = this.convertExpressionPart(left, context);
    
    // If left is a subscript expression (array access), handle it
    if (left && left.type === 'subscript_expression') {
      leftExpr = this.generateArrayAccess(left, context);
    }
    
    // Convert right side
    const rightExpr = this.convertExpressionPart(right, context);
    
    return `${leftExpr} ${pyOperator} ${rightExpr}`;
  }

  // ADD THIS HELPER METHOD
  generateArrayAccess(astNode, context) {
    const { array, index } = astNode;
    
    let arrayName;
    if (typeof array === 'object') {
      if (array.type === 'identifier') {
        arrayName = array.name || array.value;
      } else if (array.type === 'subscript_expression') {
        // Handle multi-dimensional arrays: matrix[1][2]
        arrayName = this.generateArrayAccess(array, context);
      } else {
        arrayName = array.value || array.text || 'unknown';
      }
    } else {
      arrayName = array;
    }
    
    let indexValue;
    if (typeof index === 'object') {
      if (index.type === 'literal') {
        indexValue = index.value;
      } else if (index.type === 'identifier') {
        indexValue = index.name || index.value;
      } else {
        indexValue = index.value || index.text || '0';
      }
    } else {
      indexValue = index;
    }
    
    return `${arrayName}[${indexValue}]`;
  }

  // UPDATE THE convertExpressionPart METHOD TO HANDLE MORE TYPES
  convertExpressionPart(part, context) {
    if (!part) return '""';
    
    if (typeof part === 'object') {
      if (part.type === 'identifier') {
        return part.name || part.value || '""';
      } else if (part.type === 'literal') {
        return part.value || '""';
      } else if (part.type === 'string_literal') {
        let strValue = part.value || '';
        // Remove surrounding quotes if present
        if (strValue.startsWith('"') && strValue.endsWith('"')) {
          strValue = strValue.substring(1, strValue.length - 1);
        }
        // Escape for Python
        strValue = strValue
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'")
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t');
        return `"${strValue}"`;
      } else if (part.type === 'subscript_expression') {
        return this.generateArrayAccess(part, context);
      } else if (part.type === 'binary_expression' || 
                 part.type === 'unary_expression' ||
                 part.type === 'logical_expression' ||
                 part.type === 'comparison_expression' ||
                 part.type === 'bitwise_expression' ||
                 part.type === 'ternary_expression' ||
                 part.type === 'assignment_expression') {  // ADD assignment_expression
        // Recursively convert nested expressions
        return this.generate(part, context);
      } else if (part.type === 'expression') {
        return part.value || '""';
      }
      return part.value || '""';
    }
    
    return part;
  }

  // ... rest of the existing methods remain the same ...
  generateBinaryExpression(astNode, context) {
    const { left, operator, right } = astNode;
    
    // Convert C operators to Python operators
    const operatorMap = {
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '//',
      '%': '%',
      '&': '&',
      '|': '|',
      '^': '^',
      '<<': '<<',
      '>>': '>>',
      '&&': 'and',
      '||': 'or'
    };
    
    const pyOperator = operatorMap[operator] || operator;
    const leftExpr = this.convertExpressionPart(left, context);
    const rightExpr = this.convertExpressionPart(right, context);
    
    return `${leftExpr} ${pyOperator} ${rightExpr}`;
  }

  generateUnaryExpression(astNode, context) {
    const { operator, operand } = astNode;
    
    const operatorMap = {
      '++': '+ 1',
      '--': '- 1',
      '!': 'not ',
      '~': '~',
      '+': '+',
      '-': '-',
      '*': '*', // dereference
      '&': ''  // address of (ignore in Python)
    };
    
    const operandExpr = this.convertExpressionPart(operand, context);
    
    if (operator === '++' || operator === '--') {
      // Pre-increment/decrement
      return `${operandExpr} ${operatorMap[operator]}`;
    } else if (operator === '*') {
      // Dereference - just use the variable name in Python
      return operandExpr;
    } else if (operator === '&') {
      // Address of - ignore in Python
      return operandExpr;
    } else {
      return `${operatorMap[operator] || operator}${operandExpr}`;
    }
  }

  generateLogicalExpression(astNode, context) {
    const { left, operator, right } = astNode;
    
    const operatorMap = {
      '&&': 'and',
      '||': 'or'
    };
    
    const pyOperator = operatorMap[operator] || operator;
    const leftExpr = this.convertExpressionPart(left, context);
    const rightExpr = this.convertExpressionPart(right, context);
    
    return `${leftExpr} ${pyOperator} ${rightExpr}`;
  }

  generateComparisonExpression(astNode, context) {
    const { left, operator, right } = astNode;
    
    const operatorMap = {
      '==': '==',
      '!=': '!=',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<='
    };
    
    const pyOperator = operatorMap[operator] || operator;
    const leftExpr = this.convertExpressionPart(left, context);
    const rightExpr = this.convertExpressionPart(right, context);
    
    return `${leftExpr} ${pyOperator} ${rightExpr}`;
  }

  generateBitwiseExpression(astNode, context) {
    const { operator, left, right, operand } = astNode;
    
    // For binary bitwise operations (like m & n, m | n, m << 1, etc.)
    if (left && right) {
      const operatorMap = {
        '&': '&',
        '|': '|',
        '^': '^',
        '<<': '<<',
        '>>': '>>'
      };
      
      const pyOperator = operatorMap[operator] || operator;
      const leftExpr = this.convertExpressionPart(left, context);
      const rightExpr = this.convertExpressionPart(right, context);
      
      return `${leftExpr} ${pyOperator} ${rightExpr}`;
    }
    // For unary bitwise operations (like ~m)
    else if (operand) {
      const operatorMap = {
        '~': '~'
      };
      
      const pyOperator = operatorMap[operator] || operator;
      const operandExpr = this.convertExpressionPart(operand, context);
      
      return `${pyOperator}${operandExpr}`;
    }
    
    // Fallback: return empty string
    return '';
  }

  generateTernaryExpression(astNode, context) {
    const { condition, thenValue, elseValue } = astNode;
    
    console.log(`DEBUG OperatorsGenerator: Generating ternary expression`);
    
    // Convert C ternary: (condition) ? trueValue : falseValue
    // to Python ternary: trueValue if condition else falseValue
    
    const conditionExpr = this.convertExpressionPart(condition, context);
    const trueExpr = this.convertExpressionPart(thenValue, context);
    const falseExpr = this.convertExpressionPart(elseValue, context);
    
    // Handle string literals - ensure they're quoted
    let formattedTrueExpr = trueExpr;
    let formattedFalseExpr = falseExpr;
    
    // If the values are string literals without quotes, add them
    if (typeof thenValue === 'object' && thenValue.type === 'literal' && 
        thenValue.data_type === 'String' && !trueExpr.startsWith('"') && !trueExpr.startsWith("'")) {
      formattedTrueExpr = `"${trueExpr}"`;
    }
    
    if (typeof elseValue === 'object' && elseValue.type === 'literal' && 
        elseValue.data_type === 'String' && !falseExpr.startsWith('"') && !falseExpr.startsWith("'")) {
      formattedFalseExpr = `"${falseExpr}"`;
    }
    
    return `${formattedTrueExpr} if ${conditionExpr} else ${formattedFalseExpr}`;
  }
}