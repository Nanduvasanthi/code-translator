import { TranslationContext } from './context.js';
import { JavaToCVisitor } from './visitor.js';

export class JavaToCTranslator {
  constructor(parsers, generators) {
    this.parsers = parsers;
    this.generators = generators;
    this.needsStdbool = false; // Track if boolean is used
  }

  translate(javaCode) {
    try {
      console.log('=== JAVA TO C TRANSLATION PROCESS ===');
      
      // Reset flags
      this.needsStdbool = false;
      
      // Create context
      const context = new TranslationContext();
      
      // Pass translator reference to context for tracking
      context.translator = this;
      
      // Register parsers and generators
      for (const [name, parser] of Object.entries(this.parsers)) {
        context.registerParser(name, parser);
      }
      
      for (const [name, generator] of Object.entries(this.generators)) {
        context.registerGenerator(name, generator);
      }
      
      // Parse Java code
      const tree = this.parseJavaCode(javaCode);
      if (!tree) {
        throw new Error('Failed to parse Java code');
      }
      
      console.log('✅ Java code parsed successfully');
      console.log('AST root type:', tree.rootNode.type);
      
      // Extract main method
      const mainMethod = this.extractMainMethod(tree.rootNode);
      if (!mainMethod) {
        throw new Error('No main method found in Java code');
      }
      
      console.log('✅ Main method found');
      
      // Visit the AST
      const visitor = new JavaToCVisitor(context);
      const cAst = visitor.visit(mainMethod);
      
      if (!cAst) {
        throw new Error('Failed to convert AST');
      }
      
      console.log('✅ AST converted to C structure');
      
      // Generate C code
      const cCode = this.generateCCode(cAst, context);
      
      return {
        success: true,
        code: cCode,
        warnings: context.getWarnings(),
        ast: cAst,
        hasBoolean: this.needsStdbool
      };
      
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        code: `/* Translation Error: ${error.message} */\n/* Original Java code:\n${javaCode}\n*/`,
        error: error.message,
        warnings: ['Translation failed: ' + error.message]
      };
    }
  }

  // Method to track boolean usage from other parts of the code
  trackBooleanUsage() {
    console.log('✓ Boolean usage detected - will include <stdbool.h>');
    this.needsStdbool = true;
  }

  parseJavaCode(javaCode) {
    try {
      const parser = new Parser();
      const Java = require('tree-sitter-java');
      parser.setLanguage(Java);
      
      return parser.parse(javaCode);
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }

  extractMainMethod(rootNode) {
    // Find class declaration
    const classNode = this.findNodeByType(rootNode, 'class_declaration');
    if (!classNode) {
      console.log('No class declaration found');
      return null;
    }
    
    // Find method declarations
    const methodNodes = this.collectNodesByType(classNode, 'method_declaration');
    console.log(`Found ${methodNodes.length} methods in class`);
    
    for (const methodNode of methodNodes) {
      // Check if this is the main method
      const methodName = this.getMethodName(methodNode);
      const modifiers = this.getModifiers(methodNode);
      const parameters = this.getMethodParameters(methodNode);
      
      console.log(`Checking method: ${methodName}, modifiers: ${modifiers.join(', ')}, params: ${parameters}`);
      
      if (methodName === 'main' && 
          modifiers.includes('public') && 
          modifiers.includes('static') &&
          parameters === 'String[] args') {
        console.log('✅ Found main method');
        return methodNode;
      }
    }
    
    console.log('❌ No main method found');
    return null;
  }

  findNodeByType(node, type) {
    if (node.type === type) return node;
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      const found = this.findNodeByType(child, type);
      if (found) return found;
    }
    
    return null;
  }

  collectNodesByType(node, type, results = []) {
    if (node.type === type) {
      results.push(node);
    }
    
    for (let i = 0; i < node.childCount; i++) {
      this.collectNodesByType(node.child(i), type, results);
    }
    
    return results;
  }

  getMethodName(methodNode) {
    for (let i = 0; i < methodNode.childCount; i++) {
      const child = methodNode.child(i);
      if (child.type === 'identifier') {
        return child.text;
      }
    }
    return '';
  }

  getModifiers(methodNode) {
    const modifiers = [];
    for (let i = 0; i < methodNode.childCount; i++) {
      const child = methodNode.child(i);
      if (child.type === 'modifiers') {
        for (let j = 0; j < child.childCount; j++) {
          const modifier = child.child(j);
          modifiers.push(modifier.text);
        }
      }
    }
    return modifiers;
  }

  getMethodParameters(methodNode) {
    const params = [];
    for (let i = 0; i < methodNode.childCount; i++) {
      const child = methodNode.child(i);
      if (child.type === 'formal_parameters') {
        return child.text;
      }
    }
    return '';
  }

  generateCCode(cAst, context) {
  console.log('Generating C code from AST...');
  console.log('Boolean needed?', this.needsStdbool);
  console.log('cAst: ',cAst);
  console.log('cAst.statements:',cAst?.statements);
  console.log('cAst.body:',cAst?.body);
  console.log('cAst.bosy.statements:',cAst?.body?.statements);
  const lines = [];
  
  // Always include stdio.h for printf
  lines.push('#include <stdio.h>');
  
  // Include stdbool.h only if boolean was used
  if (this.needsStdbool) {
    console.log('Adding #include <stdbool.h>');
    lines.push('#include <stdbool.h>');
  } else {
    console.log('No boolean variables found, skipping stdbool.h');
  }
  
  lines.push(''); // Empty line after includes
  
  lines.push('int main() {');
  
  // Generate the body
  let bodyLines = [];
  if (cAst && cAst.statements) {
    bodyLines = this.generateBody(cAst, context, 1);
  } else if (cAst && cAst.body && cAst.body.statements) {
    bodyLines = this.generateBody(cAst.body, context, 1);
  }
  
  console.log('Body lines generated:', bodyLines.length);
  console.log('Last body line:', bodyLines[bodyLines.length - 1]);
  
  lines.push(...bodyLines);
  
  // Check if we need to add a blank line before return
  // Only add if there are statements and last line is not empty
  if (bodyLines.length > 0) {
    const lastBodyLine = bodyLines[bodyLines.length - 1];
    console.log('Checking last body line for blank line:', lastBodyLine);
    // Check if last line is not empty and doesn't already contain return
    if (lastBodyLine && lastBodyLine.trim() !== '' && 
        !lastBodyLine.includes('return') && 
        !lastBodyLine.trim().startsWith('}')) {
      console.log('Adding blank line before return');
      lines.push('');
    } else {
      console.log('Not adding blank line. Conditions:');
      console.log('- lastBodyLine exists:', !!lastBodyLine);
      console.log('- lastBodyLine trimmed not empty:', lastBodyLine && lastBodyLine.trim() !== '');
      console.log('- lastBodyLine contains "return":', lastBodyLine && lastBodyLine.includes('return'));
      console.log('- lastBodyLine starts with "}":', lastBodyLine && lastBodyLine.trim().startsWith('}'));
    }
  } else {
    console.log('No body lines, not adding blank line');
  }
  
  // Add return statement
  lines.push('    return 0;');
  lines.push('}');
  
  const cCode = lines.join('\n');
  console.log('=== FINAL C CODE ===');
  console.log(cCode);
  console.log('====================');
  
  return cCode;
}

  checkForBooleanVariables(astNode) {
    if (!astNode) return false;
    
    // Helper function to recursively check for boolean variables
    const checkNode = (node) => {
      if (!node) return false;
      
      if (node.type === 'variable_declaration') {
        // Check if it's a boolean variable
        if (node.data_type === 'boolean' || node.varType === 'bool') {
          return true;
        }
      }
      
      // Check statements in body
      if (node.statements && Array.isArray(node.statements)) {
        for (const stmt of node.statements) {
          if (checkNode(stmt)) return true;
        }
      }
      
      // Check body property
      if (node.body && node.body.statements && Array.isArray(node.body.statements)) {
        for (const stmt of node.body.statements) {
          if (checkNode(stmt)) return true;
        }
      }
      
      return false;
    };
    
    return checkNode(astNode);
  }

  generateFunction(func, context) {
    const lines = [];
    
    // Function signature
    const params = func.parameters ? func.parameters.map(p => `${p.type} ${p.name}`).join(', ') : 'void';
    const signature = `${func.returnType || 'int'} ${func.name}(${params})`;
    lines.push(signature);
    lines.push('{');
    
    // Function body
    if (func.body) {
      const bodyLines = this.generateBody(func.body, context, 1);
      lines.push(...bodyLines);
    } else {
      lines.push('    // Empty function body');
    }
    
    // Add empty line before return for non-void functions
    if (func.returnType !== 'void' && func.name === 'main') {
      lines.push('');
      lines.push('    return 0;');
    }
    
    lines.push('}');
    
    return lines.join('\n');
  }

  generateBody(body, context, indentLevel = 0) {
    const lines = [];
    const indent = '    '.repeat(indentLevel);
    
    if (!body || !body.statements || body.statements.length === 0) {
      lines.push(`${indent}// Empty body`);
      return lines;
    }
    
    // Track previous statement type to add empty lines
    let prevType = null;
    
    body.statements.forEach((statement, index) => {
      const stmtCode = this.generateStatement(statement, context, indentLevel);
      
      // Add empty line before certain statement types for better formatting
      if (index > 0) {
        const currentType = statement.type;
        const shouldAddEmptyLine = (
          (prevType === 'variable_declaration' && currentType !== 'variable_declaration') ||
          (prevType === 'print_statement' && currentType === 'print_statement') ||
          (statement.type === 'comment' && statement.isBlock)
        );
        
        if (shouldAddEmptyLine) {
          lines.push('');
        }
      }
      
      if (stmtCode) {
        if (Array.isArray(stmtCode)) {
          lines.push(...stmtCode);
        } else {
          lines.push(stmtCode);
        }
      }
      
      prevType = statement.type;
    });
    
    return lines;
  }

  generateStatement(statement, context, indentLevel = 0) {
    if (!statement) return '';
    
    const indent = '    '.repeat(indentLevel);
    
    console.log(`Generating statement: ${statement.type}`);
    
    // Try to find a generator for this statement
    const generatorName = this.mapNodeTypeToGenerator(statement.type);
    if (generatorName && context.generators[generatorName]) {
      const generator = context.generators[generatorName];
      if (generator.canGenerate(statement)) {
        const generated = generator.generate(statement, context);
        if (generated) {
          return `${indent}${generated}`;
        }
      }
    }
    
    // Fallback generation
    switch (statement.type) {
      case 'variable_declaration':
        const varType = statement.varType || statement.data_type || 'int';
        const varName = statement.varName || statement.name || 'var';
        const initialValue = statement.initialValue || statement.value || '';
        if (initialValue) {
          return `${indent}${varType} ${varName} = ${initialValue};`;
        } else {
          return `${indent}${varType} ${varName};`;
        }
      
      case 'print_statement':
        const args = (statement.arguments || []).map(arg => 
          arg.value || arg.name || ''
        ).join(' ');
        return `${indent}printf("${args}\\n");`;
      
      case 'if_statement':
        return this.generateIfStatement(statement, context, indentLevel);
      
      case 'for_loop':
        return this.generateForLoop(statement, context, indentLevel);
      
      case 'while_loop':
        return this.generateWhileLoop(statement, context, indentLevel);
      
      case 'comment':
        const comment = statement.isBlock ? statement.text : `// ${statement.text}`;
        return `${indent}${comment}`;
      
      default:
        console.warn(`Unhandled statement type: ${statement.type}`);
        return `${indent}// TODO: Generate ${statement.type}`;
    }
  }

  mapNodeTypeToGenerator(nodeType) {
    const generatorMap = {
      'variable_declaration': 'variables',
      'function_declaration': 'functions',
      'print_statement': 'print',
      'comment': 'comments',
      'conditional_statement': 'controlFlow',
      'if_statement': 'controlFlow',
      'loop_statement': 'loops',
      'for_loop': 'loops',
      'while_loop': 'loops',
      'array_declaration': 'arrays',
      'binary_expression': 'operators',
      'conditional_expression': 'ternary',
      'expression_statement': 'expressionStatement'
    };
    
    return generatorMap[nodeType];
  }

  generateIfStatement(statement, context, indentLevel) {
    const lines = [];
    const indent = '    '.repeat(indentLevel);
    
    const condition = this.generateExpression(statement.condition, context);
    lines.push(`${indent}if (${condition}) {`);
    
    if (statement.thenBlock) {
      const thenLines = this.generateBody(statement.thenBlock, context, indentLevel + 1);
      lines.push(...thenLines);
    }
    
    lines.push(`${indent}}`);
    
    if (statement.elseBlock) {
      lines.push(`${indent}else {`);
      const elseLines = this.generateBody(statement.elseBlock, context, indentLevel + 1);
      lines.push(...elseLines);
      lines.push(`${indent}}`);
    }
    
    return lines;
  }

  generateForLoop(statement, context, indentLevel) {
    const lines = [];
    const indent = '    '.repeat(indentLevel);
    
    const init = statement.initialization || 'int i = 0';
    const condition = statement.condition || 'i < 10';
    const update = statement.update || 'i++';
    
    lines.push(`${indent}for (${init}; ${condition}; ${update}) {`);
    
    if (statement.body) {
      const bodyLines = this.generateBody(statement.body, context, indentLevel + 1);
      lines.push(...bodyLines);
    }
    
    lines.push(`${indent}}`);
    
    return lines;
  }

  generateWhileLoop(statement, context, indentLevel) {
    const lines = [];
    const indent = '    '.repeat(indentLevel);
    
    const condition = this.generateExpression(statement.condition, context);
    lines.push(`${indent}while (${condition}) {`);
    
    if (statement.body) {
      const bodyLines = this.generateBody(statement.body, context, indentLevel + 1);
      lines.push(...bodyLines);
    }
    
    lines.push(`${indent}}`);
    
    return lines;
  }

  generateExpression(expr, context) {
    if (!expr) return '';
    
    if (typeof expr === 'string') return expr;
    
    switch (expr.type) {
      case 'identifier':
        return expr.name;
      
      case 'literal':
        if (expr.literalType === 'string') {
          return `"${expr.value}"`;
        } else if (expr.literalType === 'boolean') {
          return expr.value === 'true' ? 'true' : 'false';
        }
        return expr.value;
      
      case 'binary_expression':
        const left = this.generateExpression(expr.left, context);
        const right = this.generateExpression(expr.right, context);
        return `(${left} ${expr.operator} ${right})`;
      
      default:
        return expr.toString();
    }
  }
}