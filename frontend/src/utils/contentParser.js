/**
 * Utility functions for parsing agent-formatted content
 */

/**
 * Parse agent response content that contains format tags
 * @param {string} content - Raw content from agent with format tags
 * @returns {Array} - Array of parsed content blocks
 */
export const parseAgentContent = (content) => {
  const blocks = [];
  const formatTags = ['TEXT', 'CODE', 'JSON', 'MARKDOWN', 'LATEX', 'MERMAID', 'CSV', 'IMAGE', 'TABLE'];
  
  let remainingContent = content;
  let position = 0;
  
  while (position < remainingContent.length) {
    let nearestTag = null;
    let nearestPosition = remainingContent.length;
    
    // Find the nearest opening tag
    for (const tag of formatTags) {
      const openTag = `[${tag}]`;
      const tagPosition = remainingContent.indexOf(openTag, position);
      
      if (tagPosition !== -1 && tagPosition < nearestPosition) {
        nearestPosition = tagPosition;
        nearestTag = tag;
      }
    }
    
    if (nearestTag) {
      // Add any plain text before the tag
      if (nearestPosition > position) {
        const plainText = remainingContent.substring(position, nearestPosition).trim();
        if (plainText) {
          blocks.push({
            type: 'text',
            content: plainText
          });
        }
      }
      
      // Find the closing tag
      const openTag = `[${nearestTag}]`;
      const closeTag = `[/${nearestTag}]`;
      const contentStart = nearestPosition + openTag.length;
      const contentEnd = remainingContent.indexOf(closeTag, contentStart);
      
      if (contentEnd !== -1) {
        const tagContent = remainingContent.substring(contentStart, contentEnd);
        blocks.push({
          type: nearestTag.toLowerCase(),
          content: tagContent
        });
        
        position = contentEnd + closeTag.length;
      } else {
        // No closing tag found, treat as plain text
        const plainText = remainingContent.substring(position).trim();
        if (plainText) {
          blocks.push({
            type: 'text',
            content: plainText
          });
        }
        break;
      }
    } else {
      // No more tags, add remaining content as plain text
      const plainText = remainingContent.substring(position).trim();
      if (plainText) {
        blocks.push({
          type: 'text',
          content: plainText
        });
      }
      break;
    }
  }
  
  return blocks;
};

/**
 * Convert parsed content blocks back to display-friendly format
 * @param {Array} blocks - Array of parsed content blocks
 * @returns {string} - Formatted content for display
 */
export const formatContentForDisplay = (blocks) => {
  return blocks.map(block => {
    switch (block.type) {
      case 'text':
        return block.content;
      case 'code':
        return `\`\`\`\n${block.content}\n\`\`\``;
      case 'json':
        try {
          const formatted = JSON.stringify(JSON.parse(block.content), null, 2);
          return `\`\`\`json\n${formatted}\n\`\`\``;
        } catch {
          return `\`\`\`json\n${block.content}\n\`\`\``;
        }
      case 'markdown':
        return block.content;
      case 'latex':
        return `$$${block.content}$$`;
      case 'mermaid':
        return `\`\`\`mermaid\n${block.content}\n\`\`\``;
      case 'csv':
        return `\`\`\`csv\n${block.content}\n\`\`\``;
      case 'image':
        return `![Image](${block.content})`;
      case 'table':
        try {
          const data = JSON.parse(block.content);
          // Simple table formatting
          return `\`\`\`\n${JSON.stringify(data, null, 2)}\n\`\`\``;
        } catch {
          return `\`\`\`\n${block.content}\n\`\`\``;
        }
      default:
        return block.content;
    }
  }).join('\n\n');
};

/**
 * Check if content has any format tags
 * @param {string} content - Content to check
 * @returns {boolean} - True if content contains format tags
 */
export const hasFormatTags = (content) => {
  const formatTags = ['TEXT', 'CODE', 'JSON', 'MARKDOWN', 'LATEX', 'MERMAID', 'CSV', 'IMAGE', 'TABLE'];
  return formatTags.some(tag => content.includes(`[${tag}]`));
};

/**
 * Extract just the text content from formatted response (removes all tags)
 * @param {string} content - Content with format tags
 * @returns {string} - Plain text content
 */
export const extractTextOnly = (content) => {
  const blocks = parseAgentContent(content);
  return blocks.map(block => block.content).join(' ').trim();
};