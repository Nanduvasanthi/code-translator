import { PrintStatement } from '../../core/ast-nodes.js';

export class PrintParser {
  canParse(node) {
    if (node.type === 'call') {
      const firstChild = node.child(0);
      return firstChild && firstChild.type === 'identifier' && firstChild.text === 'print';
    }
    return false;
  }

  parse(node, context) {
    const args = [];
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      
      if (child.type === 'argument_list') {
        // Process each argument
        for (let j = 0; j < child.childCount; j++) {
          const arg = child.child(j);
          
          // Skip parentheses and commas
          if (arg.type === '(' || arg.type === ')' || arg.type === ',') {
            continue;
          }
          
          // Handle f-strings with expressions
          if (arg.type === 'string' && (arg.text.startsWith('f"') || arg.text.startsWith("f'"))) {
            const fstringResult = this.parseFStringWithExpressions(arg, context);
            args.push(fstringResult);
          } 
          // Regular string
          else if (arg.type === 'string') {
            args.push({
              type: 'string',
              value: this.extractStringValue(arg.text)
            });
          } 
          // Variable reference
          else if (arg.type === 'identifier') {
            args.push({
              type: 'variable',
              name: arg.text
            });
          } 
          // Number - FIXED: changed 'child.type' to 'arg.type'
          else if (arg.type === 'integer' || arg.type === 'float') {
            args.push({
              type: 'number',
              value: arg.text
            });
          }
          // Subscript expression (array access like numbers[0])
          else if (arg.type === 'subscript') {
            const subscriptResult = this.parseSubscript(arg, context);
            if (subscriptResult) {
              args.push(subscriptResult);
            }
          }
          // Attribute access (like obj.attr)
          else if (arg.type === 'attribute') {
            args.push({
              type: 'attribute',
              object: arg.child(0)?.text || '',
              attribute: arg.child(2)?.text || ''
            });
          }
          // Debug: log unknown types
          else {
            console.log('Unknown argument type in print:', arg.type, arg.text);
          }
        }
        break;
      }
    }
    
    return new PrintStatement(args);
  }

  parseSubscript(node, context) {
  console.log('Parsing subscript:', node.text);
  console.log('Subscript children:');
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    console.log(`  Child ${i}: ${child.type} = "${child.text}"`);
  }
  
  let arrayName = '';
  let indexValue = null;
  
  // Look through all children
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    
    if (child.type === 'identifier') {
      arrayName = child.text;
    } 
    // Check for integer index (e.g., numbers[0])
    else if (child.type === 'integer') {
      indexValue = {
        type: 'number',
        value: child.text
      };
    }
    // Check for unary_operator (e.g., numbers[-1])
    else if (child.type === 'unary_operator') {
      indexValue = this.parseUnaryOperator(child);
    }
    // Check for unary_expression (alternative format)
    else if (child.type === 'unary_expression') {
      indexValue = this.parseUnaryExpression(child);
    }
  }
  
  console.log(`Parsed subscript: array=${arrayName}, index=`, indexValue);
  
  if (arrayName && indexValue !== null) {
    return {
      type: 'subscript',
      array: arrayName,
      index: indexValue
    };
  }
  
  console.log('Failed to parse subscript');
  return null;
}

// ADD THIS NEW METHOD:
parseUnaryOperator(node) {
  console.log('Parsing unary operator:', node.text);
  
  // For "-1", the text is "-1" directly
  const text = node.text;
  
  // Check if it starts with minus sign
  if (text.startsWith('-')) {
    const numberPart = text.substring(1); // Remove the minus
    if (/^\d+$/.test(numberPart)) {
      return {
        type: 'number',
        value: '-' + numberPart
      };
    }
  }
  
  // Default fallback
  return {
    type: 'number',
    value: '0'
  };
}

// Keep the existing parseUnaryExpression method:
parseUnaryExpression(node) {
  console.log('Parsing unary expression:', node.text);
  
  // Look for - operator followed by a number
  let foundMinus = false;
  let numberValue = '';
  
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child.type === '-') {
      foundMinus = true;
    } else if (child.type === 'integer') {
      numberValue = child.text;
    }
  }
  
  if (foundMinus && numberValue) {
    return {
      type: 'number',
      value: '-' + numberValue
    };
  }
  
  // Default fallback
  return {
    type: 'number',
    value: '0'
  };
}

  parseUnaryExpression(node) {
    console.log('Parsing unary expression for index:', node.text);
    
    // Look for - operator followed by a number
    let foundMinus = false;
    let numberValue = '';
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === '-') {
        foundMinus = true;
      } else if (child.type === 'integer') {
        numberValue = child.text;
      }
    }
    
    if (foundMinus && numberValue) {
      return {
        type: 'number',
        value: '-' + numberValue
      };
    }
    
    // Default fallback
    return {
      type: 'number',
      value: '0'
    };
  }

  parseFStringWithExpressions(stringNode, context) {
    const text = stringNode.text;
    
    // Remove f-prefix and quotes
    let content = '';
    if (text.startsWith('f"') && text.endsWith('"')) {
      content = text.substring(2, text.length - 1);
    } else if (text.startsWith("f'") && text.endsWith("'")) {
      content = text.substring(2, text.length - 1);
    } else {
      // Not an f-string, treat as regular string
      return {
        type: 'string',
        value: this.extractStringValue(text)
      };
    }
    
    // Split by { and } to find expressions
    const parts = [];
    let currentIndex = 0;
    let braceCount = 0;
    let expressionStart = -1;
    
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{' && (i === 0 || content[i-1] !== '{')) {
        if (braceCount === 0) {
          // Add text before expression
          if (currentIndex < i) {
            parts.push({
              type: 'text',
              value: content.substring(currentIndex, i)
            });
          }
          expressionStart = i + 1;
        }
        braceCount++;
      } else if (content[i] === '}' && (i === 0 || content[i-1] !== '}')) {
        braceCount--;
        if (braceCount === 0 && expressionStart !== -1) {
          // Extract expression
          const expression = content.substring(expressionStart, i);
          
          // Parse the expression (with ternary support)
          const parsedExpr = this.parseExpressionWithTernary(expression.trim());
          parts.push(parsedExpr);
          
          currentIndex = i + 1;
          expressionStart = -1;
        }
      }
    }
    
    // Add remaining text
    if (currentIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.substring(currentIndex)
      });
    }
    
    return {
      type: 'fstring_with_parts',
      parts: parts,
      original: text
    };
  }

  parseExpressionWithTernary(expr) {
    // Check for ternary operator first: "Pass" if score >= 60 else "Fail"
    // Look for pattern: VALUE if CONDITION else VALUE
    const ternaryRegex = /^(.+?)\s+if\s+(.+?)\s+else\s+(.+)$/;
    const ternaryMatch = expr.match(ternaryRegex);
    
    if (ternaryMatch) {
      const thenValue = ternaryMatch[1].trim();
      const condition = ternaryMatch[2].trim();
      const elseValue = ternaryMatch[3].trim();
      
      return {
        type: 'ternary_expression',
        condition: this.parseExpression(condition),
        thenValue: this.parseOperand(thenValue),
        elseValue: this.parseOperand(elseValue)
      };
    }
    
    // If not ternary, parse as regular expression
    return this.parseExpression(expr);
  }

  parseExpression(expr) {
    // First, try to parse with operators that have multiple characters
    const operators = [
      '**', '//', '==', '!=', '<=', '>=', 'and', 'or'
    ];
    
    for (const op of operators) {
      if (expr.includes(op)) {
        // Split by operator, but be careful with spaces
        const parts = expr.split(op);
        if (parts.length === 2) {
          const left = parts[0].trim();
          const right = parts[1].trim();
          
          if (op === '**' || op === '//' || op === '==' || op === '!=' || 
              op === '<=' || op === '>=') {
            return {
              type: 'binary_expression',
              left: this.parseOperand(left),
              operator: op,
              right: this.parseOperand(right)
            };
          } else if (op === 'and' || op === 'or') {
            return {
              type: 'logical_expression',
              left: this.parseOperand(left),
              operator: op,
              right: this.parseOperand(right)
            };
          }
        }
      }
    }
    
    // Then try single character operators
    const singleCharOps = ['+', '-', '*', '/', '%', '<', '>'];
    for (const op of singleCharOps) {
      // Use regex to find operator not surrounded by other operator characters
      const regex = new RegExp(`([^\\s${singleCharOps.join('\\')}])\\s*\\${op}\\s*([^\\s${singleCharOps.join('\\')}])`);
      const match = expr.match(regex);
      if (match) {
        const left = match[1].trim();
        const right = match[2].trim();
        return {
          type: 'binary_expression',
          left: this.parseOperand(left),
          operator: op,
          right: this.parseOperand(right)
        };
      }
    }
    
    // Handle 'not' operator
    if (expr.startsWith('not ')) {
      const operand = expr.substring(4).trim();
      return {
        type: 'unary_expression',
        operator: 'not',
        operand: this.parseOperand(operand)
      };
    }
    
    // Single operand
    return this.parseOperand(expr);
  }

  parseOperand(operand) {
    operand = operand.trim();
    
    // Remove parentheses if present
    if (operand.startsWith('(') && operand.endsWith(')')) {
      operand = operand.substring(1, operand.length - 1).trim();
      return this.parseExpression(operand);
    }
    
    // Check if it's a number
    if (/^-?\d+$/.test(operand)) {
      return { type: 'number', value: operand };
    }
    
    if (/^-?\d+\.\d+$/.test(operand)) {
      return { type: 'number', value: operand };
    }
    
    // Check if it's a boolean
    if (operand === 'True' || operand === 'true') {
      return { type: 'boolean', value: true };
    }
    
    if (operand === 'False' || operand === 'false') {
      return { type: 'boolean', value: false };
    }
    
    // Check if it's a string literal (in quotes)
    if ((operand.startsWith('"') && operand.endsWith('"')) ||
        (operand.startsWith("'") && operand.endsWith("'"))) {
      return {
        type: 'string',
        value: operand.substring(1, operand.length - 1)
      };
    }
    
    // Check if it's None/null
    if (operand === 'None') {
      return { type: 'null', value: 'null' };
    }
    
    // Assume it's a variable
    return { type: 'variable', name: operand };
  }

  extractStringValue(text) {
    // Remove quotes from string
    let value = text;
    if ((text.startsWith('"') && text.endsWith('"')) ||
        (text.startsWith("'") && text.endsWith("'"))) {
      value = text.substring(1, text.length - 1);
    }
    
    // Process escape sequences
    return this.processEscapeSequences(value);
  }

  processEscapeSequences(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\\' && i + 1 < str.length) {
        const nextChar = str[i + 1];
        switch (nextChar) {
          case 'n':
            result += '\n';
            i++;
            break;
          case 't':
            result += '\t';
            i++;
            break;
          case 'r':
            result += '\r';
            i++;
            break;
          case '\\':
            result += '\\';
            i++;
            break;
          case '"':
            result += '"';
            i++;
            break;
          case "'":
            result += "'";
            i++;
            break;
          default:
            result += str[i];
        }
      } else {
        result += str[i];
      }
    }
    return result;
  }
}