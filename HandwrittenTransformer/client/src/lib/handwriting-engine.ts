interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface CharacterStroke {
  character: string;
  strokes: Point[][];
}

interface HandwritingStyle {
  baselineVariation: number;
  letterSpacing: number;
  wordSpacing: number;
  slant: number;
  strokeWidth: number;
}

export interface HandwritingPathSegment {
  path: string;
  character?: string;
  x?: number;
  y?: number;
  strokeIndex?: number;
  fallback?: boolean;
}

export interface HandwritingGenerationResult {
  paths: HandwritingPathSegment[];
  dimensions: { width: number; height: number };
}

export class HandwritingEngine {
  private characterTemplates: Map<string, CharacterStroke> = new Map();
  private style: HandwritingStyle = {
    baselineVariation: 2,
    letterSpacing: 4,
    wordSpacing: 20,
    slant: 0,
    strokeWidth: 2,
  };

  setCharacterTemplates(templates: Record<string, CharacterStroke>) {
    this.characterTemplates.clear();
    Object.entries(templates).forEach(([char, template]) => {
      this.characterTemplates.set(char, template);
    });
  }

  analyzeHandwritingStyle(templates: Record<string, CharacterStroke>) {
    // Analyze stroke patterns to determine writing style
    const strokeWidths: number[] = [];
    const slopes: number[] = [];
    
    Object.values(templates).forEach(template => {
      template.strokes.forEach(stroke => {
        if (stroke.length > 1) {
          // Calculate stroke characteristics
          const firstPoint = stroke[0];
          const lastPoint = stroke[stroke.length - 1];
          const slope = (lastPoint.y - firstPoint.y) / (lastPoint.x - firstPoint.x);
          slopes.push(slope);
        }
      });
    });

    // Update style based on analysis
    if (slopes.length > 0) {
      this.style.slant = slopes.reduce((sum, slope) => sum + slope, 0) / slopes.length;
    }
  }

  generateHandwriting(text: string, options: { fontSize: string; includeLines: boolean } = { fontSize: "medium", includeLines: false }): HandwritingGenerationResult {
    const lines = text.split("\n");
    const paths: HandwritingPathSegment[] = [];
    let currentY = 30;
    const lineHeight = this.getFontSize(options.fontSize) * 1.5;
    let maxWidth = 0;

    lines.forEach((line, lineIndex) => {
      let currentX = 20;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const template = this.characterTemplates.get(char);
        
        if (char === ' ') {
          currentX += this.style.wordSpacing;
          continue;
        }

        if (template) {
          const charPaths = this.renderCharacter(template, currentX, currentY, options.fontSize);
          paths.push(...charPaths);
          currentX += this.getCharacterWidth(template) + this.style.letterSpacing;
        } else {
          // Fallback for characters without templates
          const fallbackPath = this.generateFallbackCharacter(char, currentX, currentY, options.fontSize);
          paths.push(fallbackPath);
          currentX += 20 + this.style.letterSpacing;
        }
      }
      
      maxWidth = Math.max(maxWidth, currentX);
      currentY += lineHeight;
    });

    return {
      paths,
      dimensions: {
        width: maxWidth + 20,
        height: currentY + 20,
      },
    };
  }

  private getFontSize(size: string): number {
    switch (size) {
      case 'small': return 16;
      case 'large': return 32;
      default: return 24;
    }
  }

  private getCharacterWidth(template: CharacterStroke): number {
    // Calculate character width based on stroke bounds
    let minX = Infinity, maxX = -Infinity;
    
    template.strokes.forEach(stroke => {
      stroke.forEach(point => {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
      });
    });

    return Math.max(20, maxX - minX);
  }

  private renderCharacter(template: CharacterStroke, x: number, y: number, fontSize: string): HandwritingPathSegment[] {
    const scale = this.getFontSize(fontSize) / 24; // Normalize to 24px base
    const paths: HandwritingPathSegment[] = [];

    template.strokes.forEach((stroke, strokeIndex) => {
      if (stroke.length < 2) return;

      let pathData = `M${x + stroke[0].x * scale},${y + stroke[0].y * scale}`;
      
      for (let i = 1; i < stroke.length; i++) {
        const point = stroke[i];
        pathData += ` L${x + point.x * scale},${y + point.y * scale}`;
      }

      paths.push({
        character: template.character,
        path: pathData,
        x: x,
        y: y,
        strokeIndex,
      });
    });

    return paths;
  }

  private generateFallbackCharacter(char: string, x: number, y: number, fontSize: string): HandwritingPathSegment {
    // Generate a simple representation for characters without templates
    const scale = this.getFontSize(fontSize) / 24;
    const width = 16 * scale;
    const height = 20 * scale;

    // Simple rectangle as fallback
    const pathData = `M${x},${y} L${x + width},${y} L${x + width},${y + height} L${x},${y + height} Z`;

    return {
      character: char,
      path: pathData,
      x: x,
      y: y,
      fallback: true,
    };
  }

  exportToSVG(handwritingData: HandwritingGenerationResult, options: { includeLines: boolean }): string {
    const { paths, dimensions } = handwritingData;
    
    let svg = `<svg width="${dimensions.width}" height="${dimensions.height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Add ruled lines if requested
    if (options.includeLines) {
      for (let y = 30; y < dimensions.height; y += 40) {
        svg += `<line x1="0" y1="${y}" x2="${dimensions.width}" y2="${y}" stroke="#e2e8f0" stroke-width="1"/>`;
      }
    }
    
    // Add character paths
    paths.forEach((pathData: HandwritingPathSegment) => {
      svg += `<path d="${pathData.path}" stroke="#334155" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    
    svg += '</svg>';
    return svg;
  }
}

export const handwritingEngine = new HandwritingEngine();
