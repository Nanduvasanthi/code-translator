import { CParserBase } from './parser-base.js';
import { Comment } from '../../core/ast-nodes.js';

export class CommentsParser extends CParserBase {
  canParse(node) {
    return node.type === 'comment';
  }

  parse(node, context) {
    const text = node.text || '';
    
    const comment = new Comment(text);
    
    // Add position info
    comment._position = {
      startLine: node.startPosition.row,
      endLine: node.endPosition.row,
      startColumn: node.startPosition.column,
      endColumn: node.endPosition.column
    };
    
    // MARK AS INLINE COMMENT if there's code on the same line before it
    comment._isInlineComment = this.isInlineComment(node);
    
    return comment;
  }

  isInlineComment(node) {
    // Check previous siblings on the same line
    let prev = node.prevSibling;
    
    while (prev) {
      if (prev.startPosition.row !== node.startPosition.row) {
        // Different line, stop checking
        break;
      }
      
      if (prev.type !== 'comment' && prev.text && prev.text.trim()) {
        // Found non-comment, non-whitespace content on same line
        return true;
      }
      
      prev = prev.prevSibling;
    }
    
    return false;
  }
}