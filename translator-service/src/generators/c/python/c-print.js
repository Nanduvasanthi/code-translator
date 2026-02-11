export class PrintGenerator {
  constructor() {
    // We'll handle operators directly
  }

  canGenerate(astNode) {
    return astNode.type === 'print_statement';
  }

  generate(astNode, context) {
    const args = astNode.args || [];
    
    if (args.length === 0) {
      return 'printf("\\n");';
    }
    
    // Check if we have any f-strings
    const hasFString = args.some(arg => arg.type === 'fstring_with_parts');
    
    if (hasFString) {
      return this.generateFStringPrint(args, context);
    }
    
    // Regular print statement
    return this.generateRegularPrint(args, context);
  }

  generateRegularPrint(args, context) {
    const formatParts = [];
    const valueParts = [];
    let needsStdbool = false;
    
    for (const arg of args) {
      const { format, value, needsBool } = this.processPrintArg(arg, context);
      
      if (format) {
        formatParts.push(format);
      }
      
      if (value !== undefined) {
        valueParts.push(value);
      }
      
      if (needsBool) {
        needsStdbool = true;
      }
    }
    
    const formatString = formatParts.join(' ');
    const finalFormat = formatString.endsWith('\\n') ? formatString : formatString + '\\n';
    
    // Add to context if we need stdbool.h
    if (needsStdbool) {
      context.needsStdbool = true;
    }
    
    if (valueParts.length > 0) {
      return `printf("${finalFormat}", ${valueParts.join(', ')});`;
    } else {
      return `printf("${finalFormat}");`;
    }
  }

  generateFStringPrint(args, context) {
    let formatString = '';
    const valueParts = [];
    let needsStdbool = false;
    
    for (const arg of args) {
      if (arg.type === 'fstring_with_parts') {
        const { format, values, needsBool } = this.processFString(arg, context);
        formatString += format;
        valueParts.push(...values);
        
        if (needsBool) {
          needsStdbool = true;
        }
      } else {
        // Mix of f-string and regular args
        const { format, value, needsBool } = this.processPrintArg(arg, context);
        formatString += (format || '');
        if (value !== undefined) {
          valueParts.push(value);
        }
        
        if (needsBool) {
          needsStdbool = true;
        }
      }
    }
    
    const finalFormat = formatString.endsWith('\\n') ? formatString : formatString + '\\n';
    
    if (needsStdbool) {
      context.needsStdbool = true;
    }
    
    if (valueParts.length > 0) {
      return `printf("${finalFormat}", ${valueParts.join(', ')});`;
    } else {
      return `printf("${finalFormat}");`;
    }
  }

  processPrintArg(arg, context) {
    switch (arg.type) {
      case 'string':
  // Handle both literal \n strings and actual newline characters
  let stringValue = arg.value || '';
  console.log(`DEBUG PrintGen: String arg value: "${stringValue}", type: ${typeof stringValue}`);
  
  // Convert actual newlines to escaped newlines
  stringValue = stringValue.replace(/\n/g, '\\n');  // Single escape for C
  // Also handle if it comes as literal backslash-n
  stringValue = stringValue.replace(/\\n/g, '\\n');
  // Escape quotes
  stringValue = stringValue.replace(/"/g, '\\"');
  
  console.log(`DEBUG PrintGen: Escaped value: "${stringValue}"`);
  return {
    format: stringValue,
    value: undefined
  };
        
      case 'number':
        // Check if it's a float
        if (arg.value && arg.value.includes('.')) {
          return {
            format: '%f',
            value: arg.value
          };
        }
        return {
          format: '%d',
          value: arg.value || '0'
        };
        
      case 'variable':
        const varName = arg.name;
        const varType = context.getVariableType(varName);
        
        if (varType === 'char*') {
          return {
            format: '%s',
            value: varName
          };
        } else if (varType === 'int') {
          return {
            format: '%d',
            value: varName
          };
        } else if (varType === 'float') {
          return {
            format: '%f',
            value: varName
          };
        } else if (varType === 'bool') {
          return {
            format: '%s',
            value: `${varName} ? "true" : "false"`,
            needsBool: true
          };
        }
        // Default to string
        return {
          format: '%s',
          value: varName
        };
        
      case 'subscript':
  // Get the array type from context
  const arrayType = context.getVariableType(arg.array);
  
  // Determine format based on array type
  let format, indexValue;
  
  if (arrayType === 'char*' || arrayType === 'string') {
    format = '%s';
  } else if (arrayType === 'int') {
    format = '%d';
  } else if (arrayType === 'float') {
    format = '%f';
  } else {
    format = '%d'; // default
  }
  
  // Handle negative indexing
  indexValue = this.extractIndexValue(arg.index);
  
  // Check if index is negative
  const numericIndex = parseInt(indexValue, 10);
  if (numericIndex < 0 || (typeof indexValue === 'string' && indexValue.startsWith('-'))) {
    // Convert Python negative index to C: array[sizeof(array)/sizeof(array[0]) - 1]
    return {
      format: format,
      value: `${arg.array}[sizeof(${arg.array})/sizeof(${arg.array}[0]) ${numericIndex}]`
    };
  }
  
  return {
    format: format,
    value: `${arg.array}[${indexValue}]`
  };
        
      default:
        console.log(`Unknown print arg type: ${arg.type}`);
        return {
          format: '%d',
          value: '0'
        };
    }
  }

  processFString(fstring, context) {
    const parts = fstring.parts || [];
    let format = '';
    const values = [];
    let needsBool = false;
    
    for (const part of parts) {
      if (part.type === 'text') {
        format += part.value || '';
      } else if (part.type === 'variable') {
        const varType = context.getVariableType(part.name);
        
        if (varType === 'char*') {
          format += '%s';
          values.push(part.name);
        } else if (varType === 'int') {
          format += '%d';
          values.push(part.name);
        } else if (varType === 'float') {
          format += '%f';
          values.push(part.name);
        } else if (varType === 'bool') {
          format += '%s';
          values.push(`${part.name} ? "true" : "false"`);
          needsBool = true;
        } else {
          format += '%d';
          values.push(part.name);
        }
      } else if (part.type === 'number') {
        if (part.value && part.value.includes('.')) {
          format += '%f';
          values.push(part.value);
        } else {
          format += '%d';
          values.push(part.value);
        }
      } else if (part.type === 'string') {
        format += part.value || '';
      } else if (part.type === 'binary_expression') {
        const expression = this.generateExpressionDirectly(part, context);
        const resultType = this.inferExpressionType(part, context);
        const operator = part.operator;
        
        // Special handling based on operator
        if (operator === '/') {
          // Python-style division: convert to float
          format += '%.2f';
          const left = this.generateOperand(part.left, context);
          const right = this.generateOperand(part.right, context);
          values.push(`(float)${left} / ${right}`);
        } else if (operator === '**') {
          // Power operator
          format += '%.0f';
          const left = this.generateOperand(part.left, context);
          const right = this.generateOperand(part.right, context);
          values.push(`pow(${left}, ${right})`);
        } else if (operator === '//') {
          // Floor division
          format += '%d';
          const left = this.generateOperand(part.left, context);
          const right = this.generateOperand(part.right, context);
          values.push(`${left} / ${right}`);
        } else if (resultType === 'float') {
          format += '%f';
          values.push(expression);
        } else if (resultType === 'bool') {
          // Boolean comparison - use %d for 1/0 output
          format += '%d';
          values.push(expression);
        } else {
          format += '%d';
          values.push(expression);
        }
      } else if (part.type === 'comparison_expression') {
        // Use %d for comparison results (1 or 0)
        const expression = this.generateExpressionDirectly(part, context);
        format += '%d';
        values.push(expression);
      } else if (part.type === 'logical_expression') {
        // Logical expressions use %s with true/false
        const expression = this.generateExpressionDirectly(part, context);
        format += '%s';
        values.push(`${expression} ? "true" : "false"`);
        needsBool = true;
      } else if (part.type === 'unary_expression') {
        const expression = this.generateExpressionDirectly(part, context);
        const operator = part.operator;
        
        if (operator === 'not') {
          format += '%s';
          values.push(`${expression} ? "true" : "false"`);
          needsBool = true;
        } else {
          format += '%d';
          values.push(expression);
        }
      } else if (part.type === 'ternary_expression') {
        const condition = this.generateExpressionDirectly(part.condition,context);
        const thenValue = this.generateValue(part.thenValue, context);
        const elseValue = this.generateValue(part.elseValue, context);

        format += '%s';
        values.push(`(${condition}) ? ${thenValue} : ${elseValue}`);
      }
      else {
        format += '%d';
        values.push('0');
      }
    }
    
    return { format, values, needsBool };
  }

  generateValue(valueNode, context) {
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


  
  // Helper methods for expression handling
  generateExpression(expr, context) {
    return this.generateExpressionDirectly(expr, context);
  }

  generateExpressionDirectly(expr, context) {
    if (!expr) return '0';
    
    switch (expr.type) {
      case 'binary_expression':
        const left = this.generateOperand(expr.left, context);
        const right = this.generateOperand(expr.right, context);
        const operator = this.mapOperator(expr.operator);
        
        if (expr.operator === '**') {
          return `pow(${left}, ${right})`;
        }
        
        if (expr.operator === '//') {
          return `${left} / ${right}`;
        }
        
        return `(${left} ${operator} ${right})`;
        
      case 'comparison_expression':
      case 'logical_expression':
        const left2 = this.generateOperand(expr.left, context);
        const right2 = this.generateOperand(expr.right, context);
        const operator2 = this.mapOperator(expr.operator);
        return `(${left2} ${operator2} ${right2})`;
        
      case 'unary_expression':
        const operand = this.generateOperand(expr.operand, context);
        const operator3 = this.mapOperator(expr.operator);
        return `${operator3}(${operand})`;
        
      default:
        return '0';
    }
  }

  generateOperand(operand, context) {
    if (!operand) return '0';
    
    if (operand.type === 'variable') {
      return operand.name;
    } else if (operand.type === 'number') {
      return operand.value;
    } else if (operand.type === 'string') {
      return `"${operand.value}"`;
    } else if (operand.type === 'boolean') {
      return operand.value ? 'true' : 'false';
    }
    
    return '0';
  }

  inferExpressionType(expr, context) {
    if (!expr) return 'int';
    
    if (expr.type === 'binary_expression') {
      const comparisonOps = ['==', '!=', '<', '>', '<=', '>=', 'is', 'is not'];
      
      // Check if this is actually a comparison
      if (comparisonOps.includes(expr.operator)) {
        return 'bool'; // For format detection, but we'll use %d
      }
      
      const leftType = this.inferOperandType(expr.left, context);
      const rightType = this.inferOperandType(expr.right, context);
      
      // If either is float, result is float
      if (leftType === 'float' || rightType === 'float') {
        return 'float';
      }
      
      // Division produces float in Python
      if (expr.operator === '/') {
        return 'float';
      }
      
      return 'int';
    } else if (expr.type === 'comparison_expression') {
      return 'bool'; // For format detection, but we'll use %d
    } else if (expr.type === 'logical_expression') {
      return 'bool';
    } else if (expr.type === 'unary_expression') {
      if (expr.operator === 'not') {
        return 'bool';
      }
      return this.inferOperandType(expr.operand, context);
    }
    
    return 'int';
  }

  inferOperandType(operand, context) {
    if (!operand) return 'int';
    
    if (operand.type === 'variable') {
      return context.getVariableType(operand.name) || 'int';
    } else if (operand.type === 'number') {
      return operand.value && operand.value.includes('.') ? 'float' : 'int';
    } else if (operand.type === 'boolean') {
      return 'bool';
    } else if (operand.type === 'string') {
      return 'char*';
    }
    
    return 'int';
  }

  extractIndexValue(indexNode) {
  if (!indexNode) return '0';
  
  if (indexNode.type === 'number') {
    return indexNode.value || '0';
  }
  
  // Handle if indexNode is a string (like '-1')
  if (typeof indexNode === 'string') {
    return indexNode;
  }
  
  // Handle if indexNode has a value property
  if (typeof indexNode === 'object' && indexNode.value !== undefined) {
    return indexNode.value;
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
      '**': '**',
      '//': '/',
      '==': '==',
      '!=': '!=',
      '<': '<',
      '>': '>',
      '<=': '<=',
      '>=': '>=',
      'and': '&&',
      'or': '||',
      'not': '!'
    };
    
    return operatorMap[pythonOp] || pythonOp;
  }
}