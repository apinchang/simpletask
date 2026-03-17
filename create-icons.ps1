# Create SimpleTask icons using PowerShell

function Create-Icon($size) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    $scale = $size / 128.0
    
    # Background - rounded rectangle
    $bgColor = [System.Drawing.Color]::FromArgb(52, 152, 219)
    $cornerRadius = 20 * $scale
    
    $brush = New-Object System.Drawing.SolidBrush($bgColor)
    $graphics.FillRoundedRectangle($brush, 0, 0, $size, $size, $cornerRadius)
    $brush.Dispose()
    
    # Checkmark
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, [Math]::Max(2, 12 * $scale))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    
    $points = @(
        [System.Drawing.Point]::new(28 * $scale, 64 * $scale),
        [System.Drawing.Point]::new(52 * $scale, 88 * $scale),
        [System.Drawing.Point]::new(100 * $scale, 40 * $scale)
    )
    $graphics.DrawLines($pen, $points)
    $pen.Dispose()
    
    # Task lines (semi-transparent)
    $lineColor = [System.Drawing.Color]::FromArgb(153, 255, 255, 255)
    $linePen = New-Object System.Drawing.Pen($lineColor, [Math]::Max(1, 8 * $scale))
    $linePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $linePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    
    # Line 1
    $graphics.DrawLine($linePen, 32 * $scale, 32 * $scale, 96 * $scale, 32 * $scale)
    
    # Line 2
    $graphics.DrawLine($linePen, 32 * $scale, 48 * $scale, 80 * $scale, 48 * $scale)
    
    $linePen.Dispose()
    $graphics.Dispose()
    
    return $bitmap
}

# Add extension method for rounded rectangles
Add-Type -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Drawing2D;

public static class GraphicsExtensions {
    public static void FillRoundedRectangle(this Graphics graphics, Brush brush, float x, float y, float width, float height, float radius) {
        using (GraphicsPath path = new GraphicsPath()) {
            path.AddArc(x, y, radius * 2, radius * 2, 180, 90);
            path.AddArc(x + width - radius * 2, y, radius * 2, radius * 2, 270, 90);
            path.AddArc(x + width - radius * 2, y + height - radius * 2, radius * 2, radius * 2, 0, 90);
            path.AddArc(x, y + height - radius * 2, radius * 2, radius * 2, 90, 90);
            path.CloseFigure();
            graphics.FillPath(brush, path);
        }
    }
}
"@ -ReferencedAssemblies System.Drawing

# Generate icons
$sizes = @(16, 32, 48, 128)

foreach ($size in $sizes) {
    $icon = Create-Icon $size
    $filename = if ($size -eq 128) { "icon128.png" } else { "icon$size.png" }
    $icon.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()
    Write-Host "Generated $filename (${size}x${size})"
}

Write-Host "`nAll icons generated successfully!"
