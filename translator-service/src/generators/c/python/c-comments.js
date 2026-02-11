export class CommentsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'comment';
  }

  generate(astNode, context) {
    if (astNode.isBlockComment) {
      return `/* ${astNode.text} */`;
    } else {
      return `// ${astNode.text}`;
    }
  }
}