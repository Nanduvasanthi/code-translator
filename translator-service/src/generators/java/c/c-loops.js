// generators/java/c-loops.js - COMPLETELY FIXED VERSION
export class CLoopsGenerator {
  generate(astNode, context = {}, visitor) {
    if (!astNode) return '';
    
    const indentLevel = context.indentLevel !== undefined ? context.indentLevel : 2;
    const indent = '    '.repeat(indentLevel);
    
    console.log(`DEBUG CLoopsGenerator: Generating ${astNode.type} with indentLevel=${indentLevel}`);
    
    if (astNode.type === 'loop_statement') {
      if (astNode.loop_type === 'for') {
        return this.generateForLoop(astNode, indent, visitor, indentLevel);
      } else if (astNode.loop_type === 'while') {
        return this.generateWhileLoop(astNode, indent, visitor, indentLevel);
      } else if (astNode.loop_type === 'do_while') {
        return this.generateDoWhileLoop(astNode, indent, visitor, indentLevel);
      }
    } else if (astNode.type === 'break_statement') {
      return `${indent}break;`;
    } else if (astNode.type === 'continue_statement') {
      return `${indent}continue;`;
    }
    
    return '';
  }

  generateForLoop(node, indent, visitor, baseIndentLevel) {
    console.log(`DEBUG CLoopsGenerator: Generating for loop with ${node.body?.length || 0} body statements`);
    console.log(`DEBUG CLoopsGenerator: For loop init=`, node.initializer);
    console.log(`DEBUG CLoopsGenerator: For loop cond=`, node.condition);
    console.log(`DEBUG CLoopsGenerator: For loop update=`, node.update);
    
    let output = '';
    
    // ⭐⭐ CRITICAL FIX: Generate initializer properly
    const initializer = this.generateInitializer(node.initializer, visitor);
    
    // Generate condition
    const condition = this.generateCondition(node.condition, visitor);
    
    // Generate update
    const update = this.generateUpdate(node.update, visitor);
    
    // ⭐⭐ FIX: Handle missing parts
    const cleanInitializer = initializer || '';
    const cleanCondition = condition || 'true';
    const cleanUpdate = update || '';
    
    console.log(`DEBUG CLoopsGenerator: For loop parts - init: "${cleanInitializer}", cond: "${cleanCondition}", update: "${cleanUpdate}"`);
    
    output += `${indent}for (${cleanInitializer}; ${cleanCondition}; ${cleanUpdate}) {\n`;
    
    // Generate body
    if (node.body && Array.isArray(node.body)) {
      console.log(`DEBUG CLoopsGenerator: Processing ${node.body.length} body statements`);
      for (const stmt of node.body) {
        const stmtContext = { indentLevel: baseIndentLevel + 1 };
        const generated = visitor.visitNode(stmt, stmtContext);
        if (generated && generated.trim()) {
          output += generated + '\n';
        }
      }
    }
    
    output += `${indent}}\n`;
    return output;
  }

  generateWhileLoop(node, indent, visitor, baseIndentLevel) {
    console.log(`DEBUG CLoopsGenerator: Generating while loop with ${node.body?.length || 0} body statements`);
    console.log(`DEBUG CLoopsGenerator: While loop cond=`, node.condition);
    
    let output = '';
    
    // Generate condition
    const condition = this.generateCondition(node.condition, visitor);
    const cleanCondition = condition || 'true';
    
    console.log(`DEBUG CLoopsGenerator: While loop cond: "${cleanCondition}"`);
    
    output += `${indent}while (${cleanCondition}) {\n`;
    
    // Generate body
    if (node.body && Array.isArray(node.body)) {
      for (const stmt of node.body) {
        const stmtContext = { indentLevel: baseIndentLevel + 1 };
        const generated = visitor.visitNode(stmt, stmtContext);
        if (generated && generated.trim()) {
          output += generated + '\n';
        }
      }
    }
    
    output += `${indent}}\n`;
    return output;
  }

  generateDoWhileLoop(node, indent, visitor, baseIndentLevel) {
    console.log(`DEBUG CLoopsGenerator: Generating do-while loop with ${node.body?.length || 0} body statements`);
    console.log(`DEBUG CLoopsGenerator: Do-while loop cond=`, node.condition);
    
    let output = '';
    
    output += `${indent}do {\n`;
    
    // Generate body
    if (node.body && Array.isArray(node.body)) {
      for (const stmt of node.body) {
        const stmtContext = { indentLevel: baseIndentLevel + 1 };
        const generated = visitor.visitNode(stmt, stmtContext);
        if (generated && generated.trim()) {
          output += generated + '\n';
        }
      }
    }
    
    // Generate condition
    const condition = this.generateCondition(node.condition, visitor);
    const cleanCondition = condition || 'true';
    
    console.log(`DEBUG CLoopsGenerator: Do-while loop cond: "${cleanCondition}"`);
    
    output += `${indent}} while (${cleanCondition});\n`;
    
    return output;
  }

  // ⭐⭐ NEW METHOD: Handle variable declarations in for loop initializers
  generateInitializer(expr, visitor) {
    if (!expr) return '';
    
    console.log(`DEBUG CLoopsGenerator: Generating initializer of type: ${expr.type}`);
    
    // Handle variable declarations (int i = 0)
    if (expr.type === 'variable_declaration') {
      // Use the variable generator
      if (visitor.generators?.variables) {
        const varGen = visitor.generators.variables;
        let generated = '';
        
        if (typeof varGen === 'function') {
          generated = varGen(expr, {}, visitor);
        } else if (varGen.generate && typeof varGen.generate === 'function') {
          generated = varGen.generate(expr, {}, visitor);
        } else if (varGen.default && varGen.default.generate && typeof varGen.default.generate === 'function') {
          generated = varGen.default.generate(expr, {}, visitor);
        }
        
        if (generated) {
          // Remove the trailing semicolon for for loop
          return generated.replace(/;$/g, '');
        }
      }
      
      // Fallback: generate manually
      const type = this.mapCTypeToJava(expr.data_type);
      const name = expr.name;
      let value = '';
      
      if (expr.value) {
        value = ' = ' + this.generateExpression(expr.value, visitor);
      }
      
      return `${type} ${name}${value}`;
    }
    
    // Handle assignment expressions (i = 0)
    if (expr.type === 'assignment_expression') {
      return this.generateExpression(expr, visitor);
    }
    
    // Handle empty initializer
    if (expr.type === 'expression' && (!expr.value || expr.value.trim() === '')) {
      return '';
    }
    
    // Default: use expression generation
    return this.generateExpression(expr, visitor);
  }

  generateCondition(condition, visitor) {
    if (!condition) return '';
    
    console.log(`DEBUG CLoopsGenerator: Generating condition of type: ${condition.type}`);
    
    // Use the operators generator
    if (visitor.generators?.operators) {
      const gen = visitor.generators.operators;
      let generated = '';
      
      if (typeof gen === 'function') {
        generated = gen(condition, {}, visitor);
      } else if (gen.generate && typeof gen.generate === 'function') {
        generated = gen.generate(condition, {}, visitor);
      } else if (gen.default && gen.default.generate && typeof gen.default.generate === 'function') {
        generated = gen.default.generate(condition, {}, visitor);
      }
      
      if (generated) {
        return generated;
      }
    }
    
    // Handle simple conditions
    if (condition.type === 'literal' && condition.value === 'true') {
      return 'true';
    }
    
    // ⭐ FIX: Handle comparison expressions properly
    if (condition.type === 'binary_expression') {
      const left = this.generateExpression(condition.left, visitor);
      const right = this.generateExpression(condition.right, visitor);
      const operator = condition.operator || '';
      
      // Map C operators to Java
      const operatorMap = {
        '<': '<',
        '>': '>',
        '<=': '<=',
        '>=': '>=',
        '==': '==',
        '!=': '!=',
        '&&': '&&',
        '||': '||'
      };
      
      const javaOperator = operatorMap[operator] || operator;
      return `${left} ${javaOperator} ${right}`;
    }
    
    // Generate using our expression logic
    const result = this.generateExpression(condition, visitor);
    return result || 'true';
  }

  generateUpdate(update, visitor) {
    if (!update) return '';
    
    console.log(`DEBUG CLoopsGenerator: Generating update of type: ${update.type}`);
    
    // Use the operators generator
    if (visitor.generators?.operators) {
      const gen = visitor.generators.operators;
      let generated = '';
      
      if (typeof gen === 'function') {
        generated = gen(update, {}, visitor);
      } else if (gen.generate && typeof gen.generate === 'function') {
        generated = gen.generate(update, {}, visitor);
      } else if (gen.default && gen.default.generate && typeof gen.default.generate === 'function') {
        generated = gen.default.generate(update, {}, visitor);
      }
      
      if (generated) {
        return generated;
      }
    }
    
    // Default: use expression generation
    return this.generateExpression(update, visitor);
  }

  generateExpression(expr, visitor) {
    if (!expr) return '';
    
    // Handle empty expression
    if (expr.type === 'empty') {
      return '';
    }
    
    // Handle variable declarations separately
    if (expr.type === 'variable_declaration') {
      return this.generateInitializer(expr, visitor);
    }
    
    // Use the operators generator
    if (visitor.generators?.operators) {
      const gen = visitor.generators.operators;
      let generated = '';
      
      if (typeof gen === 'function') {
        generated = gen(expr, {}, visitor);
      } else if (gen.generate && typeof gen.generate === 'function') {
        generated = gen.generate(expr, {}, visitor);
      } else if (gen.default && gen.default.generate && typeof gen.default.generate === 'function') {
        generated = gen.default.generate(expr, {}, visitor);
      }
      
      if (generated) {
        return generated;
      }
    }
    
    // Handle assignment expressions (i = 0)
    if (expr.type === 'assignment_expression') {
      const left = this.generateExpression(expr.left, visitor);
      const right = this.generateExpression(expr.right, visitor);
      const operator = expr.operator || '=';
      return `${left} ${operator} ${right}`;
    }
    
    // Handle update expressions (i++, ++i)
    if (expr.type === 'update_expression') {
      const operand = this.generateExpression(expr.operand, visitor);
      const operator = expr.operator || '';
      
      // Check if it's prefix or postfix
      const text = expr._position?.originalText || '';
      if (text.startsWith('++') || text.startsWith('--')) {
        return `${operator}${operand}`; // Prefix: ++i
      } else {
        return `${operand}${operator}`; // Postfix: i++
      }
    }
    
    // Handle binary expressions (i < 5)
    if (expr.type === 'binary_expression') {
      const left = this.generateExpression(expr.left, visitor);
      const right = this.generateExpression(expr.right, visitor);
      const operator = expr.operator || '';
      return `${left} ${operator} ${right}`;
    }
    
    // Handle simple expressions
    if (expr.type === 'literal') {
      return expr.value || '';
    }
    
    if (expr.type === 'identifier') {
      return expr.name || '';
    }
    
    if (expr.value !== undefined) {
      return expr.value.toString();
    }
    
    if (expr.name) {
      return expr.name;
    }
    
    return '';
  }

  mapCTypeToJava(cType) {
    if (!cType) return 'int';
    
    cType = cType.trim().toLowerCase();
    
    const typeMap = {
      'int': 'int',
      'float': 'float',
      'double': 'double',
      'char': 'char',
      'string': 'String',
      'void': 'void',
      'short': 'short',
      'long': 'long',
      'bool': 'boolean',
      '_bool': 'boolean',
      'boolean': 'boolean',
      'long double': 'double',
      'long long': 'long',
      'unsigned': 'int',
      'signed': 'int',
      'unsigned int': 'int',
      'signed int': 'int',
      'unsigned short': 'short',
      'signed short': 'short',
      'unsigned long': 'long',
      'signed long': 'long',
      'char*': 'String',
      'char *': 'String'
    };
    
    return typeMap[cType] || 'int';
  }
}

export default {
  generate: function(node, context, visitor) {
    const generator = new CLoopsGenerator();
    return generator.generate(node, context, visitor);
  }
};