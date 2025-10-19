/**
 * Response Format Parser
 * 
 * Parses AI responses that contain formatted content blocks
 * Format: [TYPE]content[/TYPE] or [TYPE]...content
 * 
 * Supported formats:
 * - [TEXT]...text → normal chat bubble
 * - [CODE]...code → code block with syntax highlight
 * - [JSON]...json → formatted JSON viewer
 * - [MARKDOWN]...markdown → rendered markdown
 * - [LATEX]...latex → math renderer
 * - [MERMAID]...mermaid → flow diagram renderer
 * - [CSV]...csv → CSV table renderer
 * - [IMAGE]...url → image display
 * - [TABLE]...table → table renderer
 */

export class ResponseFormatParser {
  constructor() {
    this.formatRegexes = {
      // Matches [TYPE]content or [TYPE]content[/TYPE]
      block: /\[(\w+)\](.*?)(?:\[\/\1\]|$)/gs,
      // For streaming - detect start tags
      startTag: /\[(\w+)\]/g,
      // For streaming - detect end tags
      endTag: /\[\/(\w+)\]/g
    };
    
    this.supportedFormats = [
      'TEXT', 'CODE', 'JSON', 'MARKDOWN', 'LATEX', 
      'MERMAID', 'CSV', 'IMAGE', 'TABLE', 'TOOL_USAGE', 'TOOL_SUMMARY'
    ];
  }

  /**
   * Parse complete response into formatted blocks
   * @param {string} content - Full response content
   * @returns {Array} Array of format blocks
   */
  parseResponse(content) {
    if (!content || typeof content !== 'string') {
      return [{
        type: 'TEXT',
        content: content || '',
        id: this.generateId()
      }];
    }

    const blocks = [];
    let lastIndex = 0;
    let match;

    // Reset regex state
    this.formatRegexes.block.lastIndex = 0;

    while ((match = this.formatRegexes.block.exec(content)) !== null) {
      const [fullMatch, type, blockContent] = match;
      const matchStart = match.index;
      const matchEnd = match.index + fullMatch.length;

      // Add any text before this block as TEXT format
      if (matchStart > lastIndex) {
        const textContent = content.slice(lastIndex, matchStart).trim();
        if (textContent) {
          blocks.push({
            type: 'TEXT',
            content: textContent,
            id: this.generateId()
          });
        }
      }

      // Add the formatted block
      if (this.supportedFormats.includes(type.toUpperCase())) {
        blocks.push({
          type: type.toUpperCase(),
          content: blockContent.trim(),
          id: this.generateId()
        });
      } else {
        // Unknown format, treat as text
        blocks.push({
          type: 'TEXT',
          content: fullMatch,
          id: this.generateId()
        });
      }

      lastIndex = matchEnd;
    }

    // Add any remaining text as TEXT format
    if (lastIndex < content.length) {
      const remainingContent = content.slice(lastIndex).trim();
      if (remainingContent) {
        blocks.push({
          type: 'TEXT',
          content: remainingContent,
          id: this.generateId()
        });
      }
    }

    // If no blocks were found, treat entire content as text
    if (blocks.length === 0) {
      blocks.push({
        type: 'TEXT',
        content: content,
        id: this.generateId()
      });
    }

    return blocks;
  }

  /**
   * Parse streaming content (for live updates)
   * This handles partial content during streaming
   * @param {string} streamContent - Current streaming content
   * @returns {Object} Streaming parse result
   */
  parseStreaming(streamContent) {
    if (!streamContent || typeof streamContent !== 'string') {
      return {
        blocks: [{
          type: 'TEXT',
          content: streamContent || '',
          id: this.generateId(),
          isStreaming: true
        }],
        isComplete: false,
        currentBlock: null
      };
    }

    const blocks = [];
    let currentBlock = null;
    let isComplete = true;

    // Check if we're in the middle of a format block
    const openTags = this.findOpenTags(streamContent);
    
    if (openTags.length > 0) {
      // We have unclosed format tags - handle carefully
      const lastOpenTag = openTags[openTags.length - 1];
      
      // Find all occurrences of this tag to get the last one
      let tagStart = -1;
      let searchIndex = 0;
      const tagPattern = `[${lastOpenTag.type}]`;
      
      while (true) {
        const nextIndex = streamContent.indexOf(tagPattern, searchIndex);
        if (nextIndex === -1) break;
        tagStart = nextIndex;
        searchIndex = nextIndex + 1;
      }
      
      if (tagStart >= 0) {
        // Content before the last open tag
        if (tagStart > 0) {
          const beforeContent = streamContent.slice(0, tagStart);
          const beforeBlocks = this.parseResponse(beforeContent);
          // Mark all before blocks as complete
          blocks.push(...beforeBlocks.map(block => ({
            ...block,
            isStreaming: false
          })));
        }
        
        // Current streaming block (after the opening tag)
        const blockStartPos = tagStart + tagPattern.length;
        const blockContent = streamContent.slice(blockStartPos);
        
        // Check if this block might be complete (has closing tag)
        const closingTag = `[/${lastOpenTag.type}]`;
        const hasClosingTag = blockContent.includes(closingTag);
        
        if (hasClosingTag) {
          // Block is actually complete, parse it normally
          const completeBlocks = this.parseResponse(streamContent.slice(tagStart));
          blocks.push(...completeBlocks.map(block => ({
            ...block,
            isStreaming: false
          })));
          isComplete = true;
        } else {
          // Block is still streaming
          currentBlock = {
            type: lastOpenTag.type.toUpperCase(),
            content: blockContent,
            id: this.generateId(),
            isStreaming: true
          };
          
          blocks.push(currentBlock);
          isComplete = false;
        }
      }
    } else {
      // No unclosed tags - check if content ends with a potential tag break
      const potentialTagBreak = this.detectPotentialTagBreak(streamContent);
      
      if (potentialTagBreak.hasBreak) {
        // Split at the potential break point
        const safeContent = streamContent.slice(0, potentialTagBreak.breakPoint);
        const remainingContent = streamContent.slice(potentialTagBreak.breakPoint);
        
        if (safeContent) {
          const safeBlocks = this.parseResponse(safeContent);
          blocks.push(...safeBlocks.map(block => ({
            ...block,
            isStreaming: false
          })));
        }
        
        if (remainingContent) {
          // Treat remaining as streaming text for now
          currentBlock = {
            type: 'TEXT',
            content: remainingContent,
            id: this.generateId(),
            isStreaming: true
          };
          blocks.push(currentBlock);
        }
        
        isComplete = false;
      } else {
        // Parse normally but check for completeness
        const parsedBlocks = this.parseResponse(streamContent);
        const lastCompleteBlock = this.endsWithCompleteBlock(streamContent);
        
        blocks.push(...parsedBlocks.map((block, index) => ({
          ...block,
          isStreaming: !lastCompleteBlock && index === parsedBlocks.length - 1
        })));
        
        isComplete = lastCompleteBlock;
        currentBlock = blocks[blocks.length - 1] || null;
      }
    }

    return {
      blocks,
      isComplete,
      currentBlock
    };
  }

  /**
   * Find open format tags that haven't been closed
   * @param {string} content - Content to analyze
   * @returns {Array} Array of open tags
   */
  findOpenTags(content) {
    const tagStack = [];
    
    // Find all start and end tags
    const allTags = [];
    
    let match;
    this.formatRegexes.startTag.lastIndex = 0;
    while ((match = this.formatRegexes.startTag.exec(content)) !== null) {
      allTags.push({
        type: match[1],
        position: match.index,
        isStart: true
      });
    }
    
    this.formatRegexes.endTag.lastIndex = 0;
    while ((match = this.formatRegexes.endTag.exec(content)) !== null) {
      allTags.push({
        type: match[1],
        position: match.index,
        isStart: false
      });
    }
    
    // Sort by position
    allTags.sort((a, b) => a.position - b.position);
    
    // Process tags to find unclosed ones
    for (const tag of allTags) {
      if (tag.isStart) {
        tagStack.push(tag);
      } else {
        // Find matching start tag
        const startIndex = tagStack.findIndex(t => t.type === tag.type);
        if (startIndex !== -1) {
          tagStack.splice(startIndex, 1);
        }
      }
    }
    
    return tagStack;
  }

  /**
   * Detect if content ends with a potentially broken tag
   * @param {string} content - Content to check
   * @returns {Object} Break detection result
   */
  detectPotentialTagBreak(content) {
    if (!content) return { hasBreak: false, breakPoint: 0 };
    
    // Look for partial opening tags at the end (e.g., "[CO", "[TEX")
    const partialTagPattern = /\[[A-Z]*$/;
    const match = content.match(partialTagPattern);
    
    if (match) {
      return {
        hasBreak: true,
        breakPoint: match.index
      };
    }
    
    // Look for other potential tag-like patterns that might be incomplete
    const suspiciousPattern = /\[[A-Z]{1,8}$/;
    const suspiciousMatch = content.match(suspiciousPattern);
    
    if (suspiciousMatch) {
      // Check if it might be a valid tag start
      const partialTag = suspiciousMatch[0].slice(1); // Remove opening bracket
      const matchingTags = this.supportedFormats.filter(tag => tag.startsWith(partialTag));
      
      if (matchingTags.length > 0) {
        return {
          hasBreak: true,
          breakPoint: suspiciousMatch.index
        };
      }
    }
    
    return { hasBreak: false, breakPoint: 0 };
  }

  /**
   * Check if content ends with a complete format block
   * @param {string} content - Content to check
   * @returns {boolean} True if ends with complete block
   */
  endsWithCompleteBlock(content) {
    const blocks = this.parseResponse(content);
    if (blocks.length === 0) return false;
    
    const lastBlock = blocks[blocks.length - 1];
    const endPattern = new RegExp(`\\[\\/${lastBlock.type}\\]$`, 'i');
    
    return endPattern.test(content) || lastBlock.type === 'TEXT';
  }

  /**
   * Generate unique ID for blocks
   * @returns {string} Unique identifier
   */
  generateId() {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate if format type is supported
   * @param {string} format - Format to validate
   * @returns {boolean} True if supported
   */
  isValidFormat(format) {
    return this.supportedFormats.includes(format.toUpperCase());
  }

  /**
   * Clean content by removing format tags (fallback for unsupported renderers)
   * @param {string} content - Content with format tags
   * @returns {string} Clean content without tags
   */
  cleanContent(content) {
    return content.replace(/\[\/?\w+\]/g, '');
  }
}

// Export singleton instance
export const formatParser = new ResponseFormatParser();

// Export format types for reference
export const FORMAT_TYPES = {
  TEXT: 'TEXT',
  CODE: 'CODE', 
  JSON: 'JSON',
  MARKDOWN: 'MARKDOWN',
  LATEX: 'LATEX',
  MERMAID: 'MERMAID',
  CSV: 'CSV',
  IMAGE: 'IMAGE',
  TABLE: 'TABLE',
  TOOL_USAGE: 'TOOL_USAGE',
  TOOL_SUMMARY: 'TOOL_SUMMARY'
};