import mimetypes
from django.core.exceptions import ValidationError

def determine_file_type(filename, content_type):
    """Determine file type category based on filename and content type"""
    
    # File extension mapping
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.tiff']
    document_extensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']
    spreadsheet_extensions = ['.xls', '.xlsx', '.csv', '.ods']
    presentation_extensions = ['.ppt', '.pptx', '.odp']
    
    # Get file extension
    extension = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
    
    # Check by extension first
    if extension in image_extensions:
        return 'image'
    elif extension in document_extensions:
        return 'document'
    elif extension in spreadsheet_extensions:
        return 'spreadsheet'
    elif extension in presentation_extensions:
        return 'presentation'
    
    # Check by content type if extension doesn't match
    if content_type:
        if content_type.startswith('image/'):
            return 'image'
        elif content_type in ['application/pdf', 'application/msword', 
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                             'text/plain', 'application/rtf']:
            return 'document'
        elif content_type in ['application/vnd.ms-excel',
                             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                             'text/csv']:
            return 'spreadsheet'
        elif content_type in ['application/vnd.ms-powerpoint',
                             'application/vnd.openxmlformats-officedocument.presentationml.presentation']:
            return 'presentation'
    
    return 'other'

def validate_file_upload(file, max_size=50*1024*1024):  # 50MB default
    """Validate uploaded file"""
    
    # Check file size
    if file.size > max_size:
        raise ValidationError(f"File size too large. Maximum size is {max_size // (1024*1024)}MB")
    
    # Check if file has content
    if file.size == 0:
        raise ValidationError("File is empty")
    
    # Get file type
    content_type = file.content_type or mimetypes.guess_type(file.name)[0]
    file_type = determine_file_type(file.name, content_type)
    
    # Type-specific size limits
    size_limits = {
        'image': 10 * 1024 * 1024,        # 10MB
        'document': 25 * 1024 * 1024,     # 25MB
        'spreadsheet': 15 * 1024 * 1024,  # 15MB
        'presentation': 50 * 1024 * 1024, # 50MB
        'other': 25 * 1024 * 1024         # 25MB
    }
    
    if file.size > size_limits.get(file_type, 25 * 1024 * 1024):
        raise ValidationError(
            f"File size too large for {file_type} files. "
            f"Maximum size is {size_limits[file_type] // (1024*1024)}MB"
        )
    
    return {
        'file_type': file_type,
        'content_type': content_type,
        'size': file.size,
        'name': file.name
    }

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"

def get_file_icon_emoji(file_type):
    """Get emoji icon for file type"""
    icons = {
        'image': '🖼️',
        'document': '📄',
        'spreadsheet': '📊', 
        'presentation': '📽️',
        'other': '📎'
    }
    return icons.get(file_type, '📎')