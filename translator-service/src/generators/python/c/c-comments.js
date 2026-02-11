import { Comment } from '../../../core/ast-nodes.js';

export class CommentsGenerator {
  canGenerate(astNode) {
    return astNode.type === 'comment';
  }

  generate(astNode, context) {
    const { text } = astNode;
    
    if (text.startsWith('//')) {
      // Single line comment
      const commentText = text.substring(2).trim();
      return `# ${commentText}`;
    } else if (text.startsWith('/*')) {
      // Block comment
      const commentText = text.substring(2, text.length - 2).trim();
      const lines = commentText.split('\n');
      
      if (lines.length === 1) {
        return `# ${lines[0].trim()}`;
      } else {
        return lines.map(line => `# ${line.trim()}`).join('\n');
      }
    }
    
    return `# ${text}`;
  }
}