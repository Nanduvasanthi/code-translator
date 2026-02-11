import { Comment } from '../../core/ast-nodes.js';

export class CommentsParser {
  canParse(node) {
    return node.type === 'line_comment' || node.type === 'block_comment';
  }

  parse(node, context) {
    const text = node.text;
    const isLineComment = node.type === 'line_comment';
    
    // Extract comment text
    let commentText = '';
    if (isLineComment) {
      commentText = text.startsWith('//') ? text.substring(2).trim() : text.trim();
    } else {
      let commentText = text.trim();
      if (commentText.startsWith('/*')) {
        commentText = commentText.substring(2);
      }
      if (commentText.endsWith('*/')) {
        commentText = commentText.substring(0, commentText.length - 2);
      }
      commentText = commentText.trim();
    }
    
    // Create comment with metadata
    const comment = new Comment(commentText);
    comment.isLineComment = isLineComment;
    comment.isInline = this.checkIfInline(node, context); // New method
    
    return comment;
  }

  checkIfInline(node, context) {
    // Check if this comment is inline (on same line as code)
    // You need to implement this based on your context
    // Might need to pass line number or check siblings
    return false; // Default
  }
}