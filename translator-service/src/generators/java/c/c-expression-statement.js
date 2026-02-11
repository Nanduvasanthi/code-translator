// generators/java/c-expression-statement.js - UPDATED TO MATCH BASIC-SYNTAX.JS
export class CExpressionStatementGenerator {
  generate(astNode, context = {}, visitor) {
    if (!astNode) return '';
    
    const indentLevel = context.indentLevel !== undefined ? context.indentLevel : 2;
    const indent = '    '.repeat(indentLevel);
    
    console.log(`DEBUG CExpressionStatementGenerator: Generating ${astNode.type} at indentLevel=${indentLevel}`);
    
    // ⭐⭐ FIXED: Handle array_assignment (numbers[0] = 10;)
    if (astNode.type === 'array_assignment') {
      return this.generateArrayAssignment(astNode, indent, visitor);
    }
    
    // ⭐⭐ FIXED: Handle assignment_expression (i = 5;)
    if (astNode.type === 'assignment_expression') {
      return this.generateAssignmentExpression(astNode, indent, visitor);
    }
    
    // ⭐⭐ ADDED: Handle c_expression (generic C expression)
    if (astNode.type === 'c_expression') {
      return this.generateCExpression(astNode, indent, visitor);
    }
    
    if (astNode.type === 'expression_statement') {
      if (astNode.expression) {
        console.log(`DEBUG CExpressionStatementGenerator: Expression type: ${astNode.expression.type}`);
        
        // Handle different types of expressions
        if (astNode.expression.type === 'call_expression') {
          // Handle printf calls
          return this.generateCallExpression(astNode.expression, indent, visitor);
        } else if (astNode.expression.type === 'update_expression') {
          // Handle i++, count++
          return this.generateUpdateExpression(astNode.expression, indent, visitor);
        } else if (astNode.expression.value) {
          // Generic expression with value
          const exprText = astNode.expression.value.toString().trim();
          if (exprText) {
            return indent + exprText + ';';
          }
        }
      }
      
      // Fallback: use original text
      if (astNode._position?.originalText) {
        const text = astNode._position.originalText.trim();
        if (text && !text.endsWith(';')) {
          return indent + text + ';';
        } else if (text) {
          return indent + text;
        }
      }
    }
    
    return '';
  }

  // ⭐⭐ FIXED: Generate array assignment like numbers[0] = 10;
  generateArrayAssignment(node, indent, visitor) {
    console.log(`DEBUG CExpressionStatementGenerator: Generating array assignment:`, node);
    
    // Get array name
    const arrayName = node.arrayName || '';
    
    // Get index
    let index = '';
    if (node.index) {
      if (typeof node.index === 'string') {
        index = node.index;
      } else if (node.index.value) {
        index = node.index.value;
      } else if (node.index.name) {
        index = node.index.name;
      }
    }
    
    // Get value
    let value = '';
    if (node.value) {
      if (node.value.type === 'literal') {
        value = node.value.value;
      } else if (node.value.type === 'char_literal') {
        let val = node.value.value;
        if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        value = `'${val}'`;
      } else if (node.value.type === 'string_literal') {
        let val = node.value.value;
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        value = `"${val}"`;
      } else if (node.value.type === 'identifier') {
        value = node.value.name || node.value.value || '';
      }
    }
    
    return `${indent}${arrayName}[${index}] = ${value};`;
  }

  // ⭐⭐ NEW: Generate assignment expression like i = 5;
  generateAssignmentExpression(node, indent, visitor) {
  console.log(`DEBUG CExpressionStatementGenerator: Generating assignment expression:`, node);
  
  // Get left side (variable name)
  let left = '';
  if (node.left) {
    if (node.left.type === 'identifier') {
      left = node.left.name || '';
    } else if (node.left.type === 'unknown' && node.left.value) {
      // ⭐⭐ FIX: Handle unknown type with value (e.g., numbers[0])
      left = node.left.value;
    }
    // ⭐⭐ ADD: Handle other possible types
    else if (node.left.value) {
      left = node.left.value;
    } else if (node.left.name) {
      left = node.left.name;
    }
  }
  
  // Get operator
  const operator = node.operator || '=';
  
  // Get right side (value)
  let right = '';
  if (node.right) {
    if (node.right.type === 'literal') {
      right = node.right.value;
    } else if (node.right.type === 'char_literal') {
      let val = node.right.value;
      if (val.startsWith("'") && val.endsWith("'")) {
        val = val.substring(1, val.length - 1);
      }
      right = `'${val}'`;
    } else if (node.right.type === 'string_literal') {
      let val = node.right.value;
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      right = `"${val}"`;
    } else if (node.right.type === 'identifier') {
      right = node.right.name || node.right.value || '';
    } else if (node.right.value) {
      // ⭐⭐ ADD: Handle unknown type with value
      right = node.right.value;
    }
  }
  
  return `${indent}${left} ${operator} ${right};`;
}

  // ⭐⭐ FIXED: Remove old generateVariableAssignment method since we're using assignment_expression

  // ⭐⭐ NEW: Generate generic C expression
  generateCExpression(node, indent, visitor) {
    console.log(`DEBUG CExpressionStatementGenerator: Generating C expression`);
    
    // Get the C expression code
    let code = node.code || '';
    if (typeof code === 'string') {
      code = code.trim();
      if (code && !code.endsWith(';')) {
        code += ';';
      }
    }
    
    return `${indent}${code}`;
  }

  generateCallExpression(expr, indent, visitor) {
    // Check if it's a printf call
    if (expr._position?.originalText && expr._position.originalText.includes('printf')) {
      // Use the print generator if available
      if (visitor.generators?.print) {
        const printGen = visitor.generators.print;
        let generated = '';
        
        if (typeof printGen === 'function') {
          generated = printGen(expr, {}, visitor);
        } else if (printGen.generate && typeof printGen.generate === 'function') {
          generated = printGen.generate(expr, {}, visitor);
        } else if (printGen.default && printGen.default.generate && typeof printGen.default.generate === 'function') {
          generated = printGen.default.generate(expr, {}, visitor);
        }
        
        if (generated) {
          return indent + generated.trim();
        }
      }
    }
    
    // Generic call expression
    if (expr.value) {
      return indent + expr.value + ';';
    }
    
    return '';
  }

  generateUpdateExpression(expr, indent, visitor) {
    // Use the operators generator
    if (visitor.generators?.operators) {
      const opGen = visitor.generators.operators;
      let generated = '';
      
      if (typeof opGen === 'function') {
        generated = opGen(expr, {}, visitor);
      } else if (opGen.generate && typeof opGen.generate === 'function') {
        generated = opGen.generate(expr, {}, visitor);
      } else if (opGen.default && opGen.default.generate && typeof opGen.default.generate === 'function') {
        generated = opGen.default.generate(expr, {}, visitor);
      }
      
      if (generated) {
        return indent + generated + ';';
      }
    }
    
    // Simple update expression
    if (expr.operator && expr.operand) {
      const operand = expr.operand.name || expr.operand.value || '';
      return indent + operand + expr.operator + ';';
    }
    
    return '';
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new CExpressionStatementGenerator();
    return generator.generate(node, context, visitor);
  }
};