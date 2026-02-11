export class CommentsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'comment';
  }

  generate(astNode, context) {
    const indent = context.getIndent();
    
    if (astNode.isLineComment) {
      // Single line comment
      return `${indent}# ${astNode.text}`;
    } else {
      // Multi-line comment
      const lines = astNode.text.split('\n');
      return lines.map(line => `${indent}# ${line.trim()}`).join('\n');
    }
  }
}