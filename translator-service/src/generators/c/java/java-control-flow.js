export class JavaControlFlowGenerator {
  constructor() {
    console.log('✅ C JavaControlFlowGenerator initialized (generates C from Java AST)');
  }

  canGenerate(astNode) {
    return astNode.type === 'conditional_statement';
  }

  generate(astNode, context) {
    if (!this.canGenerate(astNode)) {
      console.warn(`JavaControlFlowGenerator cannot generate node type: ${astNode.type}`);
      return '';
    }

    console.log(`JavaControlFlowGenerator processing: ${astNode.type}`);

    return this.generateConditionalStatement(astNode, context);
  }

  generateConditionalStatement(astNode, context) {
  let result = '';
  
  // Generate if condition
  const condition = this.generateExpression(astNode.condition, context);
  result += `if (${condition}) {\n`;
  
  // Generate then branch
  result += this.generateBranch(astNode.then_branch, context, 1);
  result += '    }\n'; // Indented closing brace for if
  
  // Generate elif branches if any
  if (astNode.elif_branches && astNode.elif_branches.length > 0) {
    astNode.elif_branches.forEach(elifBranch => {
      const elifCondition = this.generateExpression(elifBranch.condition, context);
      result += `    else if (${elifCondition}) {\n`; // Indented else if
      result += this.generateBranch(elifBranch.then_branch, context, 1);
      result += '    }\n'; // Indented closing brace for else if
    });
  }
  
  // Generate else branch if exists
  if (astNode.else_branch) {
    result += '    else {\n'; // Indented else
    result += this.generateBranch(astNode.else_branch, context, 1);
    result += '    }\n'; // Indented closing brace for else
  }
  
  return result;
}

  generateExpression(expr, context) {
    if (!expr) {
      console.log('generateExpression: expr is null/undefined');
      return '0';
    }
    
    console.log(`generateExpression: type=${expr.type}, value=${expr.value}, name=${expr.name}`);
    
    if (expr.type === 'identifier') {
      return expr.name;
    } else if (expr.type === 'literal') {
      // Handle different literal types
      if (expr.data_type === 'string') {
        return `"${expr.value}"`;
      }
      return expr.value !== undefined ? expr.value : '0';
    } else if (expr.type === 'binary_expression') {
      const left = this.generateExpression(expr.left, context);
      const right = this.generateExpression(expr.right, context);
      const operator = this.mapJavaOperatorToC(expr.operator);
      return `(${left} ${operator} ${right})`;
    } else if (expr.type === 'comparison_expression') {
      const left = this.generateExpression(expr.left, context);
      const right = this.generateExpression(expr.right, context);
      const operator = this.mapJavaOperatorToC(expr.operator);
      return `(${left} ${operator} ${right})`;
    } else if (expr.type === 'logical_expression') {
      const left = this.generateExpression(expr.left, context);
      const right = this.generateExpression(expr.right, context);
      const operator = this.mapJavaOperatorToC(expr.operator);
      return `(${left} ${operator} ${right})`;
    } else if (expr.type === 'expression') {
      // For expressions like "score >= 90", just return the value
      return expr.value || '0';
    } else if (expr.type === 'string_literal') {
      return `"${expr.value || ''}"`;
    } else if (expr.type === 'assignment_expression') {
      // Handle assignment expressions (for completeness)
      const left = this.generateExpression(expr.left, context);
      const right = this.generateExpression(expr.right, context);
      return `${left} = ${right}`;
    }
    
    // Try using context to generate expression
    if (context && context.generateExpression) {
      return context.generateExpression(expr);
    }
    
    console.log(`Unhandled expression type: ${expr.type}, falling back to '0'`);
    return '0';
  }

  generateBranch(branch, context, indentLevel = 0) {
  if (!branch) return '';
  
  console.log(`generateBranch: type=${branch.type}, statements=${branch.statements?.length || 0}`);
  
  let result = '';
  
  if (branch.type === 'block') {
    // Generate each statement in the block
    if (branch.statements && Array.isArray(branch.statements)) {
      branch.statements.forEach((statement, index) => {
        console.log(`  Statement ${index}: type=${statement.type}`);
        
        // Use context to generate each statement
        if (context && context.generateStatement) {
          const generated = context.generateStatement(statement);
          if (generated) {
            result += this.indent(generated, indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
          } else {
            const fallback = this.generateStatementFallback(statement);
            if (fallback) {
              result += this.indent(fallback + ';', indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
            }
          }
        } else {
          // Fallback: try to handle common cases
          const fallback = this.generateStatementFallback(statement);
          if (fallback) {
            result += this.indent(fallback + ';', indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
          }
        }
      });
    }
  } else if (branch.type === 'expression_statement') {
    if (context && context.generateExpressionStatement) {
      const generated = context.generateExpressionStatement(branch);
      if (generated) {
        result += this.indent(generated, indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
      } else {
        const fallback = this.generateStatementFallback(branch);
        if (fallback) {
          result += this.indent(fallback + ';', indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
        }
      }
    } else {
      const fallback = this.generateStatementFallback(branch);
      if (fallback) {
        result += this.indent(fallback + ';', indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
      }
    }
  } else if (typeof branch === 'string') {
    result += this.indent(branch + ';', indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
  } else if (Array.isArray(branch)) {
    branch.forEach(statement => {
      result += this.indent(statement + ';', indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
    });
  } else {
    // Handle raw statement objects
    const fallback = this.generateStatementFallback(branch);
    if (fallback) {
      result += this.indent(fallback + ';', indentLevel + 1) + '\n'; // <-- FIX: indentLevel + 1
    }
  }
  
  return result;
}

  // Helper method to add indentation
  indent(text, level = 0) {
    const spaces = '    '.repeat(level);
    return spaces + text;
  }

  generateStatementFallback(statement) {
    if (!statement) {
      console.log('generateStatementFallback: statement is null');
      return null;
    }
    
    console.log(`generateStatementFallback: type=${statement.type}`);
    
    if (statement.type === 'variable_declaration') {
      const type = this.mapJavaTypeToC(statement.data_type || 'int');
      const name = statement.name || 'var';
      let value = '';
      
      if (statement.value) {
        value = ` = ${this.generateExpression(statement.value, null)}`;
      } else if (statement.initialValue) {
        value = ` = ${this.generateExpression(statement.initialValue, null)}`;
      }
      
      return `${type} ${name}${value}`;
      
    } else if (statement.type === 'print_statement') {
      // Handle print statements
      if (statement.arguments && statement.arguments.length > 0) {
        const arg = statement.arguments[0];
        if (arg.type === 'string_literal') {
          return `printf("${arg.value || ''}\\n")`;
        } else if (arg.type === 'binary_expression') {
          // Handle string concatenation
          const formatString = this.buildFormatString(arg);
          const args = this.extractFormatArgs(arg);
          if (args.length > 0) {
            return `printf("${formatString}\\n", ${args.join(', ')})`;
          } else {
            return `printf("${formatString}\\n")`;
          }
        }
      }
      return `printf("TODO\\n")`;
      
    } else if (statement.type === 'assignment') {
      const target = statement.target || '';
      const value = this.generateExpression(statement.value, null);
      return `${target} = ${value}`;
      
    } else if (statement.type === 'assignment_expression') {
      // Handle assignment expressions like grade = "A"
      const left = statement.left?.name || '';
      const right = this.generateExpression(statement.right, null);
      
      // Handle string literals
      let rightValue = right;
      if (statement.right?.type === 'literal' && typeof statement.right.value === 'string') {
        rightValue = `"${statement.right.value}"`;
      }
      
      return `${left} = ${rightValue}`;
      
    } else if (statement.type === 'expression_statement') {
      // Try to extract the actual expression
      if (statement.expression) {
        return this.generateExpression(statement.expression, null);
      }
      return null;
    }
    
    console.log(`Unknown statement type in fallback: ${statement.type}`);
    return null;
  }

  buildFormatString(expr) {
    if (!expr) return '';
    
    if (expr.type === 'binary_expression' && expr.operator === '+') {
      const left = this.buildFormatString(expr.left);
      const right = this.buildFormatString(expr.right);
      return left + right;
    } else if (expr.type === 'string_literal') {
      return expr.value || '';
    } else if (expr.type === 'identifier') {
      // Determine format specifier based on variable type
      return '%s'; // Default to string for now
    }
    
    return '';
  }

  extractFormatArgs(expr, args = []) {
    if (!expr) return args;
    
    if (expr.type === 'binary_expression' && expr.operator === '+') {
      this.extractFormatArgs(expr.left, args);
      this.extractFormatArgs(expr.right, args);
    } else if (expr.type === 'identifier') {
      args.push(expr.name);
    }
    
    return args;
  }

  mapJavaOperatorToC(javaOperator) {
    const operatorMap = {
      '==': '==',
      '!=': '!=',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      '&&': '&&',
      '||': '||',
      '!': '!'
    };
    
    return operatorMap[javaOperator] || javaOperator;
  }

  mapJavaTypeToC(javaType) {
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'double': 'double',
      'boolean': 'int',
      'char': 'char',
      'String': 'char*',
      'string': 'char*',
      'byte': 'char',
      'short': 'short',
      'long': 'long'
    };
    
    return typeMap[javaType] || 'int';
  }

  getFormatSpecifier(dataType) {
    const specifierMap = {
      'int': '%d',
      'float': '%f',
      'double': '%lf',
      'char': '%c',
      'string': '%s',
      'String': '%s'
    };
    
    return specifierMap[dataType] || '%d';
  }
}