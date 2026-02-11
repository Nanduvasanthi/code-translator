import { CParserBase } from './parser-base.js';

export class OperatorsParser extends CParserBase {
  constructor() {
    super('operators');
    this.supportedNodes = [
      'binary_expression',
      'unary_expression', 
      'logical_expression',
      'comparison_expression',
      'assignment_expression'
    ];
  }

  canParse(node) {
    return this.supportedNodes.includes(node.type);
  }

  parse(node, context) {
    console.log(`DEBUG OperatorsParser: Parsing ${node.type}: "${node.text.substring(0, 50)}..."`);
    
    switch (node.type) {
      case 'binary_expression':
        return this.parseBinaryExpression(node, context);
      case 'comparison_expression':
        return this.parseComparisonExpression(node, context);
      case 'logical_expression':
        return this.parseLogicalExpression(node, context);
      case 'unary_expression':
        return this.parseUnaryExpression(node, context);
      case 'assignment_expression':
        return this.parseAssignmentExpression(node,context);
      default:
        return null;
    }
  }


  

  
  // ADD THIS METHOD:
  parseAssignmentExpression(node, context) {
    console.log(`DEBUG OperatorsParser: Parsing assignment_expression: "${node.text.substring(0, 50)}..."`);
    
    // Tree-sitter structure: assignment_expression has 3 children: left, operator, right
    if (node.childCount < 3) {
      console.log(`WARN OperatorsParser: assignment_expression has only ${node.childCount} children`);
      return null;
    }
    
    const left = node.child(0);
    const operator = node.child(1);
    const right = node.child(2);
    
    const leftExpr = this.parseChildExpression(left, context);
    const rightExpr = this.parseChildExpression(right, context);
    
    const result = {
      type: 'assignment_expression',
      operator: operator.text,
      left: leftExpr,
      right: rightExpr
    };
    
    result._position = {
      startLine: node.startPosition.row,
      originalText: node.text
    };
    
    console.log(`DEBUG OperatorsParser: Parsed assignment: "${leftExpr?.name || leftExpr?.value} ${operator.text} ${rightExpr?.name || rightExpr?.value}"`);
    
    return result;
  }


  parseBinaryExpression(node, context) {
    // Tree-sitter structure: binary_expression has 3 children: left, operator, right
    if (node.childCount < 3) {
      console.log(`WARN OperatorsParser: binary_expression has only ${node.childCount} children`);
      return null;
    }
    
    const left = node.child(0);
    const operator = node.child(1);
    const right = node.child(2);
    
    const leftExpr = this.parseChildExpression(left, context);
    const rightExpr = this.parseChildExpression(right, context);
    const operatorText = operator.text;
    
    // Check if this is actually a bitwise operator
    const isBitwise = ['&', '|', '^', '<<', '>>'].includes(operatorText);
    
    const result = {
      type: isBitwise ? 'bitwise_expression' : 'binary_expression',
      operator: operatorText,
      left: leftExpr,
      right: rightExpr,
      data_type: this.inferDataType(leftExpr, rightExpr, operatorText)
    };
    
    result._position = {
      startLine: node.startPosition.row,
      originalText: node.text
    };
    
    console.log(`DEBUG OperatorsParser: Parsed binary_expression: "${leftExpr?.name || leftExpr?.value} ${operatorText} ${rightExpr?.name || rightExpr?.value}"`);
    
    return result;
  }

  parseComparisonExpression(node, context) {
    // Tree-sitter doesn't have separate comparison_expression node
    // It's just a binary_expression with comparison operators
    // But if we get here, parse as binary
    return this.parseBinaryExpression(node, context);
  }

  parseLogicalExpression(node, context) {
    // Tree-sitter doesn't have separate logical_expression node
    // It's just a binary_expression with logical operators
    return this.parseBinaryExpression(node, context);
  }

  parseUnaryExpression(node, context) {
    // Tree-sitter structure: unary_expression has 2 children: operator and operand
    if (node.childCount < 2) {
      console.log(`WARN OperatorsParser: unary_expression has only ${node.childCount} children`);
      return null;
    }
    
    const operator = node.child(0);
    const operand = node.child(1);
    
    const operandExpr = this.parseChildExpression(operand, context);
    const operatorText = operator.text;
    
    // Check if this is bitwise NOT
    const isBitwiseNot = operatorText === '~';
    
    const result = {
      type: isBitwiseNot ? 'bitwise_expression' : 'unary_expression',
      operator: operatorText,
      operand: operandExpr,
      data_type: operandExpr?.data_type || 'int'
    };
    
    result._position = {
      startLine: node.startPosition.row,
      originalText: node.text
    };
    
    console.log(`DEBUG OperatorsParser: Parsed unary expression: "${operatorText}${operandExpr?.name || operandExpr?.value}"`);
    
    return result;
  }

  parseChildExpression(childNode, context) {
    if (!childNode) return null;
    
    // First check if it's a simple identifier
    if (childNode.type === 'identifier') {
      return {
        type: 'identifier',
        name: childNode.text,
        data_type: 'unknown' // Type will be resolved from context if available
      };
    }
    
    // Check if it's a literal
    if (childNode.type === 'number_literal') {
      return {
        type: 'literal',
        value: childNode.text,
        data_type: 'int' // Default to int
      };
    }
    
    // Check if it's another expression
    if (childNode.type === 'binary_expression' || 
        childNode.type === 'parenthesized_expression' ||
        childNode.type === 'unary_expression') {
      
      // Parse recursively
      return this.parse(childNode, context);
    }
    
    // Default: just capture the text
    return {
      type: 'unknown',
      value: childNode.text,
      data_type: 'unknown'
    };
  }

  inferDataType(left, right, operator) {
    if (!left && !right) return 'int'; // Default
    
    // For comparisons and logical operators, result is boolean
    const comparisonOps = ['>', '<', '>=', '<=', '==', '!='];
    const logicalOps = ['&&', '||'];
    
    if (comparisonOps.includes(operator) || logicalOps.includes(operator)) {
      return 'boolean';
    }
    
    // For arithmetic, use left operand's type
    const arithmeticOps = ['+', '-', '*', '/', '%', '&', '|', '^', '<<', '>>'];
    if (arithmeticOps.includes(operator)) {
      return left?.data_type || 'int';
    }
    
    return left?.data_type || 'int';
  }
}

export default OperatorsParser;