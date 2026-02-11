import Parser from 'tree-sitter';
import Java from 'tree-sitter-java';
import { TranslationContext } from './context.js';

// Import Java parsers
import { VariablesParser } from '../../parsers/java/java-variables.js';
import { PrintParser } from '../../parsers/java/java-print.js';
import { CommentsParser } from '../../parsers/java/java-comments.js';
import { OperatorsParser } from '../../parsers/java/java-operators.js';
import { ControlFlowParser } from '../../parsers/java/java-control-flow.js';
import { LoopsParser } from '../../parsers/java/java-loops.js';
import { ArraysParser } from '../../parsers/java/java-arrays.js';

// Import Python generators
import { VariablesGenerator } from '../../generators/python/java/java-variables.js';
import { PrintGenerator } from '../../generators/python/java/java-print.js';
import { CommentsGenerator } from '../../generators/python/java/java-comments.js';
import { OperatorsGenerator } from '../../generators/python/java/java-operators.js';
import { ConditionalsGenerator } from '../../generators/python/java/java-conditinals.js';
import { LoopsGenerator } from '../../generators/python/java/java-loops.js';
import { ArraysGenerator } from '../../generators/python/java/java-arrays.js';

export class JavaToPythonTranslator {
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Java);
    
    // Initialize parsers
    this.parsers = {
      arrays: new ArraysParser(),
      variables: new VariablesParser(),
      print: new PrintParser(),
      comments: new CommentsParser(),
      operators: new OperatorsParser(),
      controlFlow: new ControlFlowParser(),
      loops: new LoopsParser()
    };
    
    // Initialize generators
    this.generators = {
      arrays: new ArraysGenerator(),
      variables: new VariablesGenerator(),
      print: new PrintGenerator(),
      comments: new CommentsGenerator(),
      operators: new OperatorsGenerator(),
      controlFlow: new ConditionalsGenerator(),
      loops: new LoopsGenerator()
    };
    
    console.log('✅ Java-to-Python translator initialized');
  }

  translate(javaCode) {
    try {
      console.log('=== STARTING TRANSLATION ===');
      console.log('Java input:', javaCode.substring(0, 100) + '...');
      
      const tree = this.parser.parse(javaCode);
      const context = new TranslationContext();
      
      // Register parsers and generators
      for (const [name, parser] of Object.entries(this.parsers)) {
        context.registerParser(name, parser);
      }
      
      for (const [name, generator] of Object.entries(this.generators)) {
        context.registerGenerator(name, generator);
      }
      
      // Find the main method body
      console.log('\n=== LOOKING FOR MAIN METHOD ===');
      const mainMethodBody = this.extractMainMethodBody(tree.rootNode);
      console.log('Main method body found:', !!mainMethodBody);
      
      if (!mainMethodBody) {
        return {
          success: false,
          code: '# No main method found in Java code',
          warnings: ['No main method found']
        };
      }
      
      console.log('Main method body text:', mainMethodBody.text);
      
      // Get source lines for comment preservation
      const sourceLines = javaCode.split('\n');
      
      // Get all statements and comments with their line positions
      console.log('\n=== EXTRACTING STATEMENTS ===');
      const statementsWithInfo = this.extractStatementsWithComments(mainMethodBody, sourceLines);
      console.log(`Found ${statementsWithInfo.length} statements/comments in main method`);
      
      for (let i = 0; i < statementsWithInfo.length; i++) {
        const info = statementsWithInfo[i];
        console.log(`Item ${i}: ${info.type} at line ${info.lineNumber} - "${info.text.substring(0, 50)}"`);
        if (info.comment) {
          console.log(`  With comment: "${info.comment}"`);
        }
      }
      
      let outputLines = [];
      let lastLineNumber = -1;
      
      // Add the initial comment if present (first line of Java code)
      if (sourceLines[0] && sourceLines[0].trim().startsWith('//')) {
        const commentText = sourceLines[0].trim().substring(2).trim();
        outputLines.push(`# ${commentText}`);
        lastLineNumber = 0;
        
        // Check if there's a blank line after the comment
        if (sourceLines.length > 1 && sourceLines[1].trim() === '' && statementsWithInfo.length > 0) {
          outputLines.push('');
          lastLineNumber = 1;
        }
      }
      
      // Convert each item to Python
      console.log('\n=== CONVERTING STATEMENTS ===');
      for (const item of statementsWithInfo) {
        console.log(`\nConverting: ${item.type} at line ${item.lineNumber}`);
        console.log(`Text: "${item.text}"`);
        
        // Add spacing based on line gaps
        if (lastLineNumber >= 0) {
          const lineGap = item.lineNumber - lastLineNumber - 1;
          console.log(`Line gap from last: ${lineGap}`);
          
          // Add blank lines to preserve SOME original spacing
          // But limit to prevent excessive blank lines
          if (lineGap > 0) {
            // Add at least one blank line if there was spacing in source
            // But don't add excessive blank lines
            outputLines.push('');
            console.log(`Added 1 blank line (original gap: ${lineGap})`);
          }
        }
        
        if (item.type === 'comment') {
          // Handle comment nodes
          console.log('Processing comment node');
          const commentNode = item.node;
          const pythonComment = this.convertNode(commentNode, context);
          if (pythonComment) {
            outputLines.push(pythonComment);
          }
        } else {
          // Handle statement nodes
          console.log(`Processing statement: ${item.type}`);
          const pythonCode = this.convertStatement(item.node, context);
          
          if (pythonCode) {
            // Add inline comment if present
            let finalLine = pythonCode;
            if (item.comment) {
              console.log(`Adding inline comment: "${item.comment}"`);
              finalLine = pythonCode + `  # ${item.comment}`;
            }
            
            outputLines.push(finalLine);
            console.log(`Converted to: ${finalLine}`);
          }
        }
        
        lastLineNumber = item.lineNumber;
      }
      
      // Clean up the output - remove excessive consecutive blank lines
      outputLines = this.cleanOutputLines(outputLines);
      
      console.log('\n=== FINAL OUTPUT ===');
      console.log('Number of output lines:', outputLines.length);
      console.log('Output:\n' + outputLines.join('\n'));
      
      return {
        success: true,
        code: outputLines.join('\n'),
        warnings: context.getWarnings()
      };
      
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        code: `# Translation Error: ${error.message}\n# Original Java code:\n${javaCode}`,
        error: error.message
      };
    }
  }

  // UPDATED: Clean up the output, limiting consecutive blank lines to 1
  cleanOutputLines(outputLines) {
    let cleanedLines = [];
    
    // Remove all leading blank lines
    while (outputLines.length > 0 && outputLines[0].trim() === '') {
      outputLines.shift();
    }
    
    // Remove all trailing blank lines
    while (outputLines.length > 0 && outputLines[outputLines.length - 1].trim() === '') {
      outputLines.pop();
    }
    
    // Process lines, limiting consecutive blank lines to 1
    let consecutiveBlankLines = 0;
    for (let i = 0; i < outputLines.length; i++) {
      const currentLine = outputLines[i];
      
      if (currentLine.trim() === '') {
        consecutiveBlankLines++;
        // Only add if this is the first blank line in a sequence
        if (consecutiveBlankLines === 1) {
          cleanedLines.push(currentLine);
        }
        // Skip additional consecutive blank lines
        console.log(`Skipping excessive blank line at position ${i}`);
      } else {
        consecutiveBlankLines = 0;
        cleanedLines.push(currentLine);
      }
    }
    
    return cleanedLines;
  }

  // Extract statements with their associated comments
  extractStatementsWithComments(blockNode, sourceLines) {
    const items = [];
    let pendingComment = null;
    
    console.log(`Block has ${blockNode.childCount} children:`);
    
    for (let i = 0; i < blockNode.childCount; i++) {
      const child = blockNode.child(i);
      const lineNumber = child.startPosition.row + 1;
      const childText = child.text.trim();
      
      console.log(`  [${i}] ${child.type}: "${childText}" at line ${lineNumber}`);
      
      // Skip braces and empty statements
      if (child.type === '{' || child.type === '}' || child.type === 'empty_statement') {
        console.log(`    Skipping: ${child.type}`);
        continue;
      }
      
      // Check for comments
      if (child.type === 'line_comment' || child.type === 'block_comment') {
        console.log(`    Found comment: "${childText}"`);
        
        // Check if this comment is on the same line as the previous item
        // If it is, it's already an inline comment, don't add as separate item
        const lastItem = items[items.length - 1];
        if (lastItem && lastItem.lineNumber === lineNumber) {
          console.log(`    Comment on same line as previous statement, treating as inline comment only`);
          pendingComment = {
            node: child,
            lineNumber: lineNumber,
            text: childText
          };
          continue;
        }
        
        // Comment is on its own line, add as separate item
        items.push({
          type: 'comment',
          node: child,
          lineNumber: lineNumber,
          text: childText,
          comment: null
        });
        
        // Also store to attach to next statement if needed
        pendingComment = {
          node: child,
          lineNumber: lineNumber,
          text: childText
        };
        continue;
      }
      
      // Check for statement nodes - ADD LOOP STATEMENTS HERE!
      const statementTypes = [
        'local_variable_declaration',
        'expression_statement',
        'if_statement',
        'switch_expression',
        // ADD THESE LOOP STATEMENT TYPES:
        'for_statement',
        'while_statement',
        'do_statement',
        'enhanced_for_statement'
      ];
      
      if (statementTypes.includes(child.type)) {
        console.log(`    Found statement: ${child.type}`);
        
        // Extract inline comment from the exact source line of this statement
        let inlineComment = '';
        const sourceLine = sourceLines[lineNumber - 1] || '';
        
        // Look for comment on this specific line
        const lineParts = sourceLine.split('//');
        if (lineParts.length > 1) {
          // Get everything after the first // (in case there are multiple //)
          inlineComment = sourceLine.substring(sourceLine.indexOf('//') + 2).trim();
          console.log(`    Found inline comment in source line: "${inlineComment}"`);
        }
        
        // If no inline comment found but we have a pending comment on the same line,
        // use it (comments on same line belong to this statement)
        if (!inlineComment && pendingComment && pendingComment.lineNumber === lineNumber) {
          const commentText = pendingComment.text;
          if (commentText.startsWith('//')) {
            inlineComment = commentText.substring(2).trim();
          } else if (commentText.startsWith('/*')) {
            inlineComment = commentText.substring(2, commentText.length - 2).trim();
          }
          console.log(`    Using pending comment from same line: "${inlineComment}"`);
          pendingComment = null;
        }
        
        items.push({
          type: child.type,
          node: child,
          lineNumber: lineNumber,
          text: childText,
          comment: inlineComment
        });
        
        // Clear pending comment if it was on a different line (belongs to previous statement)
        if (pendingComment && pendingComment.lineNumber < lineNumber) {
          console.log(`    Discarding pending comment from line ${pendingComment.lineNumber} - belongs to previous statement`);
          pendingComment = null;
        }
      } else {
        console.log(`    Skipping node type: ${child.type} (not in statementTypes)`);
      }
    }
    
    // Sort by line number
    items.sort((a, b) => a.lineNumber - b.lineNumber);
    
    return items;
  }

  convertStatement(node, context) {
    console.log(`convertStatement called for: ${node.type}`);
    
    // For expression_statement, look for method_invocation inside
    if (node.type === 'expression_statement') {
      console.log('It\'s an expression_statement, checking children:');
      
      // Try to find method_invocation recursively
      const methodInvocation = this.findMethodInvocation(node);
      if (methodInvocation) {
        console.log('Found method_invocation:', methodInvocation.text);
        return this.convertNode(methodInvocation, context);
      }
      
      // Also check for assignment expressions (like c += 3)
      const assignment = this.findAssignmentExpression(node);
      if (assignment) {
        console.log('Found assignment expression:', assignment.text);
        return this.convertNode(assignment, context);
      }
      
      // Check for other expression types that might be inside expression_statement
      const innerExpression = this.findInnerExpression(node);
      if (innerExpression) {
        console.log('Found inner expression:', innerExpression.type, innerExpression.text);
        return this.convertNode(innerExpression, context);
      }
      
      console.log('No method_invocation or assignment found in expression_statement');
    }
    
    // For all other node types, try to convert directly
    console.log(`Trying to convert node directly: ${node.type}`);
    return this.convertNode(node, context);
  }
  
  convertNode(node, context) {
    console.log(`convertNode called for: ${node.type} - "${node.text.substring(0, 50)}"`);
    
    // Try each parser
    for (const [parserName, parser] of Object.entries(this.parsers)) {
      console.log(`  Trying parser: ${parserName}, canParse: ${parser.canParse ? parser.canParse(node) : 'no canParse method'}`);
      if (parser.canParse && parser.canParse(node)) {
        console.log(`  ✓ Using parser: ${parserName} for node: ${node.type}`);
        const astNode = parser.parse(node, context);
        console.log(`  Parsed AST type: ${astNode?.type}`);
        
        // FIX: Check if astNode is null/undefined before trying to use it
        if (!astNode) {
          console.log(`  ✗ Parser returned null/undefined for ${node.type}`);
          continue; // Try next parser instead of returning null
        }
        
        // Get the matching generator
        const generator = this.generators[parserName];
        if (generator && generator.canGenerate && generator.canGenerate(astNode)) {
          const result = generator.generate(astNode, context);
          console.log(`  Generated: ${result}`);
          return result;
        } else {
          console.log(`  ✗ Generator failed or can't generate AST`);
        }
        break;
      }
    }
    
    console.log(`  ✗ No parser found for node type: ${node.type}`);
    return null;
  }

  // Helper methods
  findMethodInvocation(node) {
    if (node.type === 'method_invocation') {
      return node;
    }
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      const found = this.findMethodInvocation(child);
      if (found) return found;
    }
    
    return null;
  }

  findAssignmentExpression(node) {
    if (node.type === 'assignment_expression') {
      return node;
    }
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      const found = this.findAssignmentExpression(child);
      if (found) return found;
    }
    
    return null;
  }

  findInnerExpression(node) {
    // Look for common expression types inside expression_statement
    const expressionTypes = [
      'assignment_expression',
      'binary_expression',
      'unary_expression',
      'update_expression',
      'method_invocation'
    ];
    
    if (expressionTypes.includes(node.type)) {
      return node;
    }
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      const found = this.findInnerExpression(child);
      if (found) return found;
    }
    
    return null;
  }

  extractMainMethodBody(rootNode) {
    // Find class declaration
    const classNode = this.findNodeByType(rootNode, 'class_declaration');
    console.log('Class node found:', !!classNode);
    
    if (!classNode) return null;
    
    // Find main method in class
    const methods = this.collectNodesByType(classNode, 'method_declaration');
    console.log(`Found ${methods.length} methods in class`);
    
    for (const methodNode of methods) {
      const methodName = this.getMethodName(methodNode);
      const modifiers = this.getModifiers(methodNode);
      
      console.log(`Checking method: "${methodName}", modifiers: [${modifiers.join(', ')}]`);
      
      if (methodName === 'main' && 
          modifiers.includes('public') && 
          modifiers.includes('static')) {
        console.log('✅ Found main method!');
        // Return the method body (block)
        const block = this.findNodeByType(methodNode, 'block');
        console.log('Main method block found:', !!block);
        return block;
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
          modifiers.push(modifier.type);
        }
      }
    }
    return modifiers;
  }
}