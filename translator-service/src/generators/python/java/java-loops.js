export class LoopsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'loop_statement';
  }

  generate(astNode, context) {
    const indent = context.getIndent();
    const loopType = astNode.loop_type;
    
    console.log('=== DEBUG LoopsGenerator ===');
    console.log('Loop type:', loopType);
    
    switch (loopType) {
      case 'for':
        return this.generateForLoop(astNode, context, indent);
      case 'while':
        return this.generateWhileLoop(astNode, context, indent);
      case 'do_while':
        return this.generateDoWhileLoop(astNode, context, indent);
      case 'enhanced_for':
        return this.generateEnhancedForLoop(astNode, context, indent);
      default:
        return `${indent}# Unknown loop type: ${loopType}`;
    }
  }

  generateForLoop(astNode, context, indent) {
    console.log('=== DEBUG generateForLoop ===');
    
    const loopInfo = astNode.condition;
    const body = astNode.body;
    
    if (!loopInfo || !loopInfo.initialization || !loopInfo.condition) {
      return `${indent}# For loop (could not parse)`;
    }
    
    // Extract loop variable name
    const varName = loopInfo.initialization.name || 'i';
    
    // Extract start value
    let startValue = 0;
    if (loopInfo.initialization.value) {
      if (typeof loopInfo.initialization.value === 'object') {
        startValue = loopInfo.initialization.value.value || 0;
      } else {
        startValue = loopInfo.initialization.value;
      }
    }
    
    // Handle the condition: i < numbers.length
    let rangeStr = 'range(5)'; // Default fallback
    
    if (loopInfo.condition && loopInfo.condition.type === 'binary_expression') {
      const condition = loopInfo.condition;
      
      if (condition.operator === '<' && condition.right) {
        // Check if right side is a field_access (like numbers.length)
        if (condition.right.type === 'field_access') {
          const arrayName = condition.right.object?.name || 'arr';
          const field = condition.right.field || 'length';
          
          if (field === 'length') {
            // Convert Java .length to Python len()
            rangeStr = `range(${startValue}, len(${arrayName}))`;
          }
        } else if (condition.right.type === 'identifier') {
          // Simple variable as end
          const endVar = condition.right.name;
          rangeStr = `range(${startValue}, ${endVar})`;
        } else if (condition.right.type === 'literal') {
          // Literal number as end
          const endValue = condition.right.value;
          rangeStr = `range(${startValue}, ${endValue})`;
        }
      }
    }
    
    // Generate loop header
    const loopHeader = `${indent}for ${varName} in ${rangeStr}:`;
    
    // Generate loop body with proper indentation
    context.increaseIndent();
    const bodyCode = this.generateBlock(body, context);
    context.decreaseIndent();
    
    return `${loopHeader}\n${bodyCode}`;
  }

  generateWhileLoop(astNode, context, indent) {
    const condition = this.generateExpression(astNode.condition, context);
    const body = astNode.body;
    
    if (!condition) {
      return `${indent}# While loop (could not parse condition)`;
    }
    
    // Generate loop header
    const loopHeader = `${indent}while ${condition}:`;
    
    // Generate loop body with proper indentation
    context.increaseIndent();
    const bodyCode = this.generateBlock(body, context);
    context.decreaseIndent();
    
    return `${loopHeader}\n${bodyCode}`;
  }

  generateDoWhileLoop(astNode, context, indent) {
    const condition = this.generateExpression(astNode.condition, context);
    const body = astNode.body;
    
    if (!condition) {
      return `${indent}# Do-while loop (could not parse)`;
    }
    
    // Generate loop body first
    context.increaseIndent();
    const bodyCode = this.generateBlock(body, context);
    context.decreaseIndent();
    
    // Python doesn't have do-while, so we simulate it
    const invertedCondition = this.invertCondition(condition);
    
    return `${indent}while True:\n${bodyCode}\n${indent}    if ${invertedCondition}:\n${indent}        break`;
  }

  invertCondition(condition) {
    // Simple condition inversion for do-while
    if (condition.includes('<=')) {
      return condition.replace('<=', '>');
    } else if (condition.includes('<')) {
      return condition.replace('<', '>=');
    } else if (condition.includes('>=')) {
      return condition.replace('>=', '<');
    } else if (condition.includes('>')) {
      return condition.replace('>', '<=');
    } else if (condition.includes('==')) {
      return condition.replace('==', '!=');
    } else if (condition.includes('!=')) {
      return condition.replace('!=', '==');
    }
    
    return `not (${condition})`;
  }

  generateEnhancedForLoop(astNode, context, indent) {
    console.log('=== DEBUG generateEnhancedForLoop ===');
    
    const variable = astNode.variable;
    const iterable = astNode.iterable;
    const body = astNode.body;
    
    if (!variable || !iterable) {
      console.log('Missing variable or iterable:', { variable, iterable });
      return `${indent}# Enhanced for loop (could not parse)`;
    }
    
    // Extract names
    const varName = variable.name || 'item';
    const iterableName = iterable.name || '';
    
    console.log(`Variable: ${varName}, Iterable: ${iterableName}`);
    
    // Generate Python for loop
    const loopHeader = `${indent}for ${varName} in ${iterableName}:`;
    
    // Generate body
    context.increaseIndent();
    const bodyCode = this.generateBlock(body, context);
    context.decreaseIndent();
    
    return `${loopHeader}\n${bodyCode}`;
  }

  generateBlock(block, context) {
    console.log('=== DEBUG generateBlock ===');
    
    if (!block || !block.statements || block.statements.length === 0) {
      return context.getIndent() + '    pass';
    }
    
    const statements = block.statements || [];
    const generatedStatements = [];
    
    for (const stmt of statements) {
      console.log(`Processing statement type: ${stmt.type}`);
      let generated = null;
      
      // Map statement type to generator name and get the generator
      const generatorName = this.mapStatementTypeToGenerator(stmt.type);
      if (generatorName && context.getGenerator) {
        const generator = context.getGenerator(generatorName);
        if (generator && generator.canGenerate(stmt)) {
          generated = generator.generate(stmt, context);
          console.log(`Generated via ${generatorName} generator`);
        }
      }
      
      // Fallback for update expressions
      if (!generated && stmt.type === 'update_expression') {
        const varName = stmt.variable?.name || 'i';
        if (stmt.operator === '++') {
          generated = `${context.getIndent()}${varName} += 1`;
        } else if (stmt.operator === '--') {
          generated = `${context.getIndent()}${varName} -= 1`;
        }
      }
      // Fallback for nested loops
      else if (!generated && stmt.type === 'loop_statement') {
        generated = this.generate(stmt, context);
      }
      
      if (generated) {
        generatedStatements.push(generated);
      } else {
        console.log(`Could not generate statement: ${stmt.type}`);
        generatedStatements.push(`${context.getIndent()}# Could not generate: ${stmt.type}`);
      }
    }
    
    const result = generatedStatements.join('\n');
    console.log('Generated block:', result);
    return result;
  }

  // Helper method to map statement types to generator names
  mapStatementTypeToGenerator(statementType) {
    const typeToGeneratorMap = {
      'print_statement': 'print',
      'expression_statement': 'operators',
      'local_variable_declaration': 'variables',
      'variable_declaration': 'variables',
      'assignment_expression': 'operators',
      'array_declaration': 'arrays',
      'method_invocation': 'print', // Usually print statements
      'field_access': 'operators',
      'binary_expression': 'operators',
      'unary_expression': 'operators',
      'array_access': 'operators',
      'line_comment': 'comments',
      'block_comment': 'comments'
    };
    
    return typeToGeneratorMap[statementType] || null;
  }

  // REMOVED: generatePrintStatement method
  // REMOVED: convertToPythonString method
  
  // Keep only this simplified generateExpression for conditions
  generateExpression(expr, context) {
    console.log('=== DEBUG generateExpression ===');
    console.log('Expression type:', expr?.type);
    
    if (!expr) return '';
    
    if (expr.type === 'binary_expression') {
      const left = this.generateExpression(expr.left, context);
      const right = this.generateExpression(expr.right, context);
      const operator = this.mapOperator(expr.operator);
      
      console.log(`Binary expression: ${left} ${operator} ${right}`);
      
      return `${left} ${operator} ${right}`;
    } else if (expr.type === 'literal') {
      if (typeof expr.value === 'string') {
        return `"${expr.value}"`;
      }
      return String(expr.value);
    } else if (expr.type === 'identifier') {
      return expr.name;
    } else if (expr.type === 'variable_declaration') {
      return expr.name;
    } else if (expr.type === 'string_literal') {
      return `"${expr.value}"`;
    } else if (expr.value !== undefined) {
      return String(expr.value);
    }
    
    console.log('Unknown expression type:', expr);
    return '';
  }

  mapOperator(javaOperator) {
    const operatorMap = {
      '&&': 'and',
      '||': 'or',
      '==': '==',
      '!=': '!=',
      '>': '>',
      '<': '<',
      '>=': '>=',
      '<=': '<=',
      '+': '+',
      '-': '-',
      '*': '*',
      '/': '/',
      '%': '%'
    };
    
    return operatorMap[javaOperator] || javaOperator;
  }
}