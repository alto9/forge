import React, { useState, useMemo } from 'react';

import {
  getAllServices,
  getCategories,
  getCategoryDisplayName,
  getServicesByCategory,
  AWSCategory,
  AWSServiceConfig
} from './aws-service-registry';

import {
  getAllGeneralShapes,
  GeneralShapeConfig
} from './general-shapes-registry';

export interface ShapeLibraryProps {
  // No props needed - drag and drop handled internally
}

export const ShapeLibrary: React.FC<ShapeLibraryProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<AWSCategory | 'general'>>(
    new Set(['groups', 'compute', 'database', 'storage', 'networking'])
  );
  const categories = getCategories();
  const filteredServices = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (!query) {
      return null;
    }

    return getAllServices().filter(service =>
      service.displayName.toLowerCase().includes(query) ||
      service.classifier.toLowerCase().includes(query)
    )

  }, [searchQuery]);

  const toggleCategory = (category: AWSCategory | 'general') => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if(next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };
  
  const handleDragStart = (e: React.DragEvent, config: AWSServiceConfig | GeneralShapeConfig, library: 'general' | 'aws' = 'aws') => {
    console.log('Drag started:', config.displayName, 'library:', library);
    e.dataTransfer.effectAllowed = 'move';
    
    // Check if this is a container - for general shapes, check type === 'container', for AWS, check isContainer property
    const isContainer = library === 'general' 
      ? ('type' in config && config.type === 'container')
      : ('isContainer' in config && config.isContainer === true);
    
    const dragData = {
      isNewNode: false,
      type: library === 'general' ? 'general-shape' : 'aws-service',
      library,
      classifier: config.classifier,
      displayName: config.displayName,
      color: config.color,
      isContainer,
    };
    console.log('Setting drag data:', dragData);
    e.dataTransfer.setData('application/reactflow', JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', config.displayName); // Fallback for debugging
  };

  return (
    <div style={{
      width: '280px',
      height: '100%',
      background: 'var(--vscode-sideBar-background)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      borderRight: '1px solid var(--vscode-panel-border)'
    }}>
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--vscode-panel-border)',
        background: 'var(--vscode-panel-background)'
      }}>
        <h3 style={{
          margin: '0 0 12px 0',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--vscode-foreground)'
        }}>Shape Library</h3>

        <input
          type="text"
          placeholder="Search shapes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--vscode-input-border)',
            borderRadius: '4px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border 0.2s',
            boxSizing: 'border-box',
            background: 'var(--vscode-input-background)',
            color: 'var(--vscode-input-foreground)'  
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--vscode-input-focusBorder)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--vscode-input-border)'}
        />
      </div>
      
      {/* Services List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
      }}>
        {filteredServices ? (
          // Search Results
          <div>
            {filteredServices.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: 'var(--vscode-descriptionForeground)',
                fontSize: '13px'
              }}>
                No services found
              </div>
            ) : (
              filteredServices.map((service) => (
                <ServiceItem key={service.classifier} service={service} onDragStart={(e, s) => handleDragStart(e, s, 'aws')} />
              ))
            )}
          </div>
        ) : (
          <>

          {/* General Shapes Section */}
          <div style={{ marginBottom: '16px'}}>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--vscode-descriptionForeground)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
              paddingLeft: '4px'
            }}>General Shapes</h4>
            {getAllGeneralShapes().map(shape => (
              <GeneralShapeItem key={shape.classifier} shape={shape} onDragStart={(e, s) => handleDragStart(e, s, 'general')} />
            ))}
          </div>

          {/* AWS Services Section */}
          <div>
            <h4 style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--vscode-descriptionForeground)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '8px',
              paddingLeft: '4px'
            }}>AWS Services</h4>
            {categories.map(category => (
              <CategorySection key={category} category={category} isExpanded={expandedCategories.has(category)} onToggle={() => toggleCategory(category)} onDragStart={(e, s) => handleDragStart(e, s, 'aws')} />
                
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
};

interface GeneralShapeItemProps {
  shape: GeneralShapeConfig;
  onDragStart: (event: React.DragEvent, shape: GeneralShapeConfig) => void;
}

const GeneralShapeItem: React.FC<GeneralShapeItemProps> = ({ shape, onDragStart }) => {
  return (
    <div 
    draggable
    onDragStart={(e) => onDragStart(e, shape)}
    style={{
      padding: '8px 12px',
      background: 'var(--vscode-list-inactiveSelectionBackground)',
      border: '1px solid var(--vscode-panel-border)',
      borderRadius: '4px',
      marginBottom: '4px',
      cursor: 'grab',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      fontSize: '12px',
      color: 'var(--vscode-foreground)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
      e.currentTarget.style.borderColor = 'var(--vscode-list-focusBorder)';
      e.currentTarget.style.transform = 'translateX(2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'var(--vscode-list-inactiveSelectionBackground)';
      e.currentTarget.style.borderColor = 'var(--vscode-panel-border)';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
    onDragStartCapture={(e) => e.currentTarget.style.cursor = 'grabbing'}
    onDragEnd={(e) => e.currentTarget.style.cursor = 'grab'}
    >
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: shape.color.fill,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${shape.color.stroke}`
      }}>
        {shape.icon ? (
          <img
            src={shape.icon}
            alt={shape.displayName}
            style={{
              width: '20px',
              height: '20px',
              pointerEvents: 'none'
            }}
          />
        ) : (
          <span style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: shape.color.stroke
          }}>{shape.displayName.charAt(0)}
          </span>
        
        )}
      </div>
    <span style={{
      color: 'var(--vscode-foreground)',
      fontWeight: 500
    }}>{shape.displayName}
    </span>
    </div>
  );
};
  
interface CategorySectionProps {
  category: AWSCategory;
  isExpanded: boolean;
  onToggle: () => void;
  onDragStart: (event: React.DragEvent, service: AWSServiceConfig) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ 
  category, 
  isExpanded, 
  onToggle, 
  onDragStart 
}) => {
  const services = getServicesByCategory(category);
  const displayName = getCategoryDisplayName(category);

  return (
    <div style={{ marginBottom: '8px' }}>
      {/* Category Header */}
      <button
      type="button"
      onClick={onToggle}
      style={{
        width: '100%',
        padding: '8px 12px',
        background: 'var(--vscode-list-inactiveSelectionBackground)',
        border: '1px solid var(--vscode-panel-border)',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--vscode-foreground)',
        fontWeight: 600,
        textAlign: 'left',
        outline: 'none',
        transition: 'background 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'var(--vscode-list-inactiveSelectionBackground)'}
      >
        <span>{displayName}</span>
        <span style={{
          transition: 'transform 0.2s',
          transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
        }}>▸</span>
      </button>

      {/* Service Items */}
      {isExpanded && (
        <div style={{
          marginTop: '4px'
        }}>
          {services.map(service => (
            <ServiceItem key={service.classifier} service={service} onDragStart={onDragStart} />
          ))}
        </div>
      )}
    </div>
  );
};

interface ServiceItemProps {
  service: AWSServiceConfig;
  onDragStart: (event: React.DragEvent, service: AWSServiceConfig) => void;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ service, onDragStart }) => {
  return (
    <div 
    draggable
    onDragStart={(e) => onDragStart(e, service)}
    style={{
      padding: '8px 12px',
      background: 'var(--vscode-list-inactiveSelectionBackground)',
      border: '1px solid var(--vscode-panel-border)',
      borderRadius: '4px',
      marginBottom: '4px',
      cursor: 'grab',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s',
      fontSize: '12px',
      color: 'var(--vscode-foreground)'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'var(--vscode-list-hoverBackground)';
      e.currentTarget.style.borderColor = 'var(--vscode-list-focusBorder)';
      e.currentTarget.style.transform = 'translateX(2px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'var(--vscode-list-inactiveSelectionBackground)';
      e.currentTarget.style.borderColor = 'var(--vscode-panel-border)';
      e.currentTarget.style.transform = 'translateX(0)';
    }}
    onDragStartCapture={(e) => e.currentTarget.style.cursor = 'grabbing'}
    onDragEnd={(e) => e.currentTarget.style.cursor = 'grab'}
    >
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '4px',
        background: service.color.stroke,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        flexShrink: 0,
        pointerEvents: 'none'
      }}>
        {service.displayName.charAt(0)}
      </div>

      <span style={{
        color: 'var(--vscode-foreground)',
        fontWeight: 500
      }}>
        {service.displayName}
      </span>

    </div>
  );
};