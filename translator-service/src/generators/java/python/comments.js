export class CommentsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'comment';
  }

  generate(astNode, context) {
    const indent = context.getIndent();
    
    if (astNode.is_inline) {
      // Inline comment - should be added to previous line
      // We need a different approach here
      return ''; // We'll handle this differently in translator
    }
    
    // Block comment
    return `${indent}// ${astNode.text}`;
  }
}