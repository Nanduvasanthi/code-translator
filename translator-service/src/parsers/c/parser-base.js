// src/parsers/c/parser-base.js - UPDATED
export class CParserBase {
  constructor() {
    this.supportedTypes = [
      'declaration', 'function_definition', 'if_statement',
      'for_statement', 'while_statement', 'do_statement',
      'array_declaration', 'call_expression', 'comment',
      'binary_expression', 'switch_statement'
    ];
  }

  /**
   * Parse expression - single unified method
   */
  parseExpression(node, context) {
    if (!node) return null;

    // ---------- NUMBER ----------
    if (node.type === 'number_literal') {
      const text = node.text.replace(/[fFlL]+$/, '');
      const value = text.includes('.') ? parseFloat(text) : parseInt(text, 10);
      const dataType = text.includes('.') ? 'float' : 'int';
      
      return {
        type: 'literal',
        value: value,
        data_type: dataType
      };
    }

    // ---------- CHAR ----------
    if (node.type === 'char_literal') {
      const char = node.text.length >= 3 ? node.text.charAt(1) : '';
      return {
        type: 'literal',
        value: char,
        data_type: 'char'
      };
    }

    // ---------- STRING ----------
    if (node.type === 'string_literal') {
      let value = node.text.substring(1, node.text.length - 1);
      value = value
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\');

      return {
        type: 'literal',
        value: value,
        data_type: 'String'
      };
    }

    // ---------- BOOLEAN ----------
    if (node.type === 'true' || node.type === 'false') {
      return {
        type: 'literal',
        value: node.text === 'true',
        data_type: 'bool'
      };
    }

    // ---------- IDENTIFIER ----------
    if (node.type === 'identifier') {
      return { 
        type: 'identifier', 
        name: node.text,
        data_type: 'unknown'
      };
    }

    // ---------- PARENTHESIZED EXPRESSION ----------
    if (node.type === 'parenthesized_expression') {
      // Extract the inner expression
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child.type !== '(' && child.type !== ')') {
            return this.parseExpression(child, context);
          }
        }
      }
      return null;
    }

    // ---------- BINARY/COMPARISON/LOGICAL EXPRESSIONS ----------
    if (node.type === 'binary_expression' || 
        node.type === 'unary_expression' ||
        node.type === 'logical_expression' ||
        node.type === 'comparison_expression') {
      
      // Delegate to the appropriate parser if context is available
      if (context && context.parsers) {
        for (const [parserName, parser] of Object.entries(context.parsers)) {
          if (parser && parser.canParse && parser.canParse(node)) {
            try {
              return parser.parse(node, context);
            } catch (error) {
              console.warn(`Failed to parse ${node.type} with ${parserName}:`, error);
            }
          }
        }
      }
      
      // Fallback: manually parse simple binary expressions
      if (node.type === 'binary_expression') {
        return this.parseSimpleBinaryExpression(node, context);
      }
      
      // For other types, return basic info
      return {
        type: 'expression',
        value: node.text,
        data_type: 'unknown'
      };
    }

    // Default fallback
    return {
      type: 'expression',
      value: node.text,
      data_type: 'unknown'
    };
  }

  /**
   * Simple binary expression parser as fallback
   * (Used when OperatorsParser is not available)
   */
  parseSimpleBinaryExpression(node, context) {
    let left = null;
    let right = null;
    let operator = null;
    
    // Simple traversal to find left, operator, right
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];
        
        if (child.type === 'identifier' || child.type === 'number_literal') {
          if (!left) {
            left = child;
          } else if (!right) {
            right = child;
          }
        } else if (['>', '<', '>=', '<=', '==', '!=', '&&', '||', '+', '-', '*', '/'].includes(child.text)) {
          operator = child;
        }
      }
    }
    
    const leftExpr = this.parseExpression(left, context);
    const rightExpr = this.parseExpression(right, context);
    const operatorText = operator ? operator.text : '';
    
    // Determine data type
    let dataType = 'unknown';
    if (['>', '<', '>=', '<=', '==', '!=', '&&', '||'].includes(operatorText)) {
      dataType = 'boolean';
    } else if (leftExpr && leftExpr.data_type) {
      dataType = leftExpr.data_type;
    }
    
    return {
      type: 'binary_expression',
      operator: operatorText,
      left: leftExpr,
      right: rightExpr,
      data_type: dataType
    };
  }

  /**
   * Helper method to parse a block of statements
   */
  parseBlock(node, context) {
    const statements = [];
    
    if (!node) return statements;
    
    // Handle different node types
    if (node.type === 'compound_statement') {
      // { ... } block
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          const child = node.children[i];
          if (child.type === '}' || child.type === '{') continue;
          
          // Try to parse this child
          const parsed = this.parseNode(child, context);
          if (parsed) statements.push(parsed);
        }
      }
    } else if (node.type === 'expression_statement') {
      // Single statement
      const parsed = this.parseNode(node, context);
      if (parsed) statements.push(parsed);
    }
    
    return statements;
  }

  /**
   * Parse any node using available parsers
   */
  parseNode(node, context) {
    if (!node) return null;
    
    // Try to find a parser that can handle this node
    if (context && context.parsers) {
      for (const [parserName, parser] of Object.entries(context.parsers)) {
        if (parser && parser.canParse && parser.canParse(node)) {
          try {
            const parsed = parser.parse(node, context);
            if (parsed) {
              // Add position info
              if (node._position) {
                parsed._position = { ...node._position };
              } else {
                parsed._position = {
                  startLine: node.startPosition?.row || 0,
                  endLine: node.endPosition?.row || 0,
                  startColumn: node.startPosition?.column || 0,
                  endColumn: node.endPosition?.column || 0,
                  originalText: node.text
                };
              }
              return parsed;
            }
          } catch (error) {
            console.warn(`Failed to parse ${node.type} with ${parserName}:`, error);
          }
        }
      }
    }
    
    return null;
  }
}

export default CParserBase;