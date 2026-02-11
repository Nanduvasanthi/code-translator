import Parser from 'tree-sitter';
import Java from 'tree-sitter-java';

// Import Java parsers
import { VariablesParser } from '../../parsers/java/java-variables.js';
import { PrintParser } from '../../parsers/java/java-print.js';
import { CommentsParser } from '../../parsers/java/java-comments.js';
import { OperatorsParser } from '../../parsers/java/java-operators.js';
import { ControlFlowParser } from '../../parsers/java/java-control-flow.js';
import { LoopsParser } from '../../parsers/java/java-loops.js';
import { ArraysParser } from '../../parsers/java/java-arrays.js';

// Import C generators for Java
import { JavaVariablesGenerator } from '../../generators/c/java/java-variables.js';
import { JavaFunctionsGenerator } from '../../generators/c/java/java-functions.js';
import { JavaPrintGenerator } from '../../generators/c/java/java-print.js';
import { JavaCommentsGenerator } from '../../generators/c/java/java-comments.js';
import { JavaControlFlowGenerator } from '../../generators/c/java/java-control-flow.js';
import { JavaLoopsGenerator } from '../../generators/c/java/java-loops.js';
import { JavaArraysGenerator } from '../../generators/c/java/java-arrays.js';
import { JavaOperatorsGenerator } from '../../generators/c/java/java-operators.js';
import { JavaTernaryGenerator } from '../../generators/c/java/java-ternary.js';
import { JavaExpressionStatementGenerator } from '../../generators/c/java/java-expression-statement.js';

export class JavaToCTranslator {
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Java);
    
    // Initialize Java parsers
    this.parsers = {
      variables: new VariablesParser(),
      print: new PrintParser(),
      comments: new CommentsParser(),
      operators: new OperatorsParser(),
      controlFlow: new ControlFlowParser(),
      loops: new LoopsParser(),
      arrays: new ArraysParser()
    };
    
    // Initialize C generators for Java
    this.generators = {
      variables: new JavaVariablesGenerator(),
      functions: new JavaFunctionsGenerator(),
      print: new JavaPrintGenerator(),
      comments: new JavaCommentsGenerator(),
      operators: new JavaOperatorsGenerator(),
      controlFlow: new JavaControlFlowGenerator(),
      loops: new JavaLoopsGenerator(),
      arrays: new JavaArraysGenerator(),
      ternary: new JavaTernaryGenerator(),
      expressionStatement: new JavaExpressionStatementGenerator()
    };
    
    this.needsStdbool = false; // Track if boolean is used
    
    console.log('✅ JavaToCTranslator initialized');
  }

  // Method to track boolean usage from other parts of the code
  trackBooleanUsage() {
    console.log('✓ Boolean usage detected - will include <stdbool.h>');
    this.needsStdbool = true;
  }

  translate(javaCode) {
    try {
      console.log('=== STARTING JAVA TO C TRANSLATION ===');
      console.log('Java input:', javaCode.substring(0, 100) + '...');
      
      // Reset boolean tracking for new translation
      this.needsStdbool = false;
      
      // Parse Java code with tree-sitter
      const tree = this.parser.parse(javaCode);
      console.log('✅ Tree parsed successfully');
      
      // Find the main method
      const mainMethodBody = this.extractMainMethodBody(tree.rootNode);
      
      if (!mainMethodBody) {
        return {
          success: false,
          code: '/* Error: No main method found in Java code */',
          warnings: ['No main method found']
        };
      }
      
      console.log('✅ Main method found, extracting statements with line positions...');
      
      // Get source lines for line number tracking
      const sourceLines = javaCode.split('\n');
      
      // Extract statements with line positions and comments
      const statementsWithInfo = this.extractStatementsWithLineInfo(mainMethodBody, sourceLines);
      console.log(`Found ${statementsWithInfo.length} items to convert`);
      
      // Convert to C while preserving line structure
      const cCode = this.convertToCPreservingLines(statementsWithInfo);
      
      return {
        success: true,
        code: cCode,
        warnings: []
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

  extractMainMethodBody(rootNode) {
    console.log('Looking for main method...');
    
    // Find class declaration
    const classDeclarations = this.findAllNodes(rootNode, 'class_declaration');
    if (classDeclarations.length === 0) {
      console.log('No class declaration found');
      return null;
    }
    
    const classNode = classDeclarations[0];
    
    // Find method declarations
    const methodDeclarations = this.findAllNodes(classNode, 'method_declaration');
    console.log(`Found ${methodDeclarations.length} methods`);
    
    for (const method of methodDeclarations) {
      // Check if this is the main method
      const methodName = this.getMethodName(method);
      const modifiers = this.getModifiers(method);
      
      console.log(`Checking method: ${methodName}, modifiers: ${modifiers.join(', ')}`);
      
      if (methodName === 'main' && 
          modifiers.includes('public') && 
          modifiers.includes('static')) {
        console.log('✅ Found main method!');
        
        // Get the method body (block)
        const blocks = this.findAllNodes(method, 'block');
        if (blocks.length > 0) {
          return blocks[0];
        }
      }
    }
    
    console.log('❌ No main method found');
    return null;
  }

  extractStatementsWithLineInfo(blockNode, sourceLines) {
    const items = [];
    let lastStatementLine = -1;
    
    console.log(`Extracting statements from block (${blockNode.childCount} children)`);
    
    for (let i = 0; i < blockNode.childCount; i++) {
      const child = blockNode.child(i);
      const lineNumber = child.startPosition.row + 1; // Convert from 0-based to 1-based
      const childText = child.text.trim();
      
      console.log(`  [${i}] ${child.type}: "${childText.substring(0, 50)}${childText.length > 50 ? '...' : ''}" at line ${lineNumber}`);
      
      // Skip braces and empty statements
      if (child.type === '{' || child.type === '}' || child.type === 'empty_statement') {
        console.log(`    Skipping: ${child.type}`);
        continue;
      }
      
      // Check for comments
      if (child.type === 'line_comment' || child.type === 'block_comment') {
        console.log(`    Found comment: "${childText}"`);
        
        // Check if this comment is on the same line as the last statement
        // If it is, skip it (it's already captured as inline comment)
        if (lineNumber === lastStatementLine) {
          console.log(`    Skipping duplicate comment on same line as statement`);
          continue;
        }
        
        // Only add comment as separate item if it's on its own line
        items.push({
          type: 'comment',
          node: child,
          lineNumber: lineNumber,
          text: childText,
          isBlockComment: child.type === 'block_comment'
        });
        continue;
      }
      
      // Add statement nodes
      const statementTypes = [
        'local_variable_declaration',
        'expression_statement',
        'if_statement',
        'for_statement',
        'while_statement',
        'do_statement',
        'enhanced_for_statement'
      ];
      
      if (statementTypes.includes(child.type)) {
        // Extract inline comment if present
        let inlineComment = '';
        const sourceLine = sourceLines[lineNumber - 1] || '';
        
        // Look for comment on this specific line after the statement
        const lineParts = sourceLine.split('//');
        if (lineParts.length > 1) {
          // Get everything after the first // (in case there are multiple //)
          const commentIndex = sourceLine.indexOf('//');
          if (commentIndex > sourceLine.indexOf(childText)) {
            inlineComment = sourceLine.substring(commentIndex + 2).trim();
            console.log(`    Found inline comment: "${inlineComment}"`);
          }
        }
        
        items.push({
          type: 'statement',
          node: child,
          lineNumber: lineNumber,
          text: childText,
          inlineComment: inlineComment
        });
        
        lastStatementLine = lineNumber;
        console.log(`    Added statement: ${child.type}`);
      } else {
        console.log(`    Skipping non-statement: ${child.type}`);
      }
    }
    
    // Sort by line number to maintain original order
    items.sort((a, b) => a.lineNumber - b.lineNumber);
    
    return items;
  }

  convertToCPreservingLines(items) {
  console.log('Converting statements to C while preserving line structure...');
  
  const cLines = [];
  
  // Don't add includes here yet - we'll add them properly later
  
  // Create a SHARED context for the entire translation
  const sharedContext = this.createSharedContext();
  
  let lastLineNumber = -1;
  let hasBodyStatements = false;
  
  // Process all items
  items.forEach((item, index) => {
    console.log(`\nConverting item ${index + 1} (line ${item.lineNumber}): ${item.type}`);
    
    // Add blank lines to preserve original spacing
    if (lastLineNumber >= 0) {
      const lineGap = item.lineNumber - lastLineNumber - 1;
      if (lineGap > 0) {
        cLines.push('');
      }
    }
    
    if (item.type === 'comment') {
      const commentLine = this.convertComment(item);
      cLines.push(`    ${commentLine}`);
    } else if (item.type === 'statement') {
      let cLine = this.generateStatementWithSharedContext(item.node, sharedContext);
      
      if (item.inlineComment) {
        cLine += `  // ${item.inlineComment}`;
      }
      
      if (cLine) {
        cLines.push(`    ${cLine}`);
        hasBodyStatements = true;
      }
    }
    
    lastLineNumber = item.lineNumber;
  });
  
  // NOW check if boolean was detected
  console.log('\n=== FINAL BOOLEAN CHECK ===');
  console.log('Boolean needed AFTER processing?', this.needsStdbool);
  
  // Build the final output in correct order
  const finalOutput = [];
  
  // 1. Add includes FIRST
  finalOutput.push('#include <stdio.h>');
  if (this.needsStdbool) {
    finalOutput.push('#include <stdbool.h>');
  }
  
  // 2. Empty line after includes
  finalOutput.push('');
  
  // 3. Main function header
  finalOutput.push('int main() {');
  
  // 4. Add all the body statements
  cLines.forEach(line => finalOutput.push(line));
  
  // 5. Add blank line before return if there are body statements
  if (hasBodyStatements) {
    finalOutput.push('');
  }
  
  // 6. Return statement and closing brace
  finalOutput.push('    return 0;');
  finalOutput.push('}');
  
  // Clean up excessive blank lines
  const cleanedLines = this.cleanExcessiveBlankLines(finalOutput);
  
  return cleanedLines.join('\n');
}

  // Create a shared context for the entire translation
  createSharedContext() {
    const variables = new Map();
    const symbols = new Map();
    
    const self = this;
    
    return {
      // Variable management
      addVariable: function(name, type, value = null) {
        variables.set(name, { type, value });
        console.log(`📝 [SharedContext] Added variable: ${name} (${type})`);
      },
      getVariableType: function(name) {
        const varInfo = variables.get(name);
        return varInfo ? varInfo.type : null;
      },
      
      // Symbol management (for arrays, loops, etc.)
      addSymbol: function(name, info) {
        symbols.set(name, info);
        console.log(`📝 [SharedContext] Added symbol: ${name} =`, info);
      },
      getSymbol: function(name) {
        const symbol = symbols.get(name);
        console.log(`[SharedContext] Getting symbol "${name}":`, symbol);
        return symbol;
      },
      
      // Generator access
      getGenerator: (name) => self.generators[name],
      getParser: (name) => self.parsers[name],
      
      // Translator reference
      translator: self,
      
      // Type mapping helper
      mapJavaTypeToC: (javaType) => {
        const typeMap = {
          'int': 'int',
          'float': 'float',
          'double': 'double',
          'char': 'char',
          'boolean': 'bool',
          'String': 'char*',
          'byte': 'signed char',
          'short': 'short',
          'long': 'long long'
        };
        
        if (javaType.endsWith('[]')) {
          const baseType = javaType.slice(0, -2);
          const cBaseType = typeMap[baseType] || 'int';
          return `${cBaseType}[]`;
        }
        
        return typeMap[javaType] || 'int';
      }
    };
  }

  // Generate statement using shared context
  generateStatementWithSharedContext(node, sharedContext) {
    console.log(`Generating ${node.type} with shared context`);
    
    switch (node.type) {
      case 'local_variable_declaration':
        return this.generateVariableDeclaration(node, sharedContext);
      case 'expression_statement':
        return this.generateExpressionStatement(node, sharedContext);
      case 'for_statement':
      case 'while_statement':
      case 'do_statement':
      case 'enhanced_for_statement':
        return this.generateLoopStatement(node, sharedContext);
      case 'if_statement':
        return this.generateControlFlowStatement(node, sharedContext);
      default:
        console.log(`No converter for: ${node.type}`);
        return `// TODO: Convert ${node.type}`;
    }
  }

  generateVariableDeclaration(node, sharedContext) {
    console.log('Generating variable declaration with shared context...');
    
    // Check if this is an array declaration FIRST
    const arraysParser = this.parsers.arrays;
    if (arraysParser && arraysParser.canParse && arraysParser.canParse(node)) {
      console.log('✅ This appears to be an array, using arrays parser...');
      
      try {
        const astNode = arraysParser.parse(node, sharedContext);
        console.log('✅ Array parsed successfully:', astNode);
        
        const arraysGenerator = this.generators.arrays;
        if (arraysGenerator && arraysGenerator.canGenerate && arraysGenerator.canGenerate(astNode)) {
          console.log('✅ Using arrays generator...');
          return arraysGenerator.generate(astNode, sharedContext);
        } else {
          console.log('❌ Arrays generator cannot generate this node');
        }
      } catch (error) {
        console.log('❌ Array parsing failed:', error.message);
      }
    }
    
    // If not an array or array parsing failed, fall back to variables parser
    try {
      const parser = this.parsers.variables;
      if (parser && parser.canParse && parser.canParse(node)) {
        console.log('Using variables parser (fallback)...');
        
        const astNode = parser.parse(node, sharedContext);
        
        const generator = this.generators.variables;
        if (generator && generator.canGenerate && generator.canGenerate(astNode)) {
          console.log('Using variables generator...');
          return generator.generate(astNode, sharedContext);
        }
      }
    } catch (error) {
      console.log('Parser/generator failed, using fallback:', error.message);
    }
    
    // Fallback: Simple conversion
    const text = node.text.trim();
    console.log(`Fallback conversion for: ${text}`);
    
    // Extract variable info
    const parts = text.split('=');
    if (parts.length === 2) {
      const declaration = parts[0].trim();
      const value = parts[1].replace(';', '').trim();
      
      // Extract variable name and type
      const words = declaration.split(' ');
      const varName = words[words.length - 1];
      const javaType = words[0];
      
      // Map Java type to C type
      let cType = 'int';
      if (javaType === 'String') {
        cType = 'char*';
      } else if (javaType === 'float') {
        cType = 'float';
      } else if (javaType === 'double') {
        cType = 'double';
      } else if (javaType === 'char') {
        cType = 'char';
      } else if (javaType === 'boolean') {
        cType = 'bool';
        // Track boolean usage
        if (this.trackBooleanUsage) {
          this.trackBooleanUsage();
        }
      }
      
      // Format value appropriately
      let formattedValue = value;
      if (javaType === 'String') {
        formattedValue = `"${value.replace(/"/g, '')}"`;
      } else if (javaType === 'boolean') {
        formattedValue = value === 'true' ? 'true' : 'false';
      }
      
      // Add to context for future reference
      if (sharedContext && sharedContext.addVariable) {
        sharedContext.addVariable(varName, cType);
      }
      
      return `${cType} ${varName} = ${formattedValue};`;
    }
    
    return `${text.replace(';', '')};`;
  }

  generateExpressionStatement(node, sharedContext) {
    console.log('Generating expression statement...');
    
    // Look for method invocation inside (like System.out.println)
    const methodInvocation = this.findChildByType(node, 'method_invocation');
    if (methodInvocation) {
      console.log('Found method_invocation child:', methodInvocation.text);
      const result = this.convertMethodInvocation(methodInvocation, sharedContext);
      console.log('convertMethodInvocation returned:', result);
      return result;
    }
    
    // If no method_invocation found, check if this node itself is one
    if (node.type === 'method_invocation' || 
        (node.text && (node.text.includes('System.out.println') || node.text.includes('System.out.print')))) {
      console.log('Node itself appears to be a print statement');
      return this.convertMethodInvocation(node, sharedContext);
    }
    
    // Try print parser directly
    try {
      const parser = this.parsers.print;
      if (parser && parser.canParse && parser.canParse(node)) {
        console.log('Print parser can parse this node');
        const astNode = parser.parse(node, sharedContext);
        const generator = this.generators.print;
        if (generator && generator.canGenerate && generator.canGenerate(astNode)) {
          const result = generator.generate(astNode, sharedContext);
          console.log('Generated via print generator:', result);
          return result;
        }
      }
    } catch (error) {
      console.log('Print conversion failed:', error.message);
    }
    
    // Fallback
    console.log('No converter found for expression statement');
    return `${node.text.replace(';', '')};`;
  }

  generateLoopStatement(node, sharedContext) {
    console.log(`Generating loop statement: ${node.type}`);
    
    try {
      const parser = this.parsers.loops;
      if (parser && parser.canParse && parser.canParse(node)) {
        // Create a new context that inherits from shared context
        const loopContext = Object.create(sharedContext);
        
        // Ensure addSymbol method exists and logs properly
        loopContext.addSymbol = function(name, info) {
          console.log(`📝 [LoopContext] Adding symbol: ${name} =`, info);
          // Also add to parent context
          if (sharedContext && sharedContext.addSymbol) {
            sharedContext.addSymbol(name, info);
          }
        };
        
        const astNode = parser.parse(node, loopContext);
        const generator = this.generators.loops;
        if (generator && generator.canGenerate && generator.canGenerate(astNode)) {
          return generator.generate(astNode, loopContext);
        }
      }
    } catch (error) {
      console.log(`Loop generation failed (${node.type}):`, error.message);
    }
    
    // Fallback
    return `// TODO: Generate ${node.type}`;
  }

  generateControlFlowStatement(node, sharedContext) {
    console.log(`Generating control flow statement: ${node.type}`);
    
    try {
      const parser = this.parsers.controlFlow;
      if (parser && parser.canParse && parser.canParse(node)) {
        const astNode = parser.parse(node, sharedContext);
        const generator = this.generators.controlFlow;
        if (generator && generator.canGenerate && generator.canGenerate(astNode)) {
          return generator.generate(astNode, sharedContext);
        }
      }
    } catch (error) {
      console.log(`Control flow generation failed (${node.type}):`, error.message);
    }
    
    // Fallback
    return `// TODO: Generate ${node.type}`;
  }

  convertMethodInvocation(node, context) {
    console.log('=== DEBUG convertMethodInvocation ===');
    console.log('Node type:', node.type);
    console.log('Node text:', node.text);
    
    const text = node.text.trim();
    
    // Check if this is a System.out.println statement
    if (text.includes('System.out.println') || text.includes('System.out.print')) {
      console.log('✅ Detected System.out.println/print statement');
      
      // Try to use the print parser first
      try {
        const parser = this.parsers.print;
        console.log('Print parser available:', !!parser);
        
        if (parser && parser.canParse && parser.canParse(node)) {
          console.log('✅ Print parser can parse this node');
          
          // Parse the node
          const astNode = parser.parse(node, context);
          console.log('Parsed AST node:', astNode);
          
          // Try to generate C code
          const generator = this.generators.print;
          if (generator && generator.canGenerate && generator.canGenerate(astNode)) {
            console.log('✅ Print generator can generate');
            const result = generator.generate(astNode, context);
            console.log('Generated print statement:', result);
            return result;
          } else {
            console.log('❌ Print generator cannot generate');
          }
        } else {
          console.log('❌ Print parser cannot parse this node');
        }
      } catch (error) {
        console.log('❌ Print parser/generator failed:', error.message);
      }
      
      // Fallback: Manual conversion
      console.log('Using fallback conversion for print statement');
      return this.fallbackConvertPrintln(text, context);
    }
    
    console.log('Not a print statement');
    return `// TODO: Convert method call: ${text}`;
  }

  fallbackConvertPrintln(text, context) {
    console.log('Fallback converting:', text);
    
    // Extract content inside println()
    const match = text.match(/System\.out\.println\((.+)\);/);
    if (!match) {
      console.log('No match found for println');
      return `// Could not parse: ${text}`;
    }
    
    const content = match[1].trim();
    console.log('Content inside println:', content);
    
    // Simple string literal
    if (content.startsWith('"') && content.endsWith('"')) {
      const message = content.slice(1, -1);
      return `printf("${message}\\n");`;
    }
    
    // String concatenation
    if (content.includes('+')) {
      const parts = content.split('+').map(p => p.trim());
      console.log('Concatenation parts:', parts);
      
      const formatParts = [];
      const valueParts = [];
      
      parts.forEach(part => {
        if (part.startsWith('"') && part.endsWith('"')) {
          // String literal
          formatParts.push(part.slice(1, -1));
        } else {
          // Variable or expression
          // Determine format specifier based on variable type
          let formatSpecifier = '%s'; // default for strings
          
          if (context && context.getSymbol) {
            const symbol = context.getSymbol(part);
            if (symbol) {
              const cType = symbol.cType || (symbol.type && symbol.type.cType);
              const javaType = symbol.javaType || (symbol.type && symbol.type.javaType);
              
              console.log(`Type of ${part}: cType=${cType}, javaType=${javaType}`);
              
              if (cType === 'char*' || javaType === 'String') {
                formatSpecifier = '%s';
              } else if (cType === 'int' || javaType === 'int' || 
                         javaType === 'byte' || javaType === 'short') {
                formatSpecifier = '%d';
              } else if (cType === 'float' || javaType === 'float') {
                formatSpecifier = '%f';
              } else if (cType === 'double' || javaType === 'double') {
                formatSpecifier = '%lf';
              } else if (cType === 'char' || javaType === 'char') {
                formatSpecifier = '%c';
              } else if (cType === 'bool' || javaType === 'boolean') {
                formatSpecifier = '%d';
              }
            }
          }
          
          formatParts.push(formatSpecifier);
          valueParts.push(part);
        }
      });
      
      const formatString = formatParts.join('');
      console.log('Format string:', formatString);
      console.log('Value parts:', valueParts);
      
      if (valueParts.length > 0) {
        return `printf("${formatString}\\n", ${valueParts.join(', ')});`;
      } else {
        return `printf("${formatString}\\n");`;
      }
    }
    
    // Single variable
    // Determine format specifier based on variable type
    let formatSpecifier = '%s';
    if (context && context.getSymbol) {
      const symbol = context.getSymbol(content);
      if (symbol) {
        const cType = symbol.cType || (symbol.type && symbol.type.cType);
        const javaType = symbol.javaType || (symbol.type && symbol.type.javaType);
        
        console.log(`Type of ${content}: cType=${cType}, javaType=${javaType}`);
        
        if (cType === 'char*' || javaType === 'String') {
          formatSpecifier = '%s';
        } else if (cType === 'int' || javaType === 'int' || 
                   javaType === 'byte' || javaType === 'short') {
          formatSpecifier = '%d';
        } else if (cType === 'float' || javaType === 'float') {
          formatSpecifier = '%f';
        } else if (cType === 'double' || javaType === 'double') {
          formatSpecifier = '%lf';
        } else if (cType === 'char' || javaType === 'char') {
          formatSpecifier = '%c';
        } else if (cType === 'bool' || javaType === 'boolean') {
          formatSpecifier = '%d';
        }
      }
    }
    
    return `printf("${formatSpecifier}\\n", ${content});`;
  }

  convertComment(item) {
    try {
      // Try using comments parser and generator
      const parser = this.parsers.comments;
      if (parser && parser.canParse && parser.canParse(item.node)) {
        const astNode = parser.parse(item.node, {});
        const generator = this.generators.comments;
        if (generator && generator.canGenerate && generator.canGenerate(astNode)) {
          const result = generator.generate(astNode, {});
          console.log('Comment generated via generator:', result);
          return result;
        }
      }
    } catch (error) {
      console.log('Comment conversion failed, using fallback:', error.message);
    }
    
    // Fallback conversion
    const text = item.text;
    if (item.isBlockComment) {
      // Block comment - keep as is (C uses same syntax)
      return text;
    } else {
      // Line comment - convert to C style
      const commentContent = text.startsWith('//') ? text.substring(2).trim() : text.trim();
      return `// ${commentContent}`;
    }
  }

  cleanExcessiveBlankLines(lines) {
    const cleaned = [];
    let consecutiveBlankLines = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trim() === '') {
        consecutiveBlankLines++;
        // Only add if this is the first blank line in a sequence
        if (consecutiveBlankLines === 1) {
          cleaned.push(line);
        }
        // Skip additional consecutive blank lines
      } else {
        consecutiveBlankLines = 0;
        cleaned.push(line);
      }
    }
    
    // Remove leading blank lines
    while (cleaned.length > 0 && cleaned[0].trim() === '') {
      cleaned.shift();
    }
    
    // Remove trailing blank lines
    while (cleaned.length > 0 && cleaned[cleaned.length - 1].trim() === '') {
      cleaned.pop();
    }
    
    return cleaned;
  }
  
  // Helper methods
  findAllNodes(node, type, results = []) {
    if (node.type === type) {
      results.push(node);
    }
    
    for (let i = 0; i < node.childCount; i++) {
      this.findAllNodes(node.child(i), type, results);
    }
    
    return results;
  }

  findChildByType(node, type) {
    if (node.type === type) return node;
    
    for (let i = 0; i < node.childCount; i++) {
      const found = this.findChildByType(node.child(i), type);
      if (found) return found;
    }
    
    return null;
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