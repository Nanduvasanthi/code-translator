import Parser from 'tree-sitter';
import CTreeSitter from 'tree-sitter-c';
import { TranslationContext } from './context.js';

// Import C parsers - USING THE CORRECT EXPORT NAMES FROM YOUR FILES
import { VariableParser } from '../../parsers/c/variables.js';  // Singular
import { PrintParser } from '../../parsers/c/print.js';        // Singular
import { CommentsParser } from '../../parsers/c/comments.js';  // Plural
import { OperatorsParser } from '../../parsers/c/operators.js'; // Plural
import { ControlFlowParser } from '../../parsers/c/control-flow.js'; // Plural
import { LoopsParser } from '../../parsers/c/loops.js';          // Plural
import { ArraysParser } from '../../parsers/c/arrays.js';        // Plural (likely)
import { FunctionsParser } from '../../parsers/c/functions.js';   // Plural (likely)

// Import Python generators for C source
import { VariablesGenerator } from '../../generators/python/c/c-variables.js';
import { PrintGenerator } from '../../generators/python/c/c-print.js';
import { CommentsGenerator } from '../../generators/python/c/c-comments.js';
import { OperatorsGenerator } from '../../generators/python/c/c-operators.js';
import { ControlFlowGenerator } from '../../generators/python/c/c-control-flow.js';
import { LoopsGenerator } from '../../generators/python/c/c-loops.js';
import { ArraysGenerator } from '../../generators/python/c/c-arrays.js';
import { FunctionsGenerator } from '../../generators/python/c/c-functions.js';

export class CToPythonTranslator {
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(CTreeSitter);
    
    // Initialize parsers - USING CORRECT CLASS NAMES BASED ON YOUR EXPORTS
    this.parsers = {
      variables: new VariableParser(),      // Singular
      print: new PrintParser(),            // Singular
      comments: new CommentsParser(),      // Plural
      operators: new OperatorsParser(),    // Plural
      controlFlow: new ControlFlowParser(), // Plural
      loops: new LoopsParser(),            // Plural
      arrays: new ArraysParser(),          // Plural (likely)
      functions: new FunctionsParser()      // Plural (likely)
    };
    
    // Initialize generators (keep as-is since you created these)
    this.generators = {
      variables: new VariablesGenerator(),
      print: new PrintGenerator(),
      comments: new CommentsGenerator(),
      operators: new OperatorsGenerator(),
      controlFlow: new ControlFlowGenerator(),
      loops: new LoopsGenerator(),
      arrays: new ArraysGenerator(),
      functions: new FunctionsGenerator()
    };
    
    console.log('✅ C-to-Python translator initialized');
  }

  translate(cCode) {
    try {
      console.log('=== STARTING C-TO-PYTHON TRANSLATION ===');
      console.log('C input:', cCode.substring(0, 100) + '...');
      
      const tree = this.parser.parse(cCode);
      const context = new TranslationContext();
      
      // Register parsers and generators
      for (const [name, parser] of Object.entries(this.parsers)) {
        context.registerParser(name, parser);
      }
      
      for (const [name, generator] of Object.entries(this.generators)) {
        context.registerGenerator(name, generator);
      }
      
      // Find the main function body
      console.log('\n=== LOOKING FOR MAIN FUNCTION ===');
      const mainFunctionBody = this.extractMainFunctionBody(tree.rootNode);
      console.log('Main function body found:', !!mainFunctionBody);
      
      if (!mainFunctionBody) {
        // Try to find any function body as fallback
        console.log('Trying to find any function body as fallback...');
        const anyFunctionBody = this.findAnyFunctionBody(tree.rootNode);
        if (anyFunctionBody) {
          console.log('Found a function body (not necessarily main)');
          return this.translateFunctionBody(anyFunctionBody, context, sourceLines);
        }
        
        return {
          success: false,
          code: '# No main function found in C code\n# Try including: int main() { ... }',
          warnings: ['No main function found']
        };
      }
      
      console.log('Main function body text:', mainFunctionBody.text.substring(0, 100) + '...');
      
      // Get source lines for comment preservation
      const sourceLines = cCode.split('\n');
      
      return this.translateFunctionBody(mainFunctionBody, context, sourceLines);
      
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        code: `# Translation Error: ${error.message}\n# Original C code:\n${cCode}`,
        error: error.message
      };
    }
  }

  translateFunctionBody(functionBody, context, sourceLines) {
    // Get all statements and comments with their line positions
    console.log('\n=== EXTRACTING STATEMENTS ===');
    const statementsWithInfo = this.extractStatementsWithComments(functionBody, sourceLines);
    console.log(`Found ${statementsWithInfo.length} statements/comments in function`);
    
    for (let i = 0; i < statementsWithInfo.length; i++) {
      const info = statementsWithInfo[i];
      console.log(`Item ${i}: ${info.type} at line ${info.lineNumber} - "${info.text.substring(0, 50)}"`);
      if (info.comment) {
        console.log(`  With comment: "${info.comment}"`);
      }
    }
    
    let outputLines = [];
    let lastLineNumber = -1;
    
    // Add the initial comment if present (first line of C code)
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
        
        // Add at least one blank line if there was spacing in source
        if (lineGap > 0) {
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
  }

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
        if (consecutiveBlankLines === 1) {
          cleanedLines.push(currentLine);
        }
      } else {
        consecutiveBlankLines = 0;
        cleanedLines.push(currentLine);
      }
    }
    
    return cleanedLines;
  }

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
      if (child.type === '{' || child.type === '}' || child.type === ';') {
        console.log(`    Skipping: ${child.type}`);
        continue;
      }
      
      // Check for comments
      if (child.type === 'comment') {
        console.log(`    Found comment: "${childText}"`);
        
        // Check if this comment is on the same line as the previous item
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
        
        pendingComment = {
          node: child,
          lineNumber: lineNumber,
          text: childText
        };
        continue;
      }
      
      // Check for statement nodes
      const statementTypes = [
        'declaration',
        'expression_statement',
        'if_statement',
        'for_statement',
        'while_statement',
        'do_statement',
        'return_statement',
        'compound_statement'
      ];
      
      if (statementTypes.includes(child.type)) {
        console.log(`    Found statement: ${child.type}`);
        
        // Extract inline comment from the exact source line of this statement
        let inlineComment = '';
        const sourceLine = sourceLines[lineNumber - 1] || '';
        
        // Look for comment on this specific line
        const lineParts = sourceLine.split('//');
        if (lineParts.length > 1) {
          inlineComment = sourceLine.substring(sourceLine.indexOf('//') + 2).trim();
          console.log(`    Found inline comment in source line: "${inlineComment}"`);
        }
        
        // Check for block comment on same line
        if (!inlineComment && sourceLine.includes('/*') && sourceLine.includes('*/')) {
          const start = sourceLine.indexOf('/*');
          const end = sourceLine.indexOf('*/');
          inlineComment = sourceLine.substring(start + 2, end).trim();
          console.log(`    Found block comment inline: "${inlineComment}"`);
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
        
        // Clear pending comment if it was on a different line
        if (pendingComment && pendingComment.lineNumber < lineNumber) {
          console.log(`    Discarding pending comment from line ${pendingComment.lineNumber}`);
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
    
    // Skip return statements at script level (Python doesn't need them)
    if (node.type === 'return_statement') {
      console.log('Skipping return statement for Python script');
      return null;
    }
    
    if (node.type === 'expression_statement') {
      console.log('Processing expression_statement');
      
      // Try to find function call inside
      const callExpression = this.findCallExpression(node);
      if (callExpression) {
        console.log('Found call_expression:', callExpression.text);
        return this.convertNode(callExpression, context);
      }
      
      // Try to find assignment expression
      const assignment = this.findAssignmentExpression(node);
      if (assignment) {
        console.log('Found assignment_expression:', assignment.text);
        return this.convertNode(assignment, context);
      }
      
      // Check for other expression types
      const innerExpression = this.findInnerExpression(node);
      if (innerExpression) {
        console.log('Found inner expression:', innerExpression.type, innerExpression.text);
        return this.convertNode(innerExpression, context);
      }
    }
    
    // For compound statements (blocks), process all children
    if (node.type === 'compound_statement') {
      console.log('Processing compound_statement (block)');
      const children = [];
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type === '{' || child.type === '}' || child.type === ';') {
          continue;
        }
        const converted = this.convertStatement(child, context);
        if (converted) {
          children.push(converted);
        }
      }
      return children.join('\n');
    }
    
    // For all other node types, try to convert directly
    console.log(`Trying to convert node directly: ${node.type}`);
    return this.convertNode(node, context);
  }
  
  convertNode(node, context) {
    console.log(`convertNode called for: ${node.type} - "${node.text.substring(0, 50)}"`);
    
    // Try each parser
    for (const [parserName, parser] of Object.entries(this.parsers)) {
      console.log(`  Trying parser: ${parserName}`);
      if (parser.canParse && parser.canParse(node)) {
        console.log(`  ✓ Using parser: ${parserName} for node: ${node.type}`);
        const astNode = parser.parse(node, context);
        console.log(`  Parsed AST type: ${astNode?.type}`);
        
        if (!astNode) {
          console.log(`  ✗ Parser returned null/undefined for ${node.type}`);
          continue;
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
  findCallExpression(node) {
    if (node.type === 'call_expression') {
      return node;
    }
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      const found = this.findCallExpression(child);
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
    const expressionTypes = [
      'assignment_expression',
      'binary_expression',
      'unary_expression',
      'update_expression',
      'call_expression',
      'conditional_expression'
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

  extractMainFunctionBody(rootNode) {
    // Find function definitions
    const functions = this.collectNodesByType(rootNode, 'function_definition');
    console.log(`Found ${functions.length} function definitions`);
    
    for (const funcNode of functions) {
      const funcName = this.getFunctionName(funcNode);
      console.log(`Checking function: "${funcName}"`);
      
      if (funcName === 'main') {
        console.log('✅ Found main function!');
        // Return the function body (compound_statement)
        const body = this.findNodeByType(funcNode, 'compound_statement');
        console.log('Main function body found:', !!body);
        return body;
      }
    }
    
    console.log('❌ No main function found');
    return null;
  }

  findAnyFunctionBody(rootNode) {
    // Find the first function definition and return its body
    const functions = this.collectNodesByType(rootNode, 'function_definition');
    if (functions.length > 0) {
      const funcNode = functions[0];
      const funcName = this.getFunctionName(funcNode);
      console.log(`Using function "${funcName}" as fallback`);
      return this.findNodeByType(funcNode, 'compound_statement');
    }
    return null;
  }

  getFunctionName(funcNode) {
    console.log('DEBUG: Getting function name from node type:', funcNode.type);
    console.log('DEBUG: Function node text:', funcNode.text.substring(0, 100));
    console.log('DEBUG: Function node has', funcNode.childCount, 'children');
    
    // Method 1: Look for declarator -> direct_declarator -> identifier
    const declarator = this.findNodeByType(funcNode, 'declarator');
    if (declarator) {
      console.log('DEBUG: Found declarator');
      const directDeclarator = this.findNodeByType(declarator, 'direct_declarator');
      if (directDeclarator) {
        console.log('DEBUG: Found direct_declarator');
        const identifier = this.findNodeByType(directDeclarator, 'identifier');
        if (identifier) {
          console.log('DEBUG: Found identifier:', identifier.text);
          return identifier.text;
        }
      }
    }
    
    // Method 2: Look for identifier in the function node children
    for (let i = 0; i < funcNode.childCount; i++) {
      const child = funcNode.child(i);
      console.log(`DEBUG: Child ${i}: ${child.type} - "${child.text.substring(0, 30)}"`);
      
      if (child.type === 'identifier') {
        console.log('DEBUG: Found identifier directly:', child.text);
        return child.text;
      }
      
      // Look deeper in child nodes
      if (child.childCount > 0) {
        const nestedId = this.findIdentifierInNode(child);
        if (nestedId) {
          console.log('DEBUG: Found nested identifier:', nestedId);
          return nestedId;
        }
      }
    }
    
    // Method 3: Try to extract from text
    const text = funcNode.text || '';
    console.log('DEBUG: Trying to extract function name from text:', text.substring(0, 100));
    
    // Pattern: return_type function_name(parameters)
    const pattern = /^(?:[a-zA-Z_][a-zA-Z0-9_]*\s+)+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/;
    const match = text.match(pattern);
    if (match && match[1]) {
      console.log('DEBUG: Extracted function name from text:', match[1]);
      return match[1];
    }
    
    // Pattern: int main() or void main()
    const mainPattern = /(?:int|void)\s+(main)\s*\(/;
    const mainMatch = text.match(mainPattern);
    if (mainMatch && mainMatch[1]) {
      console.log('DEBUG: Found main function from text pattern');
      return mainMatch[1];
    }
    
    console.log('DEBUG: Could not extract function name');
    return '';
  }

  findIdentifierInNode(node) {
    if (node.type === 'identifier') {
      return node.text;
    }
    
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      const result = this.findIdentifierInNode(child);
      if (result) return result;
    }
    
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
}