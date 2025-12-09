import React, { useState } from 'react';

/**
 * ShapeItem interface representing a draggable shape in the library.
 */
export interface ShapeItem {
  id: string;
  name: string;
  icon?: string;
  category: 'general' | 'aws';
  type: string;
}

interface ShapeLibraryPanelProps {
  onDragStart: (event: React.DragEvent, shapeType: string, shapeData: ShapeItem) => void;
}

/**
 * General purpose shapes for basic diagram elements.
 */
const GENERAL_SHAPES: ShapeItem[] = [
  { id: 'rect', name: 'Rectangle', category: 'general', type: 'default' },
  { id: 'circle', name: 'Circle', category: 'general', type: 'default' },
  { id: 'ellipse', name: 'Ellipse', category: 'general', type: 'default' },
  { id: 'text', name: 'Text', category: 'general', type: 'default' },
];

/**
 * AWS service shapes for cloud architecture diagrams.
 */
const AWS_SHAPES: ShapeItem[] = [
  { id: 'lambda', name: 'Lambda', category: 'aws', type: 'aws-lambda', icon: 'lambda-icon' },
  { id: 's3', name: 'S3', category: 'aws', type: 'aws-s3', icon: 's3-icon' },
  { id: 'dynamodb', name: 'DynamoDB', category: 'aws', type: 'aws-dynamodb', icon: 'dynamodb-icon' },
  { id: 'apigateway', name: 'API Gateway', category: 'aws', type: 'aws-apigateway', icon: 'apigateway-icon' },
  { id: 'ec2', name: 'EC2', category: 'aws', type: 'aws-ec2', icon: 'ec2-icon' },
  { id: 'rds', name: 'RDS', category: 'aws', type: 'aws-rds', icon: 'rds-icon' },
  { id: 'cloudfront', name: 'CloudFront', category: 'aws', type: 'aws-cloudfront', icon: 'cloudfront-icon' },
];

/**
 * Container shapes for grouping and organizing diagram elements.
 */
const CONTAINER_SHAPES: ShapeItem[] = [
  { id: 'vpc', name: 'VPC', category: 'aws', type: 'vpc-container' },
  { id: 'subnet', name: 'Subnet', category: 'aws', type: 'subnet-container' },
  { id: 'group', name: 'General Group', category: 'general', type: 'general-group' },
];

// Styles using VSCode theme variables
const styles: { [key: string]: React.CSSProperties } = {
  panel: {
    width: '250px',
    background: 'var(--vscode-sideBar-background)',
    borderRight: '1px solid var(--vscode-panel-border)',
    padding: '12px',
    height: '100%',
    overflow: 'auto',
    boxSizing: 'border-box',
  },
  header: {
    marginTop: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--vscode-foreground)',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid var(--vscode-panel-border)',
  },
  categorySection: {
    marginBottom: '12px',
  },
  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--vscode-foreground)',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background 0.1s',
    borderRadius: '3px',
  },
  categoryContent: {
    paddingLeft: '16px',
    paddingTop: '4px',
  },
  shapeItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    marginBottom: '4px',
    cursor: 'grab',
    fontSize: '12px',
    color: 'var(--vscode-foreground)',
    background: 'transparent',
    borderRadius: '3px',
    transition: 'background 0.1s',
  },
  shapeIcon: {
    width: '16px',
    height: '16px',
    marginRight: '8px',
  },
  chevron: {
    marginRight: '6px',
    fontSize: '10px',
    transition: 'transform 0.1s',
  },
};

/**
 * CategorySection component - collapsible section with header and children.
 */
interface CategorySectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  title,
  expanded,
  onToggle,
  children,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={styles.categorySection}>
      <div
        style={{
          ...styles.categoryHeader,
          background: isHovered ? 'var(--vscode-list-hoverBackground)' : 'transparent',
        }}
        onClick={onToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onToggle();
          }
        }}
        aria-expanded={expanded}
      >
        <span
          style={{
            ...styles.chevron,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ▸
        </span>
        <span>{title}</span>
      </div>
      {expanded && <div style={styles.categoryContent}>{children}</div>}
    </div>
  );
};

/**
 * ShapeItemComponent - draggable shape item with hover styling.
 */
interface ShapeItemComponentProps {
  shape: ShapeItem;
  onDragStart: (event: React.DragEvent, shapeType: string, shapeData: ShapeItem) => void;
}

const ShapeItemComponent: React.FC<ShapeItemComponentProps> = ({ shape, onDragStart }) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    // Set drag data for react-flow drop handling
    if (e.dataTransfer) {
      e.dataTransfer.setData(
        'application/reactflow',
        JSON.stringify({ shapeType: shape.id, shapeData: shape })
      );
      e.dataTransfer.effectAllowed = 'move';
    }
    
    // Also call the parent handler
    onDragStart(e, shape.id, shape);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        ...styles.shapeItem,
        background: isHovered ? 'var(--vscode-list-hoverBackground)' : 'transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-label={`Drag ${shape.name} shape`}
    >
      {shape.icon && (
        <span style={styles.shapeIcon} aria-hidden="true">
          {/* Placeholder for icon - can be replaced with actual icon components */}
          📦
        </span>
      )}
      <span>{shape.name}</span>
    </div>
  );
};

/**
 * ShapeLibraryPanel component
 *
 * Displays categorized shapes (General, AWS) with collapsible sections.
 * Shapes are draggable onto the diagram canvas.
 * Uses VSCode CSS variables for consistent theming.
 */
export const ShapeLibraryPanel: React.FC<ShapeLibraryPanelProps> = ({ onDragStart }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['general', 'aws'])
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Get general shapes including general containers
  const generalShapes = [
    ...GENERAL_SHAPES,
    ...CONTAINER_SHAPES.filter((s) => s.category === 'general'),
  ];

  // Get AWS shapes including AWS containers
  const awsShapes = [
    ...AWS_SHAPES,
    ...CONTAINER_SHAPES.filter((s) => s.category === 'aws'),
  ];

  return (
    <div style={styles.panel} role="region" aria-label="Shape Library">
      <h3 style={styles.header}>Shape Library</h3>

      {/* General Category */}
      <CategorySection
        title="General"
        expanded={expandedCategories.has('general')}
        onToggle={() => toggleCategory('general')}
      >
        {generalShapes.map((shape) => (
          <ShapeItemComponent key={shape.id} shape={shape} onDragStart={onDragStart} />
        ))}
      </CategorySection>

      {/* AWS Category */}
      <CategorySection
        title="AWS"
        expanded={expandedCategories.has('aws')}
        onToggle={() => toggleCategory('aws')}
      >
        {awsShapes.map((shape) => (
          <ShapeItemComponent key={shape.id} shape={shape} onDragStart={onDragStart} />
        ))}
      </CategorySection>
    </div>
  );
};

