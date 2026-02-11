import { BinaryExpression, UnaryExpression } from '../../core/ast-nodes.js';

export class OperatorsParser {
  canParse(node) {
    return node.type === 'binary_expression' || 
           node.type === 'unary_expression' ||
           node.type === 'assignment_expression' ||
           node.type === 'update_expression';
  }

  parse(node, context) {
    switch (node.type) {
      case 'binary_expression':
        return this.parseBinaryExpression(node, context);
      case 'unary_expression':
        return this.parseUnaryExpression(node, context);
      case 'assignment_expression':
        return this.parseAssignmentExpression(node, context);
      case 'update_expression':
        return this.parseUpdateExpression(node, context);
      default:
        return null;
    }
  }

  parseBinaryExpression(node, context) {
    let left = null;
    let operator = '';
    let right = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (this.isOperator(child.type)) {
        operator = child.text;
      } else if (!left) {
        left = this.parseOperand(child, context);
      } else {
        right = this.parseOperand(child, context);
      }
    }
    
    return new BinaryExpression(left, operator, right);
  }

  parseUnaryExpression(node, context) {
    let operator = '';
    let operand = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === '++' || child.type === '--' || child.type === '!' || child.type === '~') {
        operator = child.text;
      } else if (child.type === 'identifier') {
        operand = { type: 'identifier', name: child.text };
      }
    }
    
    return new UnaryExpression(operator, operand);
  }

  parseAssignmentExpression(node, context) {
    let left = null;
    let operator = '=';
    let right = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'identifier' || child.type === 'array_access') {
        left = this.parseOperand(child, context);
      } else if (this.isAssignmentOperator(child.type)) {
        operator = child.text;
      } else if (child.type !== '=' && child.type !== '+=' && child.type !== '-=' && 
                 child.type !== '*=' && child.type !== '/=' && child.type !== '%=') {
        // Parse the right operand, skipping the assignment operator itself
        right = this.parseOperand(child, context);
      }
    }
    
    return {
      type: 'assignment_expression',
      left: left,
      operator: operator,
      right: right
    };
  }

  parseUpdateExpression(node, context) {
    let operator = '';
    let operand = null;
    let isPrefix = false;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === '++' || child.type === '--') {
        operator = child.text;
        // Check if it's prefix (operator before operand) or postfix
        if (i === 0) {
          isPrefix = true;
        }
      } else if (child.type === 'identifier') {
        operand = { type: 'identifier', name: child.text };
      }
    }
    
    return {
      type: 'update_expression',
      operator: operator,
      operand: operand,
      isPrefix: isPrefix
    };
  }

  parseOperand(node, context) {
    // Handle array access like numbers[0]
    if (node.type === 'array_access') {
      return this.parseArrayAccess(node, context);
    }
    
    if (node.type === 'identifier') {
      return { type: 'identifier', name: node.text };
    } else if (node.type === 'integer_literal' || node.type === 'decimal_integer_literal') {
      return { type: 'literal', value: parseInt(node.text) };
    } else if (node.type === 'float_literal' || node.type === 'decimal_floating_point_literal') {
      return { type: 'literal', value: parseFloat(node.text) };
    } else if (node.type === 'string_literal') {
      const text = node.text;
      return { type: 'literal', value: text.substring(1, text.length - 1) };
    } else if (node.type === 'character_literal') {
      const text = node.text;
      return { type: 'literal', value: text.substring(1, text.length - 1) };
    } else if (node.type === 'true' || node.type === 'false') {
      return { type: 'literal', value: node.type === 'true' };
    } else if (node.type === 'binary_expression') {
      return this.parseBinaryExpression(node, context);
    } else if (node.type === 'field_access') {
      // Handle field access like numbers.length
      return this.parseFieldAccess(node, context);
    }
    
    // Check for literals in the text
    if (node.text && !isNaN(node.text)) {
      return { type: 'literal', value: Number(node.text) };
    }
    
    return { type: 'unknown', value: node.text };
  }

  parseArrayAccess(node, context) {
    let arrayName = null;
    let index = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'identifier') {
        arrayName = child.text;
      } else if (child.type === 'integer_literal' || 
                 child.type === 'decimal_integer_literal' ||
                 child.type === 'binary_expression' ||
                 child.type === 'identifier') {
        index = this.parseOperand(child, context);
      }
    }
    
    return {
      type: 'array_access',
      array: arrayName,
      index: index
    };
  }

  parseFieldAccess(node, context) {
    let object = null;
    let field = null;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'identifier') {
        if (!object) {
          object = { type: 'identifier', name: child.text };
        } else {
          field = child.text;
        }
      } else if (child.type === '.') {
        // Skip dot operator
        continue;
      }
    }
    
    return {
      type: 'field_access',
      object: object,
      field: field
    };
  }

  isOperator(type) {
    const operators = ['+', '-', '*', '/', '%', '==', '!=', '<', '>', '<=', '>=', '&&', '||'];
    return operators.includes(type);
  }

  isAssignmentOperator(type) {
    const assignmentOps = ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>>=', '||=', '&&='];
    return assignmentOps.includes(type);
  }
}