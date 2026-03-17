from PIL import Image, ImageDraw
import math

def create_icon(size):
    """Create a SimpleTask icon with the given size"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    scale = size / 128.0
    
    # Background - rounded rectangle
    bg_color = (52, 152, 219, 255)  # #3498db
    corner_radius = int(20 * scale)
    
    # Draw rounded rectangle background
    draw.rounded_rectangle(
        [0, 0, size-1, size-1],
        radius=corner_radius,
        fill=bg_color
    )
    
    # Checkmark
    check_color = (255, 255, 255, 255)
    line_width = max(2, int(12 * scale))
    
    # Checkmark points
    p1 = (int(28 * scale), int(64 * scale))
    p2 = (int(52 * scale), int(88 * scale))
    p3 = (int(100 * scale), int(40 * scale))
    
    # Draw checkmark with thick lines
    draw.line([p1, p2], fill=check_color, width=line_width)
    draw.line([p2, p3], fill=check_color, width=line_width)
    
    # Task lines (semi-transparent)
    line_color = (255, 255, 255, 153)  # 60% opacity
    line_width_small = max(1, int(8 * scale))
    
    # Line 1
    draw.line(
        [(int(32 * scale), int(32 * scale)), (int(96 * scale), int(32 * scale))],
        fill=line_color,
        width=line_width_small
    )
    
    # Line 2
    draw.line(
        [(int(32 * scale), int(48 * scale)), (int(80 * scale), int(48 * scale))],
        fill=line_color,
        width=line_width_small
    )
    
    return img

def main():
    # Generate icons in different sizes
    sizes = [16, 32, 48, 128]
    
    for size in sizes:
        icon = create_icon(size)
        if size == 128:
            # Main icon
            icon.save('icon.png', 'PNG')
            print(f"Generated icon.png ({size}x{size})")
        else:
            icon.save(f'icon{size}.png', 'PNG')
            print(f"Generated icon{size}.png ({size}x{size})")
    
    print("\nAll icons generated successfully!")

if __name__ == '__main__':
    main()
