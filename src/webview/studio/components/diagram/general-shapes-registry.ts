export interface GeneralShapeConfig {
    classifier: string;
    displayName: string;
    icon?: string;
    color: {
        fill: string;
        stroke: string;
    };
    type: 'shape' | 'container';
}

export const GENERAL_SHAPES_REGISTRY: Record<string, GeneralShapeConfig> = {
    'group': {
        classifier: 'group',
        displayName: 'Group',
        color: {
            fill: '#E8E8E8',
            stroke: '#666666'
        },
        type: 'container'
    },
    'external-system': {
        classifier: 'external_system',
        displayName: 'External System',
        color: {
            fill: '#F0F0F0',
            stroke: '#999999'
        },
        type: 'shape'
    }
};

export function getGeneralShapeConfig(classifier: string): GeneralShapeConfig | null {
    return GENERAL_SHAPES_REGISTRY[classifier] || null;
}

export function isGeneralShape(classifier: string): boolean {
    return classifier in GENERAL_SHAPES_REGISTRY;
}

export function getAllGeneralShapes(): GeneralShapeConfig[] {
    return Object.values(GENERAL_SHAPES_REGISTRY);
}