import { Comment } from '../../core/ast-nodes.js';

export class CommentsParser {
  canParse(node) {
    return node.type === 'comment';
  }

  parse(node, context) {
    const text = node.text || '';
    
    // Check if this is an inline comment (after code on same line)
    // In tree-sitter, we need to check the parent/context
    const isInline = this.isInlineComment(node);
    
    const cleanText = text.replace(/^#\s*/, '').trim();
    return new Comment(cleanText, isInline);
  }

  isInlineComment(node) {
    // Check if comment is on same line as code
    // Look at siblings to see if there's code before the comment
    const parent = node.parent;
    if (!parent) return false;
    
    let foundCodeBefore = false;
    for (let i = 0; i < parent.childCount; i++) {
      const sibling = parent.child(i);
      if (sibling === node) {
        return foundCodeBefore;
      }
      // Check if sibling is code (not whitespace or newline)
      if (sibling.type !== '\n' && sibling.type !== '' && sibling.type !== 'comment') {
        foundCodeBefore = true;
      }
    }
    return false;
  }
}