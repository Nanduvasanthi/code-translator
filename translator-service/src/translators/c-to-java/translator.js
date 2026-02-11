// translators/c-to-java/translator.js - COMPLETELY FIXED VERSION
import Parser from 'tree-sitter';
import C from 'tree-sitter-c';
import { CToJavaVisitor } from './visitor.js';
import { CToJavaContext } from './context.js';

// Import Java generators
import * as CVariablesGenerator from '../../generators/java/c/c-variables.js';
import * as FunctionsGenerator from '../../generators/java/c/functions.js';
import * as CConditionalsGenerator from '../../generators/java/c/c-conditionals.js';
import * as CLoopsGenerator from '../../generators/java/c/c-loops.js';
import * as ArraysGenerator from '../../generators/java/c/c-arrays.js';
import * as CCommentsGenerator from '../../generators/java/c/c-comments.js';
import * as COperatorsGenerator from '../../generators/java/c/c-operators.js';
//import * as BuiltinsGenerator from '../../generators/java/builtins.js';
import * as CPrintGenerator from '../../generators/java/c/c-print.js';
import * as CTernaryGenerator from '../../generators/java/c/c-ternary.js';
import * as CExpressionStatementGenerator from '../../generators/java/c/c-expression-statement.js';



// Import C parsers
import { BasicSyntaxParser } from '../../parsers/c/basic-syntax.js';
import { OperatorsParser } from '../../parsers/c/operators.js';
import { ControlFlowParser } from '../../parsers/c/control-flow.js';
import { LoopsParser } from '../../parsers/c/loops.js';
import { ArraysParser } from '../../parsers/c/arrays.js';
import { CommentsParser } from '../../parsers/c/comments.js';
import { PrintParser } from '../../parsers/c/print.js';
import { VariableParser } from '../../parsers/c/variables.js';

export class CToJavaTranslator {
  constructor() {
    this.parser = new Parser();
    
    // Handle both ES modules and CommonJS
    const CLang = C.default || C;
    this.parser.setLanguage(CLang);
    
    // Initialize parsers
    this.parsers = {
      print: new PrintParser(),
      basicSyntax: new BasicSyntaxParser(),
      operators: new OperatorsParser(),
      controlFlow: new ControlFlowParser(),
      loops: new LoopsParser(),
      arrays: new ArraysParser(),
      comments: new CommentsParser(),
      variables: new VariableParser()
    };
    
    // Initialize generators
    this.generators = {
      variables: CVariablesGenerator,
      functions: FunctionsGenerator,
      conditionals: CConditionalsGenerator,
      loops: CLoopsGenerator,
      ternary: CTernaryGenerator,
      arrays: ArraysGenerator,
      comments: CCommentsGenerator,
      operators: COperatorsGenerator,
      //builtins: BuiltinsGenerator,
      print: CPrintGenerator,
      expressionStatement: CExpressionStatementGenerator,
    };
    
    console.log('✅ C parser initialized successfully');
  }

  // Main translation method - NOW USING AST PARSING
  translate(cCode) {
    try {
      console.log('📝 Starting AST-based translation...');
      console.log('📄 Input C code:');
      console.log(cCode);
      return this.translateWithTreeSitter(cCode);
    } catch (error) {
      console.error('❌ AST translation failed:', error.message);
      console.log('🔄 Falling back to basic conversion...');
      return this.improvedBasicConversion(cCode);
    }
  }

  translateWithTreeSitter(cCode) {
    // Parse C code
    const tree = this.parser.parse(cCode);
    console.log('✅ AST parsed successfully');
    
    const context = new CToJavaContext();
    
    // Register parsers in context
    for (const [name, parser] of Object.entries(this.parsers)) {
      context.registerParser(name, parser);
    }
    
    // Create visitor
    const visitor = new CToJavaVisitor(this.generators);
    
    // Parse AST into intermediate representation WITH DEBUG AND POSITION TRACKING
    const parsedNodes = this.debugParseASTWithPositions(tree.rootNode, context);
    console.log(`✅ Parsed ${parsedNodes.length} AST nodes`);
    
    // DEBUG: Show what was parsed
    console.log('📋 Parsed AST nodes:');
    parsedNodes.forEach((node, i) => {
      console.log(`  ${i + 1}. ${node.type || 'unknown'}`);
      if (node.name) console.log(`     Name: ${node.name}`);
      if (node.args) console.log(`     Args: ${JSON.stringify(node.args).substring(0, 100)}`);
      if (node.value) console.log(`     Value: ${JSON.stringify(node.value).substring(0, 100)}`);
      if (node.text) console.log(`     Text: ${node.text?.substring(0, 100)}`);
      if (node._position) console.log(`     Position: line ${node._position.startLine}-${node._position.endLine}`);
    });
    
    // Visit ALL nodes at once
    console.log('🔄 Visiting nodes with generators...');
    const javaCode = visitor.visit(parsedNodes);
    console.log(`📝 Generated ${javaCode.split('\n').length} lines of Java code`);
    
    console.log('✅ Translation completed successfully');
    console.log('🎯 Final Java code:');
    console.log(javaCode);
    return javaCode;
  }

  // FIXED: Parse AST with position tracking and SKIP CHILDREN logic
  debugParseASTWithPositions(rootNode, context) {
    const parsedNodes = [];
    console.log('🔍 Starting debug AST parsing with position tracking...');
    let totalNodes = 0;
    let parsedCount = 0;
    
    const parseNode = (node, depth = 0) => {
      if (!node) return;
      totalNodes++;
      
      const interestingTypes = ['function_definition', 'call_expression', 'declaration', 
                               'preproc_include', 'comment', 'if_statement', 'for_statement',
                               'switch_statement', 'while_statement', 'conditional_expression'];
      
      if (interestingTypes.includes(node.type)) {
        console.log(`  ${'  '.repeat(depth)}Found ${node.type} at line ${node.startPosition.row}: "${node.text?.substring(0, 50)}..."`);
      }
      
      // Try each parser
      let wasParsed = false;
      let skipChildren = false;
      
      for (const [parserName, parser] of Object.entries(this.parsers)) {
        if (parser.canParse && parser.canParse(node)) {
          console.log(`  ${'  '.repeat(depth)}✓ Parser "${parserName}" can parse ${node.type}`);
          try {
            const parsed = parser.parse(node, context);
            if (parsed) {
              // ⭐⭐ CRITICAL FIX: Handle arrays returned by parsers
              if (Array.isArray(parsed)) {
                console.log(`  ${'  '.repeat(depth)}  → Created array of ${parsed.length} nodes at line ${node.startPosition.row}`);
                
                for (const item of parsed) {
                  if (item && typeof item === 'object') {
                    // Add position info to each item
                    item._position = {
                      startLine: node.startPosition.row,
                      endLine: node.endPosition.row,
                      startColumn: node.startPosition.column,
                      endColumn: node.endPosition.column,
                      originalText: node.text
                    };
                    
                    const nodeType = item.type || 'unknown';
                    console.log(`  ${'  '.repeat(depth)}    → Array item: ${nodeType} "${item.name || ''}"`);
                    
                    parsedNodes.push(item);
                    parsedCount++;
                  }
                }
                wasParsed = true;
                
                // Skip children for declaration arrays
                if (node.type === 'declaration') {
                  skipChildren = true;
                  console.log(`  ${'  '.repeat(depth)}  ⭐ Skipping children of declaration (handled multiple declarations)`);
                }
              } else {
                // Single node
                parsed._position = {
                  startLine: node.startPosition.row,
                  endLine: node.endPosition.row,
                  startColumn: node.startPosition.column,
                  endColumn: node.endPosition.column,
                  originalText: node.text
                };
                
                const nodeType = parsed.type || 'unknown';
                console.log(`  ${'  '.repeat(depth)}  → Created ${nodeType} node at line ${parsed._position.startLine}`);
                parsedNodes.push(parsed);
                parsedCount++;
                wasParsed = true;
                
                // Skip children for certain node types
                const skipChildTypes = [
                  'if_statement', 
                  'switch_statement', 
                  'conditional_expression',
                  'for_statement',
                  'while_statement',
                  'do_statement'
                ];
                
                if (skipChildTypes.includes(node.type)) {
                  skipChildren = true;
                  console.log(`  ${'  '.repeat(depth)}  ⭐ Skipping children of ${node.type} (already handled by parser)`);
                }
              }
            }
          } catch (parseError) {
            console.warn(`  ${'  '.repeat(depth)}  ✗ Parser failed:`, parseError.message);
          }
          break;
        }
      }
      
      if (!wasParsed && interestingTypes.includes(node.type)) {
        console.log(`  ${'  '.repeat(depth)}✗ No parser found for ${node.type}`);
      }
      
      // Only parse children if we should
      if (!skipChildren) {
        for (let i = 0; i < node.childCount; i++) {
          parseNode(node.child(i), depth + 1);
        }
      }
    };
    
    parseNode(rootNode);
    console.log(`🔍 Processed ${totalNodes} total nodes, parsed ${parsedCount} into AST nodes`);
    
    // Sort nodes by line number to maintain original order
    return parsedNodes.sort((a, b) => {
      const lineA = a._position?.startLine || 0;
      const lineB = b._position?.startLine || 0;
      return lineA - lineB;
    });
  }

  // Keep the old wrapInClass as backup
  wrapInClass(code, parsedNodes) {
    const className = 'Main';
    
    // Split code into lines
    const lines = code.split('\n');
    const processedLines = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.includes('#include') && !trimmed.includes('<stdio.h>')) {
        processedLines.push(line);
      }
    }
    
    // Build Java code
    let javaCode = `public class ${className} {\n`;
    javaCode += `    public static void main(String[] args) {\n`;
    
    for (const line of processedLines) {
      const trimmed = line.trim();
      if (trimmed) {
        javaCode += `        ${line}\n`;
      }
    }
    
    javaCode += `    }\n`;
    javaCode += `}\n`;
    
    return javaCode;
  }

  // Fallback basic conversion (kept for compatibility)
  improvedBasicConversion(cCode) {
    let result = 'public class Main {\n';
    result += '    public static void main(String[] args) {\n';
    
    const lines = cCode.split('\n');
    let inMainFunction = false;
    let braceCount = 0;
    let lastHadContent = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();
      
      if (!trimmed) {
        // Preserve empty lines when we're in main function
        if (inMainFunction && lastHadContent) {
          result += '\n';
          lastHadContent = false;
        }
        continue;
      }
      
      if (trimmed.startsWith('//')) {
        if (inMainFunction) {
          result += '        // ' + trimmed.substring(2) + '\n';
          lastHadContent = true;
        }
        continue;
      }
      
      if (trimmed.startsWith('#include')) {
        if (inMainFunction) {
          result += '        // ' + trimmed + '\n';
          lastHadContent = true;
        }
        continue;
      }
      
      if (trimmed.includes('int main()') || trimmed.includes('int main(void)')) {
        inMainFunction = true;
        braceCount = 0;
        continue;
      }
      
      if (inMainFunction) {
        for (const char of line) {
          if (char === '{') braceCount++;
          if (char === '}') braceCount--;
        }
        
        if (braceCount <= 0 && trimmed.includes('}')) {
          inMainFunction = false;
          continue;
        }
        
        if (trimmed === '{') {
          continue;
        }
        
        const javaLine = this.convertCStatement(trimmed);
        if (javaLine) {
          result += '        ' + javaLine + '\n';
          lastHadContent = true;
        }
      }
    }
    
    result += '    }\n';
    result += '}\n';
    
    return result;
  }

  convertCStatement(cLine) {
    let line = cLine.replace(/;$/, '');
    
    if (line.includes('printf(')) {
      return this.convertPrintf(line);
    }
    
    if (line.includes('char') && line.includes('[') && line.includes(']')) {
      return this.convertCharArray(line);
    }
    
    if (line.includes('int ') || line.includes('float ') || line.includes('double ')) {
      return this.convertVariable(line);
    }
    
    if (line.includes('return')) {
      if (line.includes('return 0')) {
        return '';
      }
      return line + ';';
    }
    
    if (line) {
      return '// ' + line + ';';
    }
    
    return '';
  }

  convertPrintf(line) {
    const match = line.match(/printf\("([^"]+)"(.*)\)/);
    if (!match) return '// ' + line + ';';
    
    const formatString = match[1];
    const argsPart = match[2];
    
    const cleanFormat = formatString.replace(/\\n$/, '');
    const args = argsPart ? 
      argsPart.split(',').map(arg => arg.trim()).filter(arg => arg) : [];
    
    if (cleanFormat.includes('%')) {
      let javaString = cleanFormat;
      let argIndex = 0;
      
      javaString = javaString
        .replace(/%s/g, () => {
          if (argIndex < args.length) {
            return `" + ${args[argIndex++]} + "`;
          }
          return '""';
        })
        .replace(/%d/g, () => {
          if (argIndex < args.length) {
            return `" + ${args[argIndex++]} + "`;
          }
          return '"0"';
        });
      
      javaString = javaString.replace(/^" \+ /, '').replace(/ \+ "$/, '');
      
      if (javaString === '""') {
        return 'System.out.println();';
      }
      
      return `System.out.println(${javaString});`;
    } else {
      return `System.out.println("${cleanFormat}");`;
    }
  }

  convertCharArray(line) {
    const match = line.match(/char\s+(\w+)\[\]\s*=\s*"([^"]+)"/);
    if (match) {
      return `String ${match[1]} = "${match[2]}";`;
    }
    
    return '// ' + line + ';';
  }

  convertVariable(line) {
    let javaLine = line
      .replace('unsigned ', '')
      .replace('long ', 'long')
      .replace('short ', 'short');
    
    return javaLine + ';';
  }
}