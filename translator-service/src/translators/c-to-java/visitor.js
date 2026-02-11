// translators/c-to-java/visitor.js - FIXED WITH PROPER CONTEXT HANDLING
import { CToJavaContext } from './context.js';

export class CToJavaVisitor {
  constructor(generators) {
    this.context = new CToJavaContext();
    this.generators = generators;
    this.output = []; // Collect all generated code
    this.combinedOutput = []; // Store combined lines before final output
    this.handledExpressionIds = new Set(); // Track expressions already handled
    this.currentIndentLevel = 2; // Start at level 2 (inside main method)
  }

  visit(nodes) {
  // Handle both single node and array
  if (!nodes) return '';
  
  const nodeArray = Array.isArray(nodes) ? nodes : [nodes];
  
  console.log(`DEBUG Visitor: Processing ${nodeArray.length} nodes`);
  
  // Reset indentation for main method body
  this.currentIndentLevel = 2; // Inside main method
  
  // Process nodes, combining variable declarations with same-line comments
  for (let i = 0; i < nodeArray.length; i++) {
    const node = nodeArray[i];
    const nextNode = i + 1 < nodeArray.length ? nodeArray[i + 1] : null;
    
    console.log(`DEBUG Visitor [${i+1}/${nodeArray.length}]: Visiting ${node.type} at line ${node._position?.startLine}`);
    
    // ⭐⭐ CRITICAL FIX: Handle function_declaration nodes specially
    // ⭐⭐ CRITICAL FIX: Handle function_declaration nodes specially
if (node.type === 'function_declaration') {
  console.log(`DEBUG Visitor: Found function ${node.name} with ${node.body?.length || 0} body statements`);
  
  // Use the function generator to generate the ENTIRE function
  const functionGenerated = this.visitNode(node);
  
  if (functionGenerated && functionGenerated.trim()) {
    // Add the function declaration to output
    this.output.push({
      line: functionGenerated,
      position: node._position?.startLine || 0
    });
  }
  
  continue; // Skip normal processing for function_declaration
}
    
    // Generate a unique ID for this node based on its position
    const nodeId = `${node.type}_${node._position?.startLine}_${node._position?.originalText?.hashCode?.() || ''}`;
    
    // Check if this expression node should be skipped
    if (this.shouldSkipExpressionNode(node, nodeId)) {
      console.log(`  ✗ Skipping ${node.type} as it's handled by parent statement`);
      continue;
    }
    
    // Handle complex statements that contain nested nodes
    if (this.isComplexStatement(node)) {
      this.handleComplexStatement(node, i, nodeArray);
      continue;
    }
    
    // STRATEGY 1: Variable declaration with same-line comment
    if (node.type === 'variable_declaration' && 
        nextNode && 
        nextNode.type === 'comment' && 
        nextNode._position && 
        node._position &&
        nextNode._position.startLine === node._position.startLine) {
      
      // Generate variable declaration with current indentation
      const varGenerated = this.visitNode(node);
      const commentGenerated = this.visitNode(nextNode);
      
      if (varGenerated && varGenerated.trim()) {
        // Combine variable declaration with comment on same line
        const combinedLine = this.applyIndentation(varGenerated + ' ' + commentGenerated);
        this.output.push({
          line: combinedLine,
          position: node._position.startLine || 0
        });
        console.log(`  ✓ Generated combined: ${combinedLine.substring(0, 80)}...`);
        
        // Skip the next node (comment) since we already processed it
        i++;
      }
    } 
    // STRATEGY 2: Print statement - look for same-line comment (skipping expression nodes in between)
    else if (node.type === 'print_statement') {
      // Look ahead for a comment on the same line, skipping expression nodes
      let commentNode = null;
      let commentIndex = -1;
      
      for (let j = i + 1; j < nodeArray.length; j++) {
        const potentialNode = nodeArray[j];
        
        // Stop if we've moved to a different line
        if (potentialNode._position && 
            potentialNode._position.startLine > node._position.startLine) {
          break;
        }
        
        // Skip expression nodes (they're part of the print statement)
        if (this.shouldSkipExpressionNode(potentialNode, `${potentialNode.type}_${j}`)) {
          continue;
        }
        
        // Found a comment on the same line
        if (potentialNode.type === 'comment') {
          commentNode = potentialNode;
          commentIndex = j;
          break;
        }
        
        // If we encounter any non-comment, non-expression node, stop looking
        break;
      }
      
      if (commentNode) {
        // Generate print statement with comment
        const printGenerated = this.visitNode(node);
        const commentGenerated = this.visitNode(commentNode);
        
        if (printGenerated && printGenerated.trim()) {
          // Combine print statement with comment on same line
          const combinedLine = this.applyIndentation(printGenerated + ' ' + commentGenerated);
          this.output.push({
            line: combinedLine,
            position: node._position.startLine || 0
          });
          console.log(`  ✓ Generated combined print+comment: ${combinedLine.substring(0, 80)}...`);
          
          // Skip all nodes up to and including the comment
          i = commentIndex;
        }
      } else {
        // No comment on same line, just generate the print statement
        const generated = this.visitNode(node);
        if (generated && generated.trim()) {
          const indentedLine = this.applyIndentation(generated);
          this.output.push({
            line: indentedLine,
            position: node._position?.startLine || 0
          });
          console.log(`  ✓ Generated: ${indentedLine.substring(0, 80)}...`);
        }
      }
    }
    // STRATEGY 2.5: Array declaration with same-line comment
    else if ((node.type === 'array_declaration' || 
              node.type === 'array_declarator' || 
              node.type === 'init_declarator') && 
             nextNode && 
             nextNode.type === 'comment' && 
             nextNode._position && 
             node._position &&
             nextNode._position.startLine === node._position.startLine) {
      
      const arrayGenerated = this.visitNode(node);
      const commentGenerated = this.visitNode(nextNode);
      
      if (arrayGenerated && arrayGenerated.trim()) {
        const combinedLine = this.applyIndentation(arrayGenerated + ' ' + commentGenerated);
        this.output.push({
          line: combinedLine,
          position: node._position.startLine || 0
        });
        console.log(`  ✓ Generated combined array+comment: ${combinedLine.substring(0, 80)}...`);
        
        i++; // Skip the comment node
      }
    }
    // STRATEGY 3: Any statement followed by comment on next line
    else if (node.type !== 'comment' && 
             nextNode && 
             nextNode.type === 'comment' && 
             nextNode._position && 
             node._position &&
             nextNode._position.startLine === node._position.startLine + 1) {
      
      // Check if there's another statement after the comment
      const nextNextNode = i + 2 < nodeArray.length ? nodeArray[i + 2] : null;
      const hasNextStatement = nextNextNode && 
                              nextNextNode.type !== 'comment' &&
                              nextNextNode._position &&
                              nextNextNode._position.startLine > nextNode._position.startLine;
      
      // Generate the statement
      const stmtGenerated = this.visitNode(node);
      const commentGenerated = this.visitNode(nextNode);
      
      if (stmtGenerated && stmtGenerated.trim()) {
        // For simple statements with trailing comments, combine on same line
        if (!hasNextStatement || this.isSimpleStatement(node.type)) {
          const combinedLine = this.applyIndentation(stmtGenerated + ' ' + commentGenerated);
          this.output.push({
            line: combinedLine,
            position: node._position.startLine || 0
          });
          console.log(`  ✓ Generated combined statement+comment: ${combinedLine.substring(0, 80)}...`);
        } else {
          // For blocks or multiple statements, keep comment on next line
          this.output.push({
            line: this.applyIndentation(stmtGenerated),
            position: node._position.startLine || 0
          });
          this.output.push({
            line: this.applyIndentation(commentGenerated),
            position: nextNode._position.startLine || 0
          });
          console.log(`  ✓ Generated statement with next-line comment`);
        }
        
        // Skip the comment node
        i++;
      }
    }
    // STRATEGY 4: Handle standalone comments (section headers)
    else if (node.type === 'comment') {
      // Check if this is really standalone (not preceded by statement on same line)
      let isStandalone = true;
      
      // Look back to see if there's a statement on the same line
      for (let j = i - 1; j >= 0; j--) {
        const prevNode = nodeArray[j];
        if (prevNode._position && 
            prevNode._position.startLine === node._position.startLine &&
            !this.shouldSkipExpressionNode(prevNode, `${prevNode.type}_${j}`)) {
          // There's a non-expression node on the same line, so this isn't standalone
          isStandalone = false;
          break;
        }
        
        // Stop looking if we've gone to a different line
        if (prevNode._position && prevNode._position.startLine < node._position.startLine) {
          break;
        }
      }
      
      if (isStandalone) {
        // This is a standalone comment (like a section header)
        const generated = this.visitNode(node);
        if (generated && generated.trim()) {
          const indentedLine = this.applyIndentation(generated);
          this.output.push({
            line: indentedLine,
            position: node._position?.startLine || 0
          });
          console.log(`  ✓ Generated standalone comment`);
        }
      } else {
        // This comment is already handled by a previous statement
        console.log(`  ✗ Skipping comment (already handled by previous statement)`);
      }
    }
    // STRATEGY 5: Handle regular nodes (no following comment to combine)
    else {
      const generated = this.visitNode(node);
      
      if (generated && generated.trim()) {
        // ⭐⭐ CRITICAL FIX: Check if this is a complex statement
        if (this.isComplexStatement(node)) {
          // Complex statements already have their own indentation
          this.output.push({
            line: generated,
            position: node._position?.startLine || 0
          });
        } else {
          // Simple statements need indentation applied
          const indentedLine = this.applyIndentation(generated);
          this.output.push({
            line: indentedLine,
            position: node._position?.startLine || 0
          });
        }
        console.log(`  ✓ Generated: ${generated.substring(0, 80)}...`);
      } else {
        console.log(`  ✗ No output`);
      }
    }
    
    // Mark this node as handled
    this.handledExpressionIds.add(nodeId);
  }
  
  return this.getOutput();
}

  applyIndentation(text) {
    // Apply current indentation level
    const indent = '    '.repeat(this.currentIndentLevel);
    
    // ⭐⭐ FIXED: Don't strip existing indentation if it's a multi-line block
    // Check if text contains newlines (multi-line block)
    if (text.includes('\n')) {
      // For multi-line blocks, split and add indentation to each line
      const lines = text.split('\n');
      const indentedLines = lines.map((line, index) => {
        if (index === 0) {
          // First line gets base indentation
          return indent + line.trimStart();
        } else if (line.trim() === '') {
          // Empty line stays empty
          return '';
        } else {
          // Subsequent lines get base indentation
          return indent + line;
        }
      });
      return indentedLines.join('\n');
    } else {
      // Single line - just add indentation
      return indent + text.trimStart();
    }
  }

  isComplexStatement(node) {
    if (typeof node === 'object') {
      const complexStatements = [
        'conditional_statement',
        'switch_statement',
        'ternary_expression',
        'loop_statement',
        'function_declaration'
      ];
      
      return complexStatements.includes(node.type);
    }
    return false;
  }

  handleComplexStatement(node, currentIndex, nodeArray) {
    // Generate the complex statement with current indentation
    const generated = this.visitNode(node);
    
    if (generated && generated.trim()) {
      // Complex statements handle their own indentation internally
      // They should return properly indented code
      this.output.push({
        line: generated,
        position: node._position?.startLine || 0
      });
      console.log(`  ✓ Generated complex statement: ${generated.substring(0, 80)}...`);
    }
  }

  shouldSkipExpressionNode(node, nodeId) {
    const expressionTypes = [
      'binary_expression',
      'unary_expression', 
      'logical_expression',
      'comparison_expression',
      'ternary_expression',
      'bitwise_expression',
      'subscript_expression',
      'array_access'
    ];
    
    if (expressionTypes.includes(node.type)) {
      return true;
    }
    
    return false;
  }

  isSimpleStatement(nodeType) {
    const simpleStatements = [
      'print_statement',
      'variable_declaration',
      'expression_statement',
      'return_statement'
    ];
    
    return simpleStatements.includes(nodeType);
  }

  visitNode(node, context = {}) {
  if (!node) return '';

  

  // ⭐⭐ ADDED: Handle array_assignment directly
  if (node.type === 'array_assignment') {
    const indentLevel = context.indentLevel !== undefined ? context.indentLevel : this.currentIndentLevel;
    console.log(`DEBUG Visitor: Processing array_assignment: ${node.arrayName}[${node.index}] = ...`);
    
    // Use the expression statement generator
    const generator = this.getGenerator('array_assignment');
    if (generator) {
      try {
        const result = generator.generate ? 
          generator.generate(node, { ...context, indentLevel }, this) :
          generator(node, { ...context, indentLevel }, this);
        return result || '';
      } catch (error) {
        console.error(`Error generating array_assignment:`, error);
      }
    }
    
    // Fallback: generate manually
    const indent = '    '.repeat(indentLevel);
    let value = '';
    if (node.value && node.value.value) {
      value = node.value.value;
    }
    return `${indent}${node.arrayName}[${node.index}] = ${value};`;
  }

  // Rest of the existing visitNode code...
  // (keep the existing expression_statement handling etc.)


  // ⭐⭐ ADDED: Handle expression_statement directly (for numbers[0] = 10; etc.)
  if (node.type === 'expression_statement') {
    const indentLevel = context.indentLevel !== undefined ? context.indentLevel : this.currentIndentLevel;
    const indent = '    '.repeat(indentLevel);
    
    // Get the expression text
    let expressionText = '';
    
    if (node._position?.originalText) {
      expressionText = node._position.originalText.trim();
      console.log(`DEBUG Visitor: Handling expression_statement: ${expressionText.substring(0, 50)}...`);
    } else if (node.code) {
      expressionText = node.code.trim();
    } else if (node.value) {
      expressionText = node.value.toString().trim();
    }
    
    // Skip printf statements (handled by print generator)
    if (expressionText.includes('printf')) {
      console.log(`DEBUG Visitor: Skipping printf in expression_statement`);
      return '';
    }
    
    // Ensure it ends with semicolon
    if (expressionText && !expressionText.endsWith(';')) {
      expressionText += ';';
    }
    
    return `${indent}${expressionText}`;
  }

  if (node.type === 'include_statement') {
    console.log('DEBUG Visitor: Skipping include statement');
    return '';
  }
  
  const expressionTypes = [
    'binary_expression',
    'unary_expression', 
    'logical_expression',
    'comparison_expression',
    'ternary_expression',
    'bitwise_expression'
  ];
  
  if (expressionTypes.includes(node.type)) {
    console.log(`DEBUG Visitor: Skipping ${node.type} in visitNode`);
    return '';
  }
  
  const generator = this.getGenerator(node.type);
  if (!generator) {
    console.log(`DEBUG Visitor: No generator for ${node.type}`);
    return '';
  }
  
  try {
    // ⭐⭐ CRITICAL FIX: Use passed context's indentLevel, or fall back to this.currentIndentLevel
    const indentLevel = context.indentLevel !== undefined ? context.indentLevel : this.currentIndentLevel;
    const contextWithIndent = {
      ...this.context,
      ...context,  // ⭐⭐ Merge the passed context
      indentLevel: indentLevel  // ⭐⭐ Use the correct indent level
    };
    
    // ⭐⭐ FIXED: ALL generators should get the indentLevel
    if (typeof generator === 'function') {
      const result = generator(node, contextWithIndent, this);
      return result || '';
    }
    
    if (generator.generate && typeof generator.generate === 'function') {
      const result = generator.generate(node, contextWithIndent, this);
      return result || '';
    }
    
    if (generator.default && generator.default.generate && typeof generator.default.generate === 'function') {
      const result = generator.default.generate(node, contextWithIndent, this);
      return result || '';
    }
    
    console.log(`DEBUG Visitor: Generator for ${node.type} has no valid generate method`);
    return '';
  } catch (error) {
    console.error(`Error generating ${node.type}:`, error.message);
    return '';
  }
}

  getGenerator(nodeType) {
    const generatorMap = {
      'variable_declaration': this.generators?.variables,
      'function_declaration': this.generators?.functions,
      'comment': this.generators?.comments,
      'print_statement': this.generators?.print,
      'conditional_statement': this.generators?.conditionals,
      'if_statement': this.generators?.conditionals,
      'switch_statement': this.generators?.conditionals,
      'ternary_expression': this.generators?.ternary,
      'loop_statement': this.generators?.loops,
      'for_statement': this.generators?.loops,
      'while_statement': this.generators?.loops,
      'do_statement': this.generators?.loops,
      'continue_statement': this.generators?.loops,
      'array_declaration': this.generators?.variables,
      'array_declarator': this.generators?.arrays,
      'init_declarator': this.generators?.arrays,
      'subscript_expression': this.generators?.arrays,
      'initializer_list': this.generators?.arrays,
      'array_initializer': this.generators?.arrays,
      'array_access': this.generators?.arrays,
      'binary_expression': this.generators?.operators,
      'unary_expression': this.generators?.operators,
      'logical_expression': this.generators?.operators,
      'comparison_expression': this.generators?.operators,
      'bitwise_expression': this.generators?.operators,
      'call_expression': this.generators?.builtins,
      'return_statement': this.generators?.functions,
      'include_statement': this.generators?.builtins,
      'break_statement': this.generators?.loops,
      'expression_statement': this.generators?.expressionStatement,
      'array_assignment': this.generators?.expressionStatement,
      'assignment_expression': this.generators?.expressionStatement,
      'variable_assignment': this.generators?.expressionStatement,
      'c_expression':this.generators?.expressionStatement,
      'expression': this.generators?.operators
    };

    const generator = generatorMap[nodeType];
    
    if (!generator) {
      console.log(`DEBUG: No generator mapped for ${nodeType}`);
      return null;
    }
    
    return generator;
  }

  getOutput() {
    if (this.output.length === 0) {
      return 'public class Main {\n    public static void main(String[] args) {\n    }\n}';
    }
    
    // Sort by original line position
    const sorted = this.output.sort((a, b) => a.position - b.position);
    
    // Build Java code - lines already have proper indentation
    let javaCode = 'public class Main {\n';
    javaCode += '    public static void main(String[] args) {\n';
    
    let lastPosition = -1;
    for (const item of sorted) {
      if (!item.line.trim()) continue;
      
      if (lastPosition !== -1 && item.position > lastPosition + 1) {
        javaCode += '\n';
      }
      
      javaCode += item.line + '\n';
      lastPosition = item.position;
    }
    
    javaCode += '    }\n';
    javaCode += '}\n';
    
    return javaCode;
  }
}