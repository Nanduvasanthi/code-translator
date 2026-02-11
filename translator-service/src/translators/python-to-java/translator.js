import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import { TranslationContext } from './context.js';

// Import parsers
import { VariablesParser } from '../../parsers/python/variables.js';
import { PrintParser } from '../../parsers/python/print.js';
import { CommentsParser } from '../../parsers/python/comments.js';
import { OperatorsParser } from '../../parsers/python/operators.js';
import { ConditionalsParser } from '../../parsers/python/conditionals.js';
import { TernaryParser } from '../../parsers/python/ternary.js';
import { LoopsParser } from '../../parsers/python/loops.js';
import { ArraysParser } from '../../parsers/python/arrays.js'; // ADD THIS

// Import generators
import { VariablesGenerator } from '../../generators/java/python/variables.js';
import { PrintGenerator } from '../../generators/java/python/print.js';
import { CommentsGenerator } from '../../generators/java/python/comments.js';
import { OperatorsGenerator } from '../../generators/java/python/operators.js';
import { ConditionalsGenerator } from '../../generators/java/python/conditionals.js';
import { TernaryGenerator } from '../../generators/java/python/ternary.js';
import { LoopsGenerator } from '../../generators/java/python/loops.js';
import { ArraysGenerator } from '../../generators/java/python/arrays.js'; // ADD THIS

export class PythonToJavaTranslator {
  constructor() {
    this.parser = new Parser();
    this.parser.setLanguage(Python);
    
    // Initialize parsers - ORDER MATTERS! ArraysParser should come before VariablesParser
    this.parsers = {
      arrays: new ArraysParser(),      // ADD THIS - CHECK FOR ARRAYS FIRST
      variables: new VariablesParser(),
      print: new PrintParser(),
      comments: new CommentsParser(),
      operators: new OperatorsParser(),
      conditionals: new ConditionalsParser(),
      ternary: new TernaryParser(),
      loops: new LoopsParser()
    };
    
    // Initialize generators
    this.generators = {
      arrays: new ArraysGenerator(),    // ADD THIS
      variables: new VariablesGenerator(),
      print: new PrintGenerator(),
      comments: new CommentsGenerator(),
      operators: new OperatorsGenerator(),
      conditionals: new ConditionalsGenerator(),
      ternary: new TernaryGenerator(),
      loops: new LoopsGenerator()
    };
    
    // Track processed lines to avoid duplicates
    this.processedLines = new Set();
  }

  translate(pythonCode) {
    try {
      // Parse the entire Python code
      const tree = this.parser.parse(pythonCode);
      
      const context = new TranslationContext();
      
      // Register parsers and generators in context
      for (const [name, parser] of Object.entries(this.parsers)) {
        context.registerParser(name, parser);
      }
      
      for (const [name, generator] of Object.entries(this.generators)) {
        context.registerGenerator(name, generator);
      }
      
      // Reset processed lines
      this.processedLines.clear();
      
      // Split input into lines
      const inputLines = pythonCode.split('\n');
      const maxLineNum = inputLines.length - 1;
      
      // Process lines
      const outputLines = [];
      
      for (let lineNum = 0; lineNum <= maxLineNum; lineNum++) {
        // Skip if already processed (e.g., part of a conditional block)
        if (this.processedLines.has(lineNum)) {
          continue;
        }
        
        const inputLine = inputLines[lineNum];
        
        if (inputLine.trim() === '') {
          // Empty line - preserve it
          outputLines.push('');
          continue;
        }
        
        // Get nodes for this line
        const lineNodes = this.getNodesForLine(tree.rootNode, lineNum);
        
        if (lineNodes.length === 0) {
          // No nodes found - could be a comment line
          if (inputLine.trim().startsWith('#')) {
            const commentText = inputLine.trim().substring(1).trim();
            outputLines.push(`// ${commentText}`);
          } else {
            // Unknown line type, preserve as comment
            outputLines.push(`// ${inputLine}`);
          }
        } else {
          // Check if this line starts a conditional block
          const hasIfStatement = lineNodes.some(n => n.type === 'if_statement');
          const hasLoopStatement = lineNodes.some(n => n.type === 'for_statement' || n.type === 'while_statement');
          
          if (hasIfStatement) {
            // Process the entire conditional block
            const ifNode = lineNodes.find(n => n.type === 'if_statement');
            const conditionalResult = this.processConditionalBlock(ifNode, context, lineNum);
            
            if (conditionalResult) {
              outputLines.push(conditionalResult.code);
              // Mark all lines in the conditional block as processed
              conditionalResult.processedLines.forEach(l => this.processedLines.add(l));
            }
          } else if (hasLoopStatement) {
            // Process the entire loop block
            const loopNode = lineNodes.find(n => n.type === 'for_statement' || n.type === 'while_statement');
            const loopResult = this.processLoopBlock(loopNode, context, lineNum);
            
            if (loopResult) {
              outputLines.push(loopResult.code);
              // Mark all lines in the loop block as processed
              loopResult.processedLines.forEach(l => this.processedLines.add(l));
            }
          } else {
            // Process normal line
            const lineResult = this.processLineNodes(lineNodes, context, lineNum);
            if (lineResult !== null) {
              outputLines.push(lineResult);
            }
          }
        }
      }
      
      // Generate final Java code
      return this.generateJavaClass(outputLines);
      
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error.message}`);
    }
  }

  getNodesForLine(node, targetLine) {
    const nodes = [];
    
    const collect = (currentNode) => {
      const lineNum = currentNode.startPosition.row;
      
      if (lineNum === targetLine) {
        // Check if this is a statement-level node
        if (this.isStatementLevelNode(currentNode)) {
          nodes.push(currentNode);
        }
      }
      
      // Continue searching children
      for (let i = 0; i < currentNode.childCount; i++) {
        collect(currentNode.child(i));
      }
    };
    
    collect(node);
    return nodes;
  }

  isStatementLevelNode(node) {
    // Check if this node is a top-level statement
    const statementTypes = [
      'assignment',
      'expression_statement',
      'call',
      'comment',
      'if_statement',
      'elif_clause',
      'else_clause',
      'conditional_expression',
      'for_statement',
      'while_statement',
      'list' // ADD THIS - for list literals
    ];
    
    if (!statementTypes.includes(node.type)) {
      return false;
    }
    
    // Check if parent is module or block (not another statement)
    const parent = node.parent;
    if (!parent) return true;
    
    const parentTypes = ['module', 'block'];
    return parentTypes.includes(parent.type) || 
           (parent.type === 'expression_statement' && node.type !== 'expression_statement');
  }

  processConditionalBlock(ifNode, context, startLine) {
    console.log(`Processing conditional block starting at line ${startLine}`);
    
    // Mark ALL lines in the entire if-elif-else structure
    const processedLines = new Set();
    this.markAllConditionalLines(ifNode, processedLines);
    
    console.log(`Marked ${processedLines.size} lines as processed`);
    
    // Collect all clauses
    const allClauses = this.collectAllConditionalClauses(ifNode);
    
    // Parse the complete conditional structure
    const parser = this.parsers.conditionals;
    if (parser.canParse(ifNode)) {
      const astNode = parser.parse(ifNode, context, allClauses);
      const generator = this.generators.conditionals;
      
      if (generator && generator.canGenerate(astNode)) {
        const code = generator.generate(astNode, context);
        return { code, processedLines };
      }
    }
    
    return null;
  }

  processLoopBlock(loopNode, context, startLine) {
    console.log(`Processing loop block starting at line ${startLine}`);
    
    // Mark ALL lines in the entire loop structure
    const processedLines = new Set();
    this.markAllLoopLines(loopNode, processedLines);
    
    console.log(`Marked ${processedLines.size} lines as processed`);
    
    // Parse the loop structure
    const parser = this.parsers.loops;
    if (parser.canParse(loopNode)) {
      const astNode = parser.parse(loopNode, context);
      const generator = this.generators.loops;
      
      if (generator && generator.canGenerate(astNode)) {
        const code = generator.generate(astNode, context);
        return { code, processedLines };
      }
    }
    
    return null;
  }

  markAllLoopLines(node, processedLines) {
    // Mark this node's line
    const lineNum = node.startPosition.row;
    processedLines.add(lineNum);
    
    // Mark all children (including nested blocks)
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      this.markAllLoopLines(child, processedLines);
    }
  }

  markAllConditionalLines(node, processedLines) {
    // Mark this node's line
    const lineNum = node.startPosition.row;
    processedLines.add(lineNum);
    
    // Mark all children (including elif/else clauses and their blocks)
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      this.markAllConditionalLines(child, processedLines);
    }
  }

  collectAllConditionalClauses(ifNode) {
    const clauses = [{ type: 'if', node: ifNode }];
    
    // Look for elif/else as children of the if statement
    for (let i = 0; i < ifNode.childCount; i++) {
      const child = ifNode.child(i);
      
      if (child.type === 'elif_clause') {
        clauses.push({ type: 'elif', node: child });
      } else if (child.type === 'else_clause') {
        clauses.push({ type: 'else', node: child });
      }
    }
    
    console.log(`Collected ${clauses.length} clauses from if statement`);
    return clauses;
  }

  collectConditionalClauses(ifNode, processedLines) {
    const clauses = [{ type: 'if', node: ifNode }];
    let current = ifNode;
    
    // Mark lines in the if clause
    this.markNodeLines(ifNode, processedLines);
    
    // Find elif and else clauses
    while (current.nextNamedSibling) {
      current = current.nextNamedSibling;
      
      if (current.type === 'elif_clause') {
        clauses.push({ type: 'elif', node: current });
        this.markNodeLines(current, processedLines);
      } else if (current.type === 'else_clause') {
        clauses.push({ type: 'else', node: current });
        this.markNodeLines(current, processedLines);
        break;
      } else {
        break;
      }
    }
    
    return clauses;
  }

  markNodeLines(node, processedLines) {
    const lineNum = node.startPosition.row;
    processedLines.add(lineNum);
    
    // Also mark lines in any blocks inside this node
    const markBlockLines = (currentNode) => {
      for (let i = 0; i < currentNode.childCount; i++) {
        const child = currentNode.child(i);
        const childLine = child.startPosition.row;
        processedLines.add(childLine);
        markBlockLines(child);
      }
    };
    
    // Find block and mark its lines
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i);
      if (child.type === 'block') {
        markBlockLines(child);
      }
    }
  }

  processLineNodes(nodes, context, lineNum) {
    let codeOutput = '';
    let commentOutput = '';
    
    // Process each node on this line
    for (const node of nodes) {
      try {
        const translation = this.translateNode(node, context);
        
        if (translation) {
          if (node.type === 'comment') {
            // It's a comment
            commentOutput = translation.replace(/^\/\/\s*/, '');
          } else {
            // It's code (variable assignment or print)
            codeOutput = translation;
          }
        }
      } catch (error) {
        console.warn(`Error translating node ${node.type} at line ${lineNum}:`, error.message);
      }
    }
    
    // Combine code and comment
    if (codeOutput && commentOutput) {
      return codeOutput + ' // ' + commentOutput;
    } else if (codeOutput) {
      return codeOutput;
    } else if (commentOutput) {
      return '// ' + commentOutput;
    }
    
    return null;
  }

  translateNode(node, context) {
    // Handle expression_statement wrapper
    let targetNode = node;
    if (node.type === 'expression_statement') {
      // Get the actual expression inside
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child.type !== '\n' && child.type !== '' && child.type !== 'comment') {
          targetNode = child;
          break;
        }
      }
    }
    
    // Try each parser - IMPORTANT: ArraysParser is checked first
    for (const [parserName, parser] of Object.entries(this.parsers)) {
      if (parser.canParse(targetNode)) {
        console.log(`Using parser: ${parserName} for node: ${targetNode.type}`);
        const astNode = parser.parse(targetNode, context);
        
        // Get the matching generator
        const generator = this.generators[parserName];
        if (generator && generator.canGenerate(astNode)) {
          return generator.generate(astNode, context);
        }
        break;
      }
    }
    
    return null;
  }

  generateJavaClass(outputLines) {
    let javaCode = 'public class Main {\n';
    javaCode += '    public static void main(String[] args) {\n';
    
    // Filter out null/undefined lines
    const validLines = outputLines.filter(line => line !== null && line !== undefined);
    
    if (validLines.length > 0) {
      for (const line of validLines) {
        if (line.trim() === '') {
          // Empty line - preserve it
          javaCode += '\n';
        } else {
          // Handle multi-line strings (like if-else blocks from ConditionalsGenerator)
          const lines = line.split('\n');
          for (const singleLine of lines) {
            if (singleLine.trim() !== '') {
              // Regular line with proper indentation
              javaCode += '        ' + singleLine + '\n';
            }
          }
        }
      }
    } else {
      javaCode += '        // Your code here\n';
    }
    
    javaCode += '    }\n';
    javaCode += '}\n';
    
    return javaCode;
  }
}