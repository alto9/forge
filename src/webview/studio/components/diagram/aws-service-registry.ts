export type AWSVisualType = 'box' | 'cylindar' | 'frame' | 'note';
export type AWSCategory = 'group' | 'compute' | 'database' | 'storage' | 'networking';

export interface AWSServiceConfig {
  classifier: string;
  displayName: string;
  category: AWSCategory;
  color: {
    fill: string;
    stroke: string;
  }
  visual: AWSVisualType;
  isContainer?: boolean;
}

export const AWS_SERVICE_REGISTRY: Record<string, AWSServiceConfig> = {
    'lambda': {
        classifier: 'lambda',
        displayName: 'Lambda',
        category: 'compute',
        color: {
            fill: '#FFF4E6',
            stroke: '#FF9900'
        },
        visual: 'box'
    },
    's3': {
        classifier: 's3',
        displayName: 'S3',
        category: 'storage',
        color: {
            fill: '#E8F5E9',
            stroke: '#3F8624'
        },
        visual: 'cylindar'
    },
    'dynamodb': {
        classifier: 'dynamodb',
        displayName: 'DynamoDB',
        category: 'database',
        color: {
            fill: '#E3F2FD',
            stroke: '#527FFF'
        },
        visual: 'cylindar'
    },
    'api-gateway': {
        classifier: 'api-gateway',
        displayName: 'API Gateway',
        category: 'networking',
        color: {
            fill: '#F3E5F5',
            stroke: '#8B2FC9'
        },
        visual: 'box'
    },
    'ec2': {
        classifier: 'ec2',
        displayName: 'EC2',
        category: 'compute',
        color: {
            fill: '#FFF4E6',
            stroke: '#FF9900'
        },
        visual: 'box'
    },
    'rds': {
        classifier: 'rds',
        displayName: 'RDS',
        category: 'database',
        color: {
            fill: '#E3F2FD',
            stroke: '#527FFF'
        },
        visual: 'cylindar'
    },
    'cloudfront': {
        classifier: 'cloudfront',
        displayName: 'CloudFront',
        category: 'networking',
        color: {
            fill: '#F3E5F5',
            stroke: '#8B2FC9'
        },
        visual: 'box'
    },
    'vpc': {
        classifier: 'vpc',
        displayName: 'VPC',
        category: 'group',
        color: {
            fill: '#E8F4F8',
            stroke: '#1E8900'
        },
        visual: 'frame',
        isContainer: true
    },
    'subnet': {
        classifier: 'subnet',
        displayName: 'Subnet',
        category: 'group',
        color: {
            fill: '#E6F2E6',
            stroke: '#147D64'
        },
        visual: 'frame',
        isContainer: true
    },
    'availability-zone': {
        classifier: 'availability-zone',
        displayName: 'Availability Zone',
        category: 'group',
        color: {
            fill: '#FFF8E1',
            stroke: '#C77700'
        },
        visual: 'frame',
        isContainer: true
    },
    'region': {
        classifier: 'region',
        displayName: 'Region',
        category: 'group',
        color: {
            fill: '#F3E5F5',
            stroke: '#6B1B9A'
        },
        visual: 'frame',
        isContainer: true
    },
    'security-group': {
        classifier: 'security-group',
        displayName: 'Security Group',
        category: 'group',
        color: {
            fill: '#FFEBEE',
            stroke: '#DD2C00'
        },
        visual: 'frame',
        isContainer: true
    }
}

export function getServicesConfig(classifier: string): AWSServiceConfig | null {
    return AWS_SERVICE_REGISTRY[classifier] || null;
}

export function isAWSService(classifier: string): boolean {
    return classifier in AWS_SERVICE_REGISTRY;
}

export function getServicesByCategory(category: AWSCategory): AWSServiceConfig[] {
    return Object.values(AWS_SERVICE_REGISTRY).filter(service => service.category === category);
}

export function getCategories(): AWSCategory[] {
    return ['group', 'compute', 'database', 'storage', 'networking'];
}

export function getCategoryDisplayName(category: AWSCategory): string {
    const displayNames: Record<AWSCategory, string> = {
        group: 'Groups',
        compute: 'Compute',
        database: 'Database',
        storage: 'Storage',
        networking: 'Networking'
    };
    return displayNames[category] || category;
}

export function getAllServices(): AWSServiceConfig[] {
    return Object.values(AWS_SERVICE_REGISTRY);
}