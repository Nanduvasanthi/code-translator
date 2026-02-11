import { ConditionalStatement } from '../../../core/ast-nodes.js';

export class ConditionalsGenerator {
  canGenerate(astNode) {
    return astNode && astNode instanceof ConditionalStatement;
  }

  generate(astNode, context) {
    const { condition, then_branch, else_branch, elif_branches = [] } = astNode;
    
    // Build the complete conditional statement with proper indentation
    let javaCode = '';
    const outerIndent = ''; // 4 spaces for inside main method
    const innerIndent = '    '; // 8 spaces for inside blocks
    
    // Start with if
    const conditionStr = this.conditionToJava(condition);
    javaCode += `${outerIndent}if (${conditionStr}) {\n`;
    javaCode += this.generateBlock(then_branch, innerIndent);
    javaCode += `${outerIndent}}`; // Closing brace with outer indent
    
    // Add elif branches
    if (elif_branches && elif_branches.length > 0) {
      for (let i = 0; i < elif_branches.length; i++) {
        const elif = elif_branches[i];
        
        if (elif && elif.condition) {
          const elifCondition = this.conditionToJava(elif.condition);
          javaCode += ` else if (${elifCondition}) {\n`;
          javaCode += this.generateBlock(elif.thenBranch, innerIndent);
          javaCode += `${outerIndent}}`; // Closing brace with outer indent
        }
      }
    }
    
    // Add else branch
    if (else_branch && else_branch.length > 0) {
      javaCode += ' else {\n';
      javaCode += this.generateBlock(else_branch, innerIndent);
      javaCode += `${outerIndent}}`; // Closing brace with outer indent
    } else if (elif_branches.length === 0) {
      // Only add line break if there's no else
      javaCode += '';
    }
    
    return javaCode;
  }

  conditionToJava(condition) {
    if (!condition) return 'true';
    
    if (condition.type === 'comparison') {
      // Use the expression if available, otherwise build it
      if (condition.expression) {
        return condition.expression;
      } else if (condition.left && condition.operator && condition.right) {
        return `${condition.left} ${condition.operator} ${condition.right}`;
      }
      return condition.expression || 'true';
    } else if (condition.type === 'raw') {
      return condition.value;
    }
    
    return 'true';
  }

  generateBlock(statements, indent) {
    let javaCode = '';
    
    if (statements && Array.isArray(statements)) {
      for (const stmt of statements) {
        if (stmt && stmt.type === 'raw') {
          const translated = this.translateStatement(stmt.code);
          if (translated) {
            javaCode += indent + translated + '\n';
          }
        }
      }
    }
    
    return javaCode;
  }

  translateStatement(pythonCode) {
    if (!pythonCode) return '';
    
    pythonCode = pythonCode.trim();
    
    // Variable assignment
    if (pythonCode.includes('=')) {
      const parts = pythonCode.split('=');
      const left = parts[0].trim();
      const right = parts.slice(1).join('=').trim();
      
      // Don't redeclare variables inside blocks
      return `${left} = ${right};`;
    }
    
    // Print statement
    if (pythonCode.startsWith('print(')) {
      const match = pythonCode.match(/print\((.+)\)/);
      if (match) {
        const content = match[1].trim();
        if (content.startsWith('"') || content.startsWith("'")) {
          const text = content.substring(1, content.length - 1);
          return `System.out.println("${text}");`;
        } else {
          return `System.out.println(${content});`;
        }
      }
    }
    
    return `// ${pythonCode}`;
  }
}