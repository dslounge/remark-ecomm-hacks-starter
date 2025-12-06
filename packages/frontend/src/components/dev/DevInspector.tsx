import { useEffect, useState, useCallback, useRef } from 'react';

interface ElementInfo {
  // Basic element info
  tagName: string;
  id: string | null;
  className: string | null;

  // Dimensions
  width: number;
  height: number;
  x: number;
  y: number;

  // React info
  reactComponent: string | null;
  reactComponentStack: string[];
  reactProps: Record<string, unknown> | null;

  // Additional context
  textContent: string | null;
  dataAttributes: Record<string, string>;
  computedStyles: {
    display: string;
    position: string;
    flexDirection?: string;
    gap?: string;
    padding: string;
    margin: string;
    fontSize: string;
    color: string;
    backgroundColor: string;
  };

  // DOM path for targeting
  cssSelector: string;
  xpath: string;
}

function getReactFiber(element: Element): any {
  // Find React fiber from element - React 18+ uses __reactFiber$ prefix
  const keys = Object.keys(element);
  const fiberKey = keys.find(
    (key) => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
  );
  if (fiberKey) {
    return (element as any)[fiberKey];
  }
  return null;
}

function getReactComponentName(fiber: any): string | null {
  if (!fiber) return null;

  // Navigate up to find the component
  let current = fiber;
  while (current) {
    if (current.type) {
      // Function component or class component
      if (typeof current.type === 'function') {
        return current.type.displayName || current.type.name || 'Anonymous';
      }
      // Memo, forwardRef, etc.
      if (current.type.displayName) {
        return current.type.displayName;
      }
      if (current.type.render?.displayName || current.type.render?.name) {
        return current.type.render.displayName || current.type.render.name;
      }
    }
    current = current.return;
  }
  return null;
}

function getReactComponentStack(fiber: any): string[] {
  const stack: string[] = [];
  let current = fiber;

  while (current && stack.length < 10) {
    if (current.type) {
      let name: string | null = null;
      if (typeof current.type === 'function') {
        name = current.type.displayName || current.type.name;
      } else if (current.type.displayName) {
        name = current.type.displayName;
      } else if (current.type.render?.displayName || current.type.render?.name) {
        name = current.type.render.displayName || current.type.render.name;
      }
      if (name && !name.startsWith('_') && name !== 'Anonymous') {
        stack.push(name);
      }
    }
    current = current.return;
  }

  return stack;
}

function getReactProps(fiber: any): Record<string, unknown> | null {
  if (!fiber) return null;

  let current = fiber;
  while (current) {
    if (current.memoizedProps && typeof current.type === 'function') {
      const props = { ...current.memoizedProps };
      // Remove children as it's usually too verbose
      delete props.children;
      // Remove functions, just note they exist
      for (const key of Object.keys(props)) {
        if (typeof props[key] === 'function') {
          props[key] = '[Function]';
        } else if (typeof props[key] === 'object' && props[key] !== null) {
          // Stringify objects, but truncate if too long
          try {
            const str = JSON.stringify(props[key]);
            if (str.length > 100) {
              props[key] = str.slice(0, 100) + '...';
            }
          } catch {
            props[key] = '[Object]';
          }
        }
      }
      if (Object.keys(props).length > 0) {
        return props;
      }
    }
    current = current.return;
  }
  return null;
}

function getCssSelector(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let selector = current.tagName.toLowerCase();

    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break;
    }

    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).slice(0, 2);
      if (classes.length > 0 && classes[0]) {
        selector += '.' + classes.join('.');
      }
    }

    // Add nth-child if needed for specificity
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }
    }

    parts.unshift(selector);
    current = current.parentElement;
  }

  return parts.join(' > ');
}

function getXPath(element: Element): string {
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current !== document.body) {
    let part = current.tagName.toLowerCase();

    if (current.id) {
      part = `//*[@id="${current.id}"]`;
      parts.unshift(part);
      break;
    }

    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child) => child.tagName === current!.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        part += `[${index}]`;
      }
    }

    parts.unshift(part);
    current = current.parentElement;
  }

  return '//' + parts.join('/');
}

function getElementInfo(element: Element): ElementInfo {
  const rect = element.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(element);
  const fiber = getReactFiber(element);

  // Get data attributes
  const dataAttributes: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) {
    if (attr.name.startsWith('data-')) {
      dataAttributes[attr.name] = attr.value;
    }
  }

  // Get text content (truncated)
  let textContent = element.textContent?.trim() || null;
  if (textContent && textContent.length > 50) {
    textContent = textContent.slice(0, 50) + '...';
  }

  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || null,
    className: element.className && typeof element.className === 'string'
      ? element.className
      : null,
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    reactComponent: getReactComponentName(fiber),
    reactComponentStack: getReactComponentStack(fiber),
    reactProps: getReactProps(fiber),
    textContent,
    dataAttributes,
    computedStyles: {
      display: computedStyle.display,
      position: computedStyle.position,
      flexDirection: computedStyle.flexDirection !== 'row' ? computedStyle.flexDirection : undefined,
      gap: computedStyle.gap !== 'normal' ? computedStyle.gap : undefined,
      padding: computedStyle.padding,
      margin: computedStyle.margin,
      fontSize: computedStyle.fontSize,
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
    },
    cssSelector: getCssSelector(element),
    xpath: getXPath(element),
  };
}

function formatForClipboard(info: ElementInfo): string {
  const lines: string[] = [];

  // Primary identification for AI agent
  lines.push('[ELEMENT REFERENCE]');
  lines.push('');

  // Component info - most important for finding the code
  if (info.reactComponent) {
    lines.push(`Component: ${info.reactComponent}`);
    lines.push(`File to edit: ${info.reactComponent}.tsx (or .jsx)`);
    lines.push(`Element: ${info.tagName}${info.id ? '#' + info.id : ''}`);
  } else {
    lines.push(`Element: ${info.tagName}${info.id ? '#' + info.id : ''}`);
  }

  // Component hierarchy - helps understand context
  if (info.reactComponentStack.length > 1) {
    lines.push(`Parent chain: ${info.reactComponentStack.slice(1).join(' > ')}`);
  }

  lines.push('');

  // Classes - searchable in codebase
  if (info.className) {
    lines.push(`Classes: ${info.className}`);
    // Extract first few unique classes as search hints
    const searchableClasses = info.className.split(' ').slice(0, 3).join(' ');
    lines.push(`Search for: className containing "${searchableClasses}"`);
    lines.push('');
  }

  // Size info - useful for layout context
  lines.push(`Size: ${info.width}x${info.height}px`);
  lines.push('');

  // Props - helps identify which instance/usage
  if (info.reactProps && Object.keys(info.reactProps).length > 0) {
    lines.push('Props:');
    for (const [key, value] of Object.entries(info.reactProps)) {
      const displayValue = typeof value === 'string' && value.length > 60
        ? value.slice(0, 60) + '...'
        : value;
      lines.push(`  ${key}: ${displayValue}`);
    }
    lines.push('');
  }

  // Data attributes - often used for testing/identification
  if (Object.keys(info.dataAttributes).length > 0) {
    lines.push('Data attributes:');
    for (const [key, value] of Object.entries(info.dataAttributes)) {
      lines.push(`  ${key}="${value}"`);
    }
    lines.push('');
  }

  // Text content hint
  if (info.textContent) {
    lines.push(`Text preview: "${info.textContent}"`);
  }

  return lines.join('\n');
}

export function DevInspector() {
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<Element | null>(null);
  const [elementInfo, setElementInfo] = useState<ElementInfo | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const highlightRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.altKey && !isAltPressed) {
      setIsAltPressed(true);
      document.body.style.cursor = 'crosshair';
    }
  }, [isAltPressed]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!e.altKey) {
      setIsAltPressed(false);
      setHoveredElement(null);
      setElementInfo(null);
      document.body.style.cursor = '';
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isAltPressed) return;

    // Get element under cursor, ignoring our tooltip/highlight
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const target = elements.find(
      (el) => !el.closest('[data-dev-inspector]')
    );

    if (target && target !== hoveredElement) {
      setHoveredElement(target);
      setElementInfo(getElementInfo(target));
    }

    // Position tooltip
    const tooltipX = Math.min(e.clientX + 15, window.innerWidth - 420);
    const tooltipY = Math.min(e.clientY + 15, window.innerHeight - 300);
    setTooltipPosition({ x: tooltipX, y: tooltipY });
  }, [isAltPressed, hoveredElement]);

  const handleClick = useCallback((e: MouseEvent) => {
    if (!isAltPressed || !elementInfo) return;

    e.preventDefault();
    e.stopPropagation();

    const text = formatForClipboard(elementInfo);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [isAltPressed, elementInfo]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      document.body.style.cursor = '';
    };
  }, [handleKeyDown, handleKeyUp, handleMouseMove, handleClick]);

  // Update highlight position
  useEffect(() => {
    if (highlightRef.current && hoveredElement) {
      const rect = hoveredElement.getBoundingClientRect();
      highlightRef.current.style.top = `${rect.top}px`;
      highlightRef.current.style.left = `${rect.left}px`;
      highlightRef.current.style.width = `${rect.width}px`;
      highlightRef.current.style.height = `${rect.height}px`;
    }
  }, [hoveredElement]);

  if (!isAltPressed || !elementInfo) return null;

  return (
    <>
      {/* Element highlight overlay */}
      <div
        ref={highlightRef}
        data-dev-inspector
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          border: '2px solid #3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          zIndex: 99998,
          transition: 'all 0.05s ease-out',
        }}
      />

      {/* Tooltip */}
      <div
        data-dev-inspector
        style={{
          position: 'fixed',
          top: tooltipPosition.y,
          left: tooltipPosition.x,
          zIndex: 99999,
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          maxWidth: '400px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
          border: '1px solid #333',
          lineHeight: 1.5,
        }}
      >
        {/* React Component */}
        {elementInfo.reactComponent && (
          <div style={{ marginBottom: '8px' }}>
            <span style={{ color: '#569cd6' }}>&lt;</span>
            <span style={{ color: '#4ec9b0', fontWeight: 'bold' }}>
              {elementInfo.reactComponent}
            </span>
            <span style={{ color: '#569cd6' }}>&gt;</span>
            {elementInfo.reactComponentStack.length > 1 && (
              <span style={{ color: '#6a9955', marginLeft: '8px', fontSize: '10px' }}>
                in {elementInfo.reactComponentStack.slice(1, 3).join(' → ')}
              </span>
            )}
          </div>
        )}

        {/* Tag and ID */}
        <div style={{ color: '#9cdcfe', marginBottom: '4px' }}>
          <span style={{ color: '#808080' }}>&lt;</span>
          {elementInfo.tagName}
          {elementInfo.id && (
            <span style={{ color: '#ce9178' }}> #{elementInfo.id}</span>
          )}
          <span style={{ color: '#808080' }}>&gt;</span>
        </div>

        {/* Classes */}
        {elementInfo.className && (
          <div style={{
            color: '#ce9178',
            marginBottom: '4px',
            wordBreak: 'break-word',
            maxHeight: '40px',
            overflow: 'hidden',
          }}>
            .{elementInfo.className.split(' ').slice(0, 5).join(' .')}
            {elementInfo.className.split(' ').length > 5 && '...'}
          </div>
        )}

        {/* Dimensions */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #333',
        }}>
          <div>
            <span style={{ color: '#808080' }}>size: </span>
            <span style={{ color: '#b5cea8' }}>
              {elementInfo.width} × {elementInfo.height}
            </span>
          </div>
          <div>
            <span style={{ color: '#808080' }}>pos: </span>
            <span style={{ color: '#b5cea8' }}>
              ({elementInfo.x}, {elementInfo.y})
            </span>
          </div>
        </div>

        {/* Layout info */}
        <div style={{ marginTop: '4px' }}>
          <span style={{ color: '#808080' }}>display: </span>
          <span style={{ color: '#dcdcaa' }}>{elementInfo.computedStyles.display}</span>
          {elementInfo.computedStyles.flexDirection && (
            <>
              <span style={{ color: '#808080' }}> • flex: </span>
              <span style={{ color: '#dcdcaa' }}>{elementInfo.computedStyles.flexDirection}</span>
            </>
          )}
        </div>

        {/* React Props preview */}
        {elementInfo.reactProps && Object.keys(elementInfo.reactProps).length > 0 && (
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #333',
            maxHeight: '60px',
            overflow: 'hidden',
          }}>
            <span style={{ color: '#808080' }}>props: </span>
            {Object.entries(elementInfo.reactProps).slice(0, 3).map(([key, value]) => (
              <div key={key} style={{ marginLeft: '8px', color: '#9cdcfe' }}>
                {key}: <span style={{ color: '#ce9178' }}>{String(value)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Copy hint */}
        <div style={{
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid #333',
          color: copied ? '#4ec9b0' : '#808080',
          fontSize: '10px',
        }}>
          {copied ? '✓ Copied to clipboard!' : 'Alt+Click to copy for AI agent'}
        </div>
      </div>
    </>
  );
}
