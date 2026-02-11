export class LoopsGenerator {
  canGenerate(astNode) {
    return astNode && astNode.type === 'loop_statement';
  }

  generate(astNode, context) {
    const { loop_type, variable, iterable, condition, body } = astNode;
    
    if (loop_type === 'for') {
      return this.generateForLoop(variable, iterable, body, context);
    } else if (loop_type === 'while') {
      return this.generateWhileLoop(condition, body, context);
    }
    
    return '// Unknown loop type';
  }

  generateForLoop(variable, iterable, body, context) {
    let javaCode = '';
    
    // Handle different types of iterables
    if (iterable && iterable.type === 'range') {
      // Convert Python range() to Java for loop
      const { start = 0, end } = iterable;
      
      if (start === 0) {
        // range(5) -> for (int i = 0; i < 5; i++)
        javaCode += `for (int ${variable} = ${start}; ${variable} < ${end}; ${variable}++) {\n`;
      } else {
        // range(1, 5) -> for (int i = 1; i < 5; i++)
        javaCode += `for (int ${variable} = ${start}; ${variable} < ${end}; ${variable}++) {\n`;
      }
    } else if (typeof iterable === 'string') {
      // Iterating over a list/array
      // Get the type from context
      const varType = context.getVariableType(iterable);
      let elementType = 'String'; // Default
      
      if (varType && varType.includes('<')) {
        // Extract element type from list<type>
        elementType = varType.substring(5, varType.length - 1);
      }
      
      const javaElementType = this.mapElementType(elementType);
      
      // for fruit in fruits -> for (String fruit : fruits)
      javaCode += `for (${javaElementType} ${variable} : ${iterable}) {\n`;
    } else {
      // Default fallback
      javaCode += `for (int ${variable} = 0; ${variable} < 5; ${variable}++) {\n`;
    }
    
    // Add body with proper indentation
    javaCode += this.generateLoopBody(body, context);
    javaCode += '}';
    
    return javaCode;
  }

  generateWhileLoop(condition, body, context) {
    const conditionStr = this.conditionToJava(condition);
    let javaCode = `while (${conditionStr}) {\n`;
    javaCode += this.generateLoopBody(body, context);
    javaCode += '}';
    return javaCode;
  }

  generateLoopBody(body, context) {
    let javaCode = '';
    const indent = '    '; // 4 spaces for inside loops
    
    if (body && Array.isArray(body)) {
      for (const stmt of body) {
        if (stmt && stmt.type === 'raw') {
          const translated = this.translateStatement(stmt.code, context);
          if (translated) {
            javaCode += indent + translated + '\n';
          }
        } else if (stmt && stmt.type === 'loop_statement') {
          // Handle nested loops recursively
          const nestedLoop = this.generate(stmt, context);
          const lines = nestedLoop.split('\n');
          for (const line of lines) {
            if (line.trim() !== '') {
              javaCode += indent + line + '\n';
            }
          }
        }
      }
    }
    
    return javaCode;
  }

  conditionToJava(condition) {
    if (!condition) return 'true';
    
    if (condition.type === 'comparison') {
      if (condition.expression) {
        return condition.expression;
      } else if (condition.left && condition.operator && condition.right) {
        const left = condition.left.name || condition.left;
        const right = condition.right.value || condition.right;
        return `${left} ${condition.operator} ${right}`;
      }
    } else if (condition.type === 'variable') {
      return condition.name;
    } else if (condition.type === 'expression') {
      return condition.value;
    }
    
    return 'true';
  }

  mapElementType(pythonType) {
    switch(pythonType.toLowerCase()) {
      case 'str':
      case 'string':
        return 'String';
      case 'int':
        return 'int';
      case 'float':
        return 'float';
      case 'bool':
      case 'boolean':
        return 'boolean';
      default:
        return 'Object';
    }
  }

  translateStatement(pythonCode, context) {
    if (!pythonCode) return '';
    
    pythonCode = pythonCode.trim();
    
    // Variable assignment
    if (pythonCode.includes('=')) {
      // Check for augmented assignment (count += 1)
      if (pythonCode.includes('+=') || pythonCode.includes('-=') || 
          pythonCode.includes('*=') || pythonCode.includes('/=')) {
        return this.translateAugmentedAssignment(pythonCode);
      }
      
      const parts = pythonCode.split('=');
      const left = parts[0].trim();
      const right = parts.slice(1).join('=').trim();
      
      // Don't redeclare variables inside loops
      return `${left} = ${right};`;
    }
    
    // Print statement
    if (pythonCode.startsWith('print(')) {
      const match = pythonCode.match(/print\((.+)\)/);
      if (match) {
        const content = match[1].trim();
        // Handle f-strings: f"Iteration {i}" -> "Iteration " + i
        if (content.startsWith('f"') || content.startsWith("f'")) {
          const result = this.translateFString(content);
          return `System.out.println(${result});`;
        } else if (content.startsWith('"') || content.startsWith("'")) {
          const text = content.substring(1, content.length - 1);
          return `System.out.println("${text}");`;
        } else {
          return `System.out.println(${content});`;
        }
      }
    }
    
    // Loop statements (nested loops)
    if (pythonCode.startsWith('for ') || pythonCode.startsWith('while ')) {
      // This will be handled by the main translator
      return `// ${pythonCode}`;
    }
    
    return `// ${pythonCode}`;
  }

  translateAugmentedAssignment(pythonCode) {
    // Handle count += 1 -> count = count + 1
    if (pythonCode.includes('+=')) {
      const parts = pythonCode.split('+=');
      const varName = parts[0].trim();
      const value = parts[1].trim();
      return `${varName} = ${varName} + ${value};`;
    }
    // Add more augmented operators as needed
    
    return pythonCode.replace('=', ' = ') + ';';
  }

  translateFString(content) {
    // Simple f-string translation: f"Iteration {i}" -> "Iteration " + i
    let result = '';
    let inExpression = false;
    let current = '';
    
    // Skip the 'f' and quotes
    const inner = content.substring(2, content.length - 1);
    
    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];
      
      if (char === '{') {
        if (current) {
          result += `"${current}" + `;
          current = '';
        }
        inExpression = true;
      } else if (char === '}') {
        if (current) {
          result += current + ' + ';
          current = '';
        }
        inExpression = false;
      } else {
        current += char;
      }
    }
    
    // Add remaining text
    if (current) {
      if (inExpression) {
        result += current;
      } else {
        result += `"${current}"`;
      }
    } else {
      // Remove trailing " + "
      result = result.substring(0, result.length - 3);
    }
    
    return result;
  }
}