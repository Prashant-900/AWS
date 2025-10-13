"""
Simple Format Response System

This module provides format tags for AI responses to be rendered properly in the frontend.

Supported formats:
- [TEXT]...text[/TEXT] → normal chat bubble
- [CODE]...code[/CODE] → code block with syntax highlight  
- [JSON]...json[/JSON] → formatted JSON viewer
- [MARKDOWN]...markdown[/MARKDOWN] → rendered markdown
- [LATEX]...latex[/LATEX] → math renderer
- [MERMAID]...mermaid[/MERMAID] → flow diagram renderer  
- [CSV]...csv[/CSV] → CSV table renderer
- [IMAGE]...url[/IMAGE] → image display
- [TABLE]...table[/TABLE] → table renderer

The AI is instructed via system messages to use these tags directly.
"""

# System message templates for different format types
SYSTEM_MESSAGES = {
    "default": """You are a helpful AI assistant. When responding, use these format tags to structure your content:

- Wrap regular text in [TEXT]...[/TEXT]
- Wrap code in [CODE]...[/CODE] 
- Wrap JSON data in [JSON]...[/JSON]
- Wrap Mermaid diagrams in [MERMAID]...[/MERMAID]
- Wrap math formulas in [LATEX]...[/LATEX]
- Wrap markdown content in [MARKDOWN]...[/MARKDOWN]
- Wrap CSV data in [CSV]...[/CSV]
- Wrap image URLs in [IMAGE]...[/IMAGE]
- Wrap table data (JSON format) in [TABLE]...[/TABLE]

IMPORTANT FORMATTING RULES:
1. You can use multiple formats in one response by placing them sequentially
2. Each tag MUST be properly closed with its corresponding closing tag
3. Do NOT nest tags inside other tags
4. Always close tags in the same order they were opened
5. If user asks for a specific format, use only that format

Example of a multi-format response:
[TEXT]Here's an explanation of the code:[/TEXT][CODE]print('Hello World')[/CODE][TEXT]This prints a greeting message.[/TEXT]

For explanations, use [TEXT]...[/TEXT] tags. You can combine multiple formats in your response."""
}