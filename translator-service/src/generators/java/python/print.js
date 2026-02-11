import { PrintStatement } from '../../../core/ast-nodes.js';

export class PrintGenerator {
  canGenerate(astNode) {
    return astNode && astNode instanceof PrintStatement;
  }

  generate(astNode, context) {
    if (!astNode || !astNode.args || astNode.args.length === 0) {
      return 'System.out.println();';
    }

    // Convert each argument to Java expression
    const javaArgs = astNode.args.map(arg => {
      return this.argToJava(arg, context);
    });

    // If only one argument, print it directly
    if (javaArgs.length === 1) {
      return `System.out.println(${javaArgs[0]});`;
    }
    
    // Multiple arguments: concatenate with spaces
    return `System.out.println(${javaArgs.join(' + " " + ')});`;
  }

  argToJava(arg, context) {
    if (!arg) return '""';
    
    switch (arg.type) {
      case 'string':
        return `"${this.escapeString(arg.value)}"`;
      
      case 'fstring_with_parts':
        return this.fstringWithPartsToJava(arg, context);
      
      case 'variable':
        return arg.name;
      
      case 'number':
        return arg.value;
      
      case 'boolean':
        return arg.value ? 'true' : 'false';
      
      case 'null':
        return 'null';
      
      case 'binary_expression':
      case 'logical_expression':
        return this.binaryExpressionToJava(arg, context);
      
      case 'unary_expression':
        return this.unaryExpressionToJava(arg, context);
      
      case 'ternary_expression':
        return this.ternaryExpressionToJava(arg, context);
      
      case 'subscript':
        return this.subscriptToJava(arg, context);
      
      case 'attribute':
        return `${arg.object}.${arg.attribute}`;
      
      default:
        console.log('Unknown arg type in print:', arg.type);
        return `"${arg.value || ''}"`;
    }
  }

  subscriptToJava(subscript, context) {
    const { array, index } = subscript;
    
    // Convert negative indices (Python supports -1 for last element)
    let javaIndex = this.argToJava(index, context);
    
    // Handle negative indices: Python's -1 -> Java's array.length - 1
    if (index.type === 'number' && index.value.startsWith('-')) {
      const absValue = index.value.substring(1);
      javaIndex = `${array}.length - ${absValue}`;
    }
    
    return `${array}[${javaIndex}]`;
  }

  fstringWithPartsToJava(fstring, context) {
    if (!fstring.parts || fstring.parts.length === 0) {
      return '""';
    }

    const javaParts = fstring.parts.map(part => {
      if (part.type === 'text') {
        return `"${this.escapeString(part.value)}"`;
      } else {
        // Handle expressions within f-string
        return this.argToJava(part, context);
      }
    });

    // Join all parts with +
    return javaParts.join(' + ');
  }

  binaryExpressionToJava(expr, context) {
    const left = this.argToJava(expr.left, context);
    const right = this.argToJava(expr.right, context);
    
    // Map Python operators to Java
    switch (expr.operator) {
      case '**':
        return `Math.pow(${left}, ${right})`;
      
      case '//':
        return `(int) Math.floor(${left} / ${right})`;
      
      case 'and':
        return `(${left} && ${right})`;
      
      case 'or':
        return `(${left} || ${right})`;
      
      case '==':
      case '!=':
      case '<':
      case '>':
      case '<=':
      case '>=':
      case '+':
      case '-':
      case '*':
      case '/':
      case '%':
        // These operators are the same in Java
        return `(${left} ${expr.operator} ${right})`;
      
      default:
        return `(${left} ${expr.operator} ${right})`;
    }
  }

  unaryExpressionToJava(expr, context) {
    const operand = this.argToJava(expr.operand, context);
    
    if (expr.operator === 'not') {
      return `!${operand}`;
    }
    
    return `${expr.operator}${operand}`;
  }

  ternaryExpressionToJava(expr, context) {
    const condition = this.argToJava(expr.condition, context);
    const thenValue = this.argToJava(expr.thenValue, context);
    const elseValue = this.argToJava(expr.elseValue, context);
    
    return `(${condition} ? ${thenValue} : ${elseValue})`;
  }

  escapeString(str) {
    if (!str) return '';
    
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const nextChar = i + 1 < str.length ? str[i + 1] : '';
      
      // Check for \n sequence
      if (char === '\\' && nextChar === 'n') {
        result += '\\n';
        i++; // Skip the 'n'
      }
      // Check for other escape sequences
      else if (char === '\\' && nextChar === 't') {
        result += '\\t';
        i++;
      }
      else if (char === '\\' && nextChar === 'r') {
        result += '\\r';
        i++;
      }
      else if (char === '\\' && nextChar === '\\') {
        result += '\\\\';
        i++;
      }
      else if (char === '\\' && nextChar === '"') {
        result += '\\"';
        i++;
      }
      else if (char === '"') {
        result += '\\"';
      }
      else if (char === '\\') {
        // Single backslash not followed by special char
        result += '\\\\';
      }
      else if (char === '\n') {
        // Actual newline character
        result += '\\n';
      }
      else if (char === '\t') {
        // Actual tab character
        result += '\\t';
      }
      else if (char === '\r') {
        // Actual carriage return
        result += '\\r';
      }
      else {
        result += char;
      }
    }
    
    return result;
  }
}