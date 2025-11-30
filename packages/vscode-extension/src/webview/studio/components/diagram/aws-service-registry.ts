import LambdaIcon from './icons/aws/Architecture-Service-Icons/Arch_Compute/48/Arch_AWS-Lambda_48.svg';
import S3Icon from './icons/aws/Architecture-Service-Icons/Arch_Storage/48/Arch_Amazon-Simple-Storage-Service_48.svg';
import DynamoDBIcon from './icons/aws/Architecture-Service-Icons/Arch_Database/48/Arch_Amazon-DynamoDB_48.svg';
import APIGatewayIcon from './icons/aws/Architecture-Service-Icons/Arch_Networking-Content-Delivery/48/Arch_Amazon-API-Gateway_48.svg';
import EC2Icon from './icons/aws/Architecture-Service-Icons/Arch_Compute/48/Arch_Amazon-EC2_48.svg';
import RDSIcon from './icons/aws/Architecture-Service-Icons/Arch_Database/48/Arch_Amazon-RDS_48.svg';
import CloudFrontIcon from './icons/aws/Architecture-Service-Icons/Arch_Networking-Content-Delivery/48/Arch_Amazon-CloudFront_48.svg';
import VPCIcon from './icons/aws/Architecture-Service-Icons/Arch_Networking-Content-Delivery/48/Arch_Amazon-Virtual-Private-Cloud_48.svg';

export type AWSVisualType = 'box' | 'cylindar' | 'frame' | 'note';
export type AWSCategory = 'group' | 'compute' | 'database' | 'storage' | 'networking';

export interface AWSServiceConfig {
  classifier: string;
  displayName: string;
  category: AWSCategory;
  icon: string;
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
        icon: LambdaIcon,
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
        icon: S3Icon,
        color: {
            fill: '#FFF4E6',
            stroke: '#FF9900'
        },
        visual: 'cylindar'
    },
    'dynamodb': {
        classifier: 'dynamodb',
        displayName: 'DynamoDB',
        category: 'database',
        icon: DynamoDBIcon,
        color: {
            fill: '#FFF4E6',
            stroke: '#FF9900'
        },
        visual: 'cylindar'
    },
    'api-gateway': {
        classifier: 'api-gateway',
        displayName: 'API Gateway',
        category: 'networking',
        icon: APIGatewayIcon,
        color: {
            fill: '#FFF4E6',
            stroke: '#FF9900'
        },
        visual: 'box'
    },
    'ec2': {
        classifier: 'ec2',
        displayName: 'EC2',
        category: 'compute',
        icon: EC2Icon,
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
        icon: RDSIcon,
        color: {
            fill: '#FFF4E6',
            stroke: '#FF9900'
        },
        visual: 'cylindar'
    },
    'cloudfront': {
        classifier: 'cloudfront',
        displayName: 'CloudFront',
        category: 'networking',
        icon: CloudFrontIcon,
        color: {
            fill: '#FFF4E6',
            stroke: '#FF9900'
        },
        visual: 'box'
    },
    'vpc': {
        classifier: 'vpc',
        displayName: 'VPC',
        category: 'networking',
        icon: VPCIcon,
        color: {
            fill: '#E7F5FF',
            stroke: '#147EB3'
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