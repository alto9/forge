import React from 'react';
import type { NodeTypes } from 'reactflow';
import { BaseAWSNode, AWSNodeData } from './nodes/BaseAWSNode';
import { ContainerNode } from './nodes/ContainerNode';
import { GeneralShapeNode } from './nodes/GeneralShapeNode';
import { ActorNode } from './nodes/ActorNode';
import { AWS_SERVICE_REGISTRY, getServicesConfig } from './aws-service-registry';
import { GENERAL_SHAPES_REGISTRY, getGeneralShapeConfig } from './general-shapes-registry';

function createAWSNodeComponet(classifier: string) {
    return React.memo((props: any) => {
        const serviceConfig = getServicesConfig(classifier);
        if (!serviceConfig){
            return React.createElement('div', {
                style: {
                    padding: '10px',
                    border: '2px solid #ccc',
                    borderRadius: '4px',
                    background: 'white'
                }
            }, props.data.label);
        }

        if (serviceConfig.isContainer) {
            return React.createElement(ContainerNode, {
                ...props,
                data: {
                    ...props.data,
                    classifier: serviceConfig.classifier,
                    isContainer: true
                }
            });
        }

        return React.createElement(BaseAWSNode, {
            ...props,
            serviceConfig
        });
    });
}

function createGeneralShapeNodeComponent(classifier: string) {
    return React.memo((props:any) => {
        const shapeConfig = getGeneralShapeConfig(classifier);

        if(!shapeConfig){
            return React.createElement('div', {
                style: {
                    padding: '10px',
                    border: '2px solid #ccc',
                    borderRadius: '4px',
                    background: 'white'
                }
            }, props.data.label);
        }

        if (shapeConfig.type === 'container') {
            return React.createElement(ContainerNode, props);
        }

        return React.createElement(GeneralShapeNode, {
            ...props,
            shapeConfig
        })
    });
}

function generateNodeTypes(): NodeTypes {
    const nodeTypes: NodeTypes = {
        container: ContainerNode,
        actor: ActorNode
    };

    for (const classifier of Object.keys(AWS_SERVICE_REGISTRY)){
        nodeTypes[`aws-${classifier}`] = createAWSNodeComponet(classifier);
    }

    for (const classifier of Object.keys(GENERAL_SHAPES_REGISTRY)){
        nodeTypes[`general-${classifier}`] = createGeneralShapeNodeComponent(classifier);
    }

    return nodeTypes;
}

export const nodeTypes = generateNodeTypes();

export function getNodeTypeFromClassifier(classifier?: string, library: 'aws' | 'general' | 'actor' = 'aws'): string {
    if (!classifier) {
        return 'default';
    }

    if (library === 'actor') {
        return 'actor';
    }

    return library === 'general' ? `general-${classifier}` : `aws-${classifier}`;
}