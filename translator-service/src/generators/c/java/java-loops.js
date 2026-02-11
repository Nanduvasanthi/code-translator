export class JavaLoopsGenerator {
  constructor() {
    console.log('✅ C JavaLoopsGenerator initialized');
  }

  canGenerate(astNode) {
    return astNode.type === 'loop_statement';
  }

  generate(astNode, context) {
    if (!this.canGenerate(astNode)) {
      console.warn(`JavaLoopsGenerator cannot generate node type: ${astNode.type}`);
      return '';
    }

    console.log(`JavaLoopsGenerator processing ${astNode.loop_type} loop`);
    console.log('DEBUG astNode structure:', JSON.stringify(astNode, null, 2));

    switch (astNode.loop_type) {
      case 'for':
        return this.generateForLoop(astNode, context);
      case 'while':
        return this.generateWhileLoop(astNode, context);
      case 'do_while':
        return this.generateDoWhileLoop(astNode, context);
      case 'enhanced_for':
        return this.generateEnhancedForLoop(astNode, context);
      default:
        console.log(`Unknown loop type: ${astNode.loop_type}`);
        return `// TODO: Convert ${astNode.loop_type} loop`;
    }
  }

  generateForLoop(astNode, context) {
    console.log('DEBUG generateForLoop astNode:', astNode);
    
    // Extract initialization, condition, update from the proper structure
    let initialization = null;
    let conditionNode = astNode.condition;
    let updateNode = null;
    
    if (conditionNode && conditionNode.initialization && conditionNode.condition && conditionNode.update) {
      console.log('Found for loop structure inside condition property');
      initialization = conditionNode.initialization;
      conditionNode = conditionNode.condition;
      updateNode = conditionNode.update;
    }
    
    const init = this.generateForInitialization(initialization || astNode.variable, context);
    const condition = this.generateCondition(conditionNode, context);
    const update = this.generateForUpdate(updateNode || astNode, context);
    
    // Get the current indent level from context
    const currentIndent = context.currentIndent || 0;
    const body = this.generateLoopBody(astNode.body, context, currentIndent + 1);

    // Generate proper indentation for closing brace
    const indentSpaces = '    '.repeat(currentIndent);
    const indentForBody = '    '.repeat(currentIndent + 1);
return `for (${init}; ${condition}; ${update}) {\n${body}${indentForBody}}`;  }

  generateWhileLoop(astNode, context) {
    console.log('DEBUG generateWhileLoop astNode:', astNode);
    
    const condition = this.generateCondition(astNode.condition, context);
    
    // Get the current indent level from context
    const currentIndent = context.currentIndent || 0;
    const body = this.generateLoopBody(astNode.body, context, currentIndent + 1);

    // Generate proper indentation for closing brace
    const indentSpaces = '    '.repeat(currentIndent);
   const indentForBody = '    '.repeat(currentIndent + 1);
return `while (${condition}) {\n${body}${indentForBody}}`;

  }

  generateDoWhileLoop(astNode, context) {
    console.log('DEBUG generateDoWhileLoop astNode:', astNode);
    
    const condition = this.generateCondition(astNode.condition, context);
    
    // Get the current indent level from context
    const currentIndent = context.currentIndent || 0;
    const body = this.generateLoopBody(astNode.body, context, currentIndent + 1);

    // Generate proper indentation for closing brace
    const indentSpaces = '    '.repeat(currentIndent);
    const indentForBody = '    '.repeat(currentIndent + 1);
return `do {\n${body}${indentForBody}} while (${condition});`;
  }

  generateEnhancedForLoop(astNode, context) {
    console.log('=== START Enhanced For Loop Generation ===');
    console.log('Full astNode:', JSON.stringify(astNode, null, 2));
    
    // Get the iteration variable and array
    const iterationVariable = astNode.variable;
    const arrayExpression = astNode.iterable;
    
    console.log('Iteration variable:', iterationVariable);
    console.log('Array expression:', arrayExpression);
    
    // Get array name
    let arrayName = 'arr';
    if (arrayExpression) {
      if (typeof arrayExpression === 'object' && arrayExpression.name) {
        arrayName = arrayExpression.name;
      } else if (typeof arrayExpression === 'string') {
        arrayName = arrayExpression;
      }
    }
    
    console.log('Array name:', arrayName);
    
    // Get element type from iteration variable
    let elementType = 'int';
    let elementName = 'item';
    
    if (iterationVariable && typeof iterationVariable === 'object') {
      // Try to get type from various possible locations
      const javaType = 
                      iterationVariable.data_type || 
                      iterationVariable.javaType || 
                      'String';
      
      elementType = this.mapJavaTypeToC(javaType);
      elementName = iterationVariable.name || 'item';
      
      console.log(`Element: ${elementName} (Java: ${javaType}, C: ${elementType})`);
    }
    
    // Create a new context for the loop body
    const loopContext = this.createLoopContext(context);
    
    // Add the iteration variable to the loop context
    if (loopContext.addSymbol) {
      loopContext.addSymbol(elementName, {
        cType: elementType,
        javaType: iterationVariable?.type || iterationVariable?.data_type || 'String',
        varName: elementName,
        isLocal: true
      });
    }
    
    // Get the current indent level from context
    const currentIndent = context.currentIndent || 0;
    const body = this.generateLoopBody(astNode.body, loopContext, currentIndent + 1);
    
    // Generate the C for loop structure
    let loopCode = '';
    
    // Create index variable
    const indexVar = loopContext.generateUniqueId ? 
      loopContext.generateUniqueId('i') : 'i';
    
    // Calculate array size dynamically
    const sizeExpression = `sizeof(${arrayName}) / sizeof(${arrayName}[0])`;
    
    // Generate the complete for loop with proper indentation
    const indentSpaces = '    '.repeat(currentIndent);
    const indentForBody = '    '.repeat(currentIndent + 1);
loopCode = `for (int ${indexVar} = 0; ${indexVar} < ${sizeExpression}; ${indexVar}++) {\n`;
loopCode += `${indentSpaces}        ${elementType} ${elementName} = ${arrayName}[${indexVar}];\n`;
loopCode += `${body}${indentForBody}}`;
    
    console.log('Generated enhanced for loop:');
    console.log(loopCode);
    console.log('=== END Enhanced For Loop Generation ===');
    
    return loopCode;
  }

  generateForInitialization(variable, context) {
    if (!variable) return 'int i = 0';
    
    if (typeof variable === 'object') {
      const varType = this.mapJavaTypeToC(variable.data_type || variable.type || 'int');
      const varName = variable.name || 'i';
      
      const finalVarName = context && context.generateUniqueId ? 
        context.generateUniqueId(varName) : varName;
      
      let initValue = '0';
      if (variable.value) {
        if (variable.value.type === 'literal') {
          initValue = variable.value.value || '0';
        } else if (variable.value.value !== undefined) {
          initValue = variable.value.value;
        }
      } else if (variable.initialValue) {
        initValue = variable.initialValue;
      }
      
      if (context && context.addSymbol) {
        context.addSymbol(varName, {
          cType: varType,
          javaType: variable.data_type || variable.type,
          varName: finalVarName
        });
      }
      
      return `${varType} ${finalVarName} = ${initValue}`;
    }
    
    return 'int i = 0';
  }

  generateCondition(condition, context) {
    console.log('DEBUG generateCondition called with:', condition);
    
    if (!condition) {
      console.warn('No condition provided for loop, using 1 (infinite loop)');
      return '1';
    }
    
    if (condition.condition && condition.condition.type === 'binary_expression') {
      console.log('Found nested condition structure, extracting condition.condition');
      const actualCondition = condition.condition;
      const left = this.generateExpressionPart(actualCondition.left, context);
      const right = this.generateExpressionPart(actualCondition.right, context);
      const operator = actualCondition.operator || '<';
      return `${left} ${operator} ${right}`;
    }
    
    if (typeof condition === 'string') return condition;
    
    if (condition.type === 'binary_expression') {
      console.log('Parsing binary expression condition:', condition);
      const left = this.generateExpressionPart(condition.left, context);
      const right = this.generateExpressionPart(condition.right, context);
      const operator = condition.operator || '<';
      
      console.log(`Condition parsed: ${left} ${operator} ${right}`);
      return `${left} ${operator} ${right}`;
    }
    
    if (condition.value !== undefined) {
      return condition.value;
    }
    
    if (condition.left && condition.right && condition.operator) {
      console.log('Condition has left/right/operator properties directly');
      const left = this.generateExpressionPart(condition.left, context);
      const right = this.generateExpressionPart(condition.right, context);
      return `${left} ${condition.operator} ${right}`;
    }
    
    console.warn('Could not parse condition, using 1:', JSON.stringify(condition, null, 2));
    return '1';
  }

  generateExpressionPart(expr, context) {
  if (!expr) return '0';
  
  console.log('DEBUG generateExpressionPart:', expr);
  
  if (typeof expr === 'string') return expr;
  
  if (expr.type === 'identifier') {
    if (context && context.getSymbol) {
      const symbol = context.getSymbol(expr.name);
      if (symbol && symbol.varName) {
        return symbol.varName;
      }
    }
    return expr.name;
  } else if (expr.type === 'literal') {
    return expr.value !== undefined ? expr.value : '0';
  } else if (expr.type === 'binary_expression') {
    const left = this.generateExpressionPart(expr.left, context);
    const right = this.generateExpressionPart(expr.right, context);
    const operator = expr.operator || '+';
    
    if (operator === '+' && (left === '0' || right === '0')) {
      return left === '0' ? right : left;
    }
    
    return `(${left} ${operator} ${right})`;
  } else if (expr.type === 'field_access' || expr.type === 'member_expression') {
    console.log('Processing field access in generateExpressionPart:', expr);
    
    const objectName = expr.object?.name || expr.name || 'obj';
    const fieldName = expr.field || expr.property || 'field';
    
    console.log(`Field access: ${objectName}.${fieldName}`);
    
    // Special case: array.length
    if (fieldName === 'length') {
      // Check if it's an array by looking up in context
      if (context && context.getSymbol) {
        const symbol = context.getSymbol(objectName);
        if (symbol) {
          // Convert to C array size calculation
          console.log(`Converting array.length to sizeof(${objectName})/sizeof(${objectName}[0])`);
          return `sizeof(${objectName}) / sizeof(${objectName}[0])`;
        }
      }
    }
    
    // For other field accesses
    return `${objectName}.${fieldName}`;
  } else if (expr.type === 'unary_expression') {
    const operand = this.generateExpressionPart(expr.operand, context);
    const operator = expr.operator || '!';
    return `${operator}${operand}`;
  } else if (expr.type === 'parenthesized_expression') {
    if (expr.expression) {
      const inner = this.generateExpressionPart(expr.expression, context);
      return `(${inner})`;
    }
    return '()';
  }
  
  console.warn(`Unknown expression type in generateExpressionPart: ${expr.type}`);
  return '0';
}

  generateForUpdate(updateNode, context) {
    console.log('DEBUG generateForUpdate:', updateNode);
    
    if (!updateNode) return 'i++';
    
    if (updateNode && typeof updateNode === 'object') {
      if (updateNode.update && updateNode.update.type === 'update_expression') {
        updateNode = updateNode.update;
      }
      else if (updateNode.initialization && updateNode.condition && updateNode.update) {
        updateNode = updateNode.update;
      }
      else if (updateNode.loop_type === 'for' && updateNode.condition && updateNode.condition.update) {
        updateNode = updateNode.condition.update;
      }
    }
    
    let varName = 'i';
    
    if (updateNode.type === 'update_expression') {
      if (updateNode.variable && updateNode.variable.name) {
        const originalName = updateNode.variable.name;
        if (context && context.getSymbol) {
          const symbol = context.getSymbol(originalName);
          if (symbol && symbol.varName) {
            varName = symbol.varName;
          } else {
            varName = originalName;
          }
        } else {
          varName = originalName;
        }
        return `${varName}${updateNode.operator}`;
      }
    }
    
    return `${varName}++`;
  }

  generateLoopBody(body, context, indentLevel = 0) {
    if (!body) {
        return this.indent('// Empty loop body', indentLevel + 1) + '\n';
    }
    
    let bodyCode = '';
    
    if (body.type === 'block' && Array.isArray(body.statements)) {
        body.statements.forEach(statement => {
            const stmtCode = this.generateStatement(statement, context, indentLevel + 1);
            if (stmtCode) {
                bodyCode += stmtCode + '\n';
            }
        });
    } else if (Array.isArray(body)) {
        body.forEach(statement => {
            const stmtCode = this.generateStatement(statement, context, indentLevel + 1);
            if (stmtCode) {
                bodyCode += stmtCode + '\n';
            }
        });
    } else if (typeof body === 'string') {
        bodyCode += this.indent(body + ';', indentLevel + 1) + '\n';
    } else {
        const stmtCode = this.generateStatement(body, context, indentLevel + 1);
        if (stmtCode) {
            bodyCode += stmtCode + '\n';
        }
    }
    
    return bodyCode;
}

  generateStatement(statement, context, indentLevel = 0) {
    if (!statement) return '';
    
    console.log(`Generating loop statement: ${statement.type}`);
    
    if (statement.type === 'print_statement') {
      if (context && context.getGenerator) {
        const printGenerator = context.getGenerator('print');
        if (printGenerator && printGenerator.canGenerate(statement)) {
          return this.indent(printGenerator.generate(statement, context), indentLevel);
        }
      }
      return this.generatePrintStatement(statement, context, indentLevel);
    } else if (statement.type === 'variable_declaration') {
      if (context && context.getGenerator) {
        const varGenerator = context.getGenerator('variables');
        if (varGenerator && varGenerator.canGenerate(statement)) {
          return this.indent(varGenerator.generate(statement, context), indentLevel);
        }
      }
      return this.generateVariableDeclaration(statement, indentLevel);
    } else if (statement.type === 'assignment_expression') {
      return this.generateAssignmentExpression(statement, indentLevel);
    } else if (statement.type === 'update_expression') {
      return this.generateUpdateExpression(statement, context, indentLevel);
    } else if (statement.type === 'expression_statement') {
      if (statement.expression) {
        const expr = this.generateExpression(statement.expression, context);
        if (expr && expr !== '0') {
          return this.indent(expr + ';', indentLevel);
        }
      }
    } else if (statement.type === 'loop_statement') {
      const nestedContext = this.createLoopContext(context);
      const nestedLoop = this.generate(statement, {...nestedContext, currentIndent: indentLevel - 1});
      return this.indent(nestedLoop, indentLevel);
    }
    
    return this.indent(`// TODO: Generate ${statement.type}`, indentLevel);
  }

  generatePrintStatement(printStmt, context, indentLevel) {
    if (!printStmt.arguments || printStmt.arguments.length === 0) {
      return this.indent('printf("\\n");', indentLevel);
    }
    
    const arg = printStmt.arguments[0];
    
    console.log('Print statement argument:', arg);
    
    if (arg.type === 'string_literal') {
      let escapedValue = (arg.value || '').replace(/"/g, '\\"');
      if (printStmt.isNewLine) {
        escapedValue += '\\n';
      }
      return this.indent(`printf("${escapedValue}");`, indentLevel);
    } else if (arg.type === 'binary_expression') {
      const formatInfo = this.buildFormatStringWithSpecifiers(arg, context);
      console.log('Format info:', formatInfo);
      
      if (printStmt.isNewLine) {
        formatInfo.format += '\\n';
      }
      
      if (formatInfo.args.length > 0) {
        return this.indent(`printf("${formatInfo.format}", ${formatInfo.args.join(', ')});`, indentLevel);
      } else {
        return this.indent(`printf("${formatInfo.format}");`, indentLevel);
      }
    }
    
    return this.indent('printf("TODO\\n");', indentLevel);
  }

  buildFormatStringWithSpecifiers(expr, context, format = '', args = []) {
    if (!expr) return { format, args };
    
    console.log('DEBUG buildFormatStringWithSpecifiers:', expr.type, expr);
    
    if (expr.type === 'binary_expression' && expr.operator === '+') {
      console.log('Processing binary expression +');
      const leftResult = this.buildFormatStringWithSpecifiers(expr.left, context, format, args);
      console.log('Left result:', leftResult);
      const rightResult = this.buildFormatStringWithSpecifiers(expr.right, context, leftResult.format, leftResult.args);
      console.log('Right result:', rightResult);
      return rightResult;
    } else if (expr.type === 'string_literal') {
      let escapedValue = (expr.value || '').replace(/"/g, '\\"');
      console.log('Adding string literal:', escapedValue);
      return { format: format + escapedValue, args };
    } else if (expr.type === 'identifier') {
      let formatSpecifier = '%d';
      let actualVarName = expr.name;
      
      if (context && context.getSymbol) {
        const symbol = context.getSymbol(expr.name);
        console.log('Found symbol for', expr.name, ':', symbol);
        
        if (symbol) {
          let javaType = null;
          let cType = null;
          
          if (symbol.javaType) {
            javaType = symbol.javaType;
            cType = symbol.cType;
            actualVarName = symbol.varName || expr.name;
          } else if (symbol.type && typeof symbol.type === 'object') {
            if (symbol.type.javaType) {
              javaType = symbol.type.javaType;
              cType = symbol.type.cType;
              actualVarName = symbol.type.varName || expr.name;
            }
          }
          
          if (javaType === 'String' || cType === 'char*' || cType === 'char*[]') {
            formatSpecifier = '%s';
            console.log(`✅ Detected string type for ${expr.name}, using %s`);
          } else if (javaType === 'int' || cType === 'int') {
            formatSpecifier = '%d';
          } else if (javaType === 'float' || cType === 'float') {
            formatSpecifier = '%f';
          } else if (javaType === 'double' || cType === 'double') {
            formatSpecifier = '%lf';
          } else if (javaType === 'char' || cType === 'char') {
            formatSpecifier = '%c';
          } else if (javaType === 'long' || cType === 'long long') {
            formatSpecifier = '%lld';
          }
        }
      }
      
      console.log('Adding identifier:', expr.name, 'as', formatSpecifier, 'actual name:', actualVarName);
      return { format: format + formatSpecifier, args: [...args, actualVarName] };
    }
    
    console.log('Unknown expression type, returning as-is');
    return { format: format + '?', args };
  }

  generateVariableDeclaration(varDecl, indentLevel) {
    const type = this.mapJavaTypeToC(varDecl.data_type || 'int');
    const name = varDecl.name || 'var';
    let value = '';
    
    if (varDecl.value) {
      if (varDecl.value.type === 'array_literal') {
        return this.indent(`// TODO: Array initialization for ${name}`, indentLevel);
      } else {
        value = ` = ${this.generateExpressionPart(varDecl.value, null)}`;
      }
    } else if (varDecl.initialValue) {
      value = ` = ${this.generateExpressionPart(varDecl.initialValue, null)}`;
    }
    
    return this.indent(`${type} ${name}${value};`, indentLevel);
  }

  generateAssignmentExpression(assignExpr, indentLevel) {
    const left = assignExpr.left?.name || '';
    let right = this.generateExpressionPart(assignExpr.right, null);
    
    if (assignExpr.right?.type === 'literal' && typeof assignExpr.right.value === 'string') {
      right = `"${assignExpr.right.value}"`;
    }
    
    return this.indent(`${left} = ${right};`, indentLevel);
  }

  generateUpdateExpression(updateExpr, context, indentLevel) {
    if (!updateExpr) return '';
    
    let variableName = updateExpr.variable?.name || 'i';
    
    if (context && context.getSymbol) {
      const symbol = context.getSymbol(variableName);
      if (symbol && symbol.varName) {
        variableName = symbol.varName;
      }
    }
    
    const operator = updateExpr.operator || '++';
    const isPostfix = updateExpr.is_postfix !== false;
    
    if (isPostfix) {
      return this.indent(`${variableName}${operator};`, indentLevel);
    } else {
      return this.indent(`${operator}${variableName};`, indentLevel);
    }
  }

  generateExpression(expr, context) {
    if (!expr) return '0';
    
    if (expr.type === 'identifier') {
      if (context && context.getSymbol) {
        const symbol = context.getSymbol(expr.name);
        return symbol && symbol.varName ? symbol.varName : expr.name;
      }
      return expr.name;
    } else if (expr.type === 'literal') {
      return expr.value !== undefined ? expr.value : '0';
    } else if (expr.type === 'binary_expression') {
      const left = this.generateExpression(expr.left, context);
      const right = this.generateExpression(expr.right, context);
      const operator = expr.operator || '+';
      
      if (operator === '+' && (left === '0' || right === '0')) {
        return left === '0' ? right : left;
      }
      
      return `(${left} ${operator} ${right})`;
    }
    
    return '0';
  }

  // Helper method to create a new context for loops
  createLoopContext(parentContext) {
    if (!parentContext) {
      return {};
    }
    
    // Create a shallow clone
    const newContext = Object.create(parentContext);
    
    // Copy essential properties
    if (parentContext.getGenerator) {
      newContext.getGenerator = parentContext.getGenerator.bind(parentContext);
    }
    
    if (parentContext.getSymbol) {
      newContext.getSymbol = parentContext.getSymbol.bind(parentContext);
    }
    
    if (parentContext.addSymbol) {
      newContext.addSymbol = parentContext.addSymbol.bind(parentContext);
    }
    
    if (parentContext.generateUniqueId) {
      newContext.generateUniqueId = parentContext.generateUniqueId.bind(parentContext);
    }
    
    // Create a new symbol table for the loop scope
    newContext.symbols = { ...parentContext.symbols };
    
    return newContext;
  }

  // Helper method for indentation
  indent(text, level = 0) {
    const spaces = '    '.repeat(level);
    return spaces + text;
  }

  mapJavaTypeToC(javaType) {
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'double': 'double',
      'char': 'char',
      'String': 'char*',
      'string': 'char*',
      'byte': 'signed char',
      'short': 'short',
      'long': 'long long',
      'boolean': 'bool'
    };
    
    return typeMap[javaType] || 'int';
  }
}