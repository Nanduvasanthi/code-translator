import { Comment } from '../../../core/ast-nodes.js';

export class JavaCommentsGenerator {
  constructor() {
    console.log('✅ C JavaCommentsGenerator initialized');
  }

  canGenerate(astNode) {
    return astNode.type === 'comment';
  }

  generate(astNode, context) {
    if (!this.canGenerate(astNode)) {
      console.warn(`JavaCommentsGenerator cannot generate node type: ${astNode.type}`);
      return '';
    }

    console.log(`JavaCommentsGenerator processing comment: ${astNode.text.substring(0, 50)}...`);

    // Convert Java comments to C comments
    const commentText = astNode.text || '';
    
    if (commentText.startsWith('//')) {
      // Line comment - convert to C style
      const content = commentText.substring(2).trim();
      return `// ${content}`;
    } else if (commentText.startsWith('/*') && commentText.endsWith('*/')) {
      // Block comment - keep as is (C uses same syntax)
      return commentText;
    } else {
      // Unknown comment format, try to convert
      return `/* ${commentText} */`;
    }
  }
}