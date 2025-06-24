import fetch from 'node-fetch';
import { StackConfig } from './schema';
import { Logger } from './utils/logger';
import { GpuMapper } from './utils/gpuMapper';
import { ResourceConfig, createResourceConfig, PREDEFINED_CONFIGS } from './utils/resourceConfig';

interface RunPodApiResponse<T = any> {
  id?: string;
  status: string;
  data?: T;
  error?: string;
}

interface PodSpec {
  name: string;
  imageName: string;
  gpuTypeId: string;
  gpuCount: number;
  memoryInGb: number;
  vcpuCount?: number;
  containerDiskInGb?: number;
  env?: Array<{ name: string; value: string }>;
  ports?: string;
  volumeInGb?: number;
  volumeMountPath?: string;
}

interface PodInfo {
  id: string;
  name: string;
  status: string;
  ipAddress?: string;
  ports?: string;
  gpuCount: number;
  memoryInGb: number;
}

export class RunPodClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.RUNPOD_API_KEY || '';
    if (!this.apiKey) {
      Logger.error('RunPod API key is required. Set RUNPOD_API_KEY environment variable.');
      process.exit(2);
    }
    this.baseUrl = `https://api.runpod.io/graphql?api_key=${this.apiKey}`;
  }

  private async makeRequest(query: string, variables?: any): Promise<RunPodApiResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data as RunPodApiResponse;
    } catch (error) {
      Logger.error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Launch a pod using a stack configuration
   */
  async launchPodFromStack(stack: StackConfig, testName?: string): Promise<PodInfo> {
    Logger.step('Converting stack configuration to RunPod pod spec...');
    
    // Validate GPU requirements
    const gpuValidation = GpuMapper.validateGpuRequirements(stack.gpu.type, stack.gpu.memoryGB);
    if (!gpuValidation.valid) {
      throw new Error(`GPU validation failed: ${gpuValidation.errors.join(', ')}`);
    }

    // Determine cloudType
    let cloudType = 'ALL';
    let deploymentMode = 'COMMUNITY/PUBLIC';
    if ((stack.secureCloud === true) || (stack.network === 'private')) {
      cloudType = 'SECURE';
      deploymentMode = 'SECURE/PRIVATE';
    }
    Logger.info(`Deployment mode: ${deploymentMode}`);

    const podSpec: PodSpec = {
      name: testName || `test-${stack.id}-${Date.now()}`,
      imageName: stack.containerImage,
      gpuTypeId: GpuMapper.mapGpuType(stack.gpu.type),
      gpuCount: stack.gpu.count,
      memoryInGb: stack.memory,
      vcpuCount: stack.cpu || 1,
    };

    // Add environment variables
    if (stack.env && stack.env.length > 0) {
      podSpec.env = stack.env.map(envVar => ({
        name: envVar.name,
        value: envVar.value,
      }));
    }

    // Add port mappings
    if (stack.ports && stack.ports.length > 0) {
      podSpec.ports = stack.ports
        .map(port => `${port.containerPort}:${port.exposedPort || port.containerPort}/${port.protocol}`)
        .join(',');
    }

    // Add volume if specified
    if (stack.volumes && stack.volumes.length > 0) {
      const primaryVolume = stack.volumes[0];
      podSpec.volumeInGb = primaryVolume.size;
      podSpec.volumeMountPath = primaryVolume.containerPath;
    }

    Logger.step('Launching pod via RunPod API...');
    
    const launchMutation = `
      mutation {
        podFindAndDeployOnDemand(input: {
          cloudType: ${cloudType},
          gpuCount: ${podSpec.gpuCount},
          gpuTypeId: "${podSpec.gpuTypeId}",
          name: "${podSpec.name}",
          imageName: "${podSpec.imageName}",
          minMemoryInGb: ${podSpec.memoryInGb},
          minVcpuCount: ${podSpec.vcpuCount || 1},
          containerDiskInGb: 40,
          volumeInGb: ${podSpec.volumeInGb || 40},
          volumeMountPath: "${podSpec.volumeMountPath || '/workspace'}",
          ports: "${podSpec.ports || '8080/http'}",
          env: [${podSpec.env?.map(e => `{key: "${e.name}", value: "${e.value}"}`).join(', ') || ''}]
        }) {
          id
          imageName
          env
          machineId
        }
      }
    `;

    const result = await this.makeRequest(launchMutation);
    
    if (result.error) {
      throw new Error(`Failed to launch pod: ${result.error}`);
    }

    const podId = result.data?.podFindAndDeployOnDemand?.id;
    if (!podId) {
      throw new Error('Pod launch succeeded but no pod ID returned');
    }

    Logger.success(`Pod launched successfully! ID: ${podId}`);
    
    // Wait for pod to be ready and get its information
    return await this.waitForPodReady(podId);
  }

  /**
   * Launch a pod using a resource configuration (Tetra-style)
   */
  async launchPodFromResourceConfig(
    resourceConfig: ResourceConfig,
    imageName: string,
    podName?: string
  ): Promise<PodInfo> {
    Logger.step('Launching pod using resource configuration...');
    
    // Validate resource configuration
    const validation = resourceConfig.validate?.() || { valid: true, errors: [] };
    if (!validation.valid) {
      throw new Error(`Resource configuration validation failed: ${validation.errors.join(', ')}`);
    }

    const name = podName || `${resourceConfig.name}-${Date.now()}`;
    
    // Convert resource config to pod spec
    const podSpec: PodSpec = {
      name,
      imageName,
      gpuTypeId: resourceConfig.gpus?.[0] || 'NVIDIA GeForce RTX 4090', // Default fallback
      gpuCount: resourceConfig.gpuCount || 1,
      memoryInGb: 16, // Default memory
      vcpuCount: 2, // Default CPU
    };

    // Add environment variables
    if (resourceConfig.env) {
      podSpec.env = Object.entries(resourceConfig.env).map(([name, value]) => ({
        name,
        value,
      }));
    }

    Logger.step('Launching pod via RunPod API...');
    
    const launchMutation = `
      mutation {
        podFindAndDeployOnDemand(input: {
          cloudType: ${resourceConfig.cloudType || 'ALL'},
          gpuCount: ${podSpec.gpuCount},
          gpuTypeId: "${podSpec.gpuTypeId}",
          name: "${podSpec.name}",
          imageName: "${podSpec.imageName}",
          minMemoryInGb: ${podSpec.memoryInGb},
          minVcpuCount: ${podSpec.vcpuCount || 1},
          containerDiskInGb: 40,
          volumeInGb: 40,
          volumeMountPath: "/workspace",
          ports: "8080/http",
          env: [${podSpec.env?.map(e => `{key: "${e.name}", value: "${e.value}"}`).join(', ') || ''}]
        }) {
          id
          imageName
          env
          machineId
        }
      }
    `;

    const result = await this.makeRequest(launchMutation);
    
    if (result.error) {
      throw new Error(`Failed to launch pod: ${result.error}`);
    }

    const podId = result.data?.podFindAndDeployOnDemand?.id;
    if (!podId) {
      throw new Error('Pod launch succeeded but no pod ID returned');
    }

    Logger.success(`Pod launched successfully! ID: ${podId}`);
    
    return await this.waitForPodReady(podId);
  }

  async waitForPodReady(podId: string, timeoutMs = 300000): Promise<PodInfo> {
    Logger.step('Waiting for pod to be ready...');
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const podInfo = await this.getPodInfo(podId);
      
      if (podInfo.status === 'RUNNING') {
        Logger.success('Pod is ready and running!');
        return podInfo;
      }
      
      if (podInfo.status === 'FAILED' || podInfo.status === 'TERMINATED') {
        throw new Error(`Pod failed to start. Status: ${podInfo.status}`);
      }
      
      Logger.info(`Pod status: ${podInfo.status}. Waiting...`);
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
    
    throw new Error('Timeout waiting for pod to become ready');
  }

  async getPodInfo(podId: string): Promise<PodInfo> {
    const query = `
      query {
        pod(input: {podId: "${podId}"}) {
          id
          name
          desiredStatus
          runtime {
            ports {
              ip
              privatePort
              publicPort
              type
            }
          }
          gpuCount
          memoryInGb
        }
      }
    `;

    const result = await this.makeRequest(query);
    
    if (result.error) {
      throw new Error(`Failed to get pod info: ${result.error}`);
    }

    const pod = result.data?.pod;
    if (!pod) {
      throw new Error('Pod not found');
    }

    return {
      id: pod.id,
      name: pod.name,
      status: pod.desiredStatus,
      ipAddress: pod.runtime?.ports?.[0]?.ip,
      ports: pod.runtime?.ports?.map((p: any) => `${p.privatePort}:${p.publicPort}`).join(', '),
      gpuCount: pod.gpuCount,
      memoryInGb: pod.memoryInGb,
    };
  }

  async terminatePod(podId: string): Promise<void> {
    Logger.step(`Terminating pod ${podId}...`);
    
    const mutation = `
      mutation {
        podTerminate(input: {podId: "${podId}"}) {
          id
          desiredStatus
        }
      }
    `;

    const result = await this.makeRequest(mutation);
    
    if (result.error) {
      throw new Error(`Failed to terminate pod: ${result.error}`);
    }

    Logger.success('Pod terminated successfully');
  }

  /**
   * Get available GPU types (inspired by Tetra's GPU discovery)
   */
  async getAvailableGpuTypes(): Promise<any[]> {
    Logger.step('Fetching available GPU types...');
    
    const query = `
      query {
        gpuTypes {
          id
          displayName
          memoryInGb
          secureCloud
          communityCloud
        }
      }
    `;

    const result = await this.makeRequest(query);
    
    if (result.error) {
      throw new Error(`Failed to get GPU types: ${result.error}`);
    }

    return result.data?.gpuTypes || [];
  }

  /**
   * Get GPU pricing information
   */
  async getGpuPricing(gpuTypeId: string, gpuCount: number = 1): Promise<any> {
    Logger.step(`Fetching pricing for ${gpuCount}x ${gpuTypeId}...`);
    
    const query = `
      query {
        gpuTypes(input: {id: "${gpuTypeId}"}) {
          id
          displayName
          lowestPrice(input: {gpuCount: ${gpuCount}}) {
            minimumBidPrice
            uninterruptablePrice
          }
        }
      }
    `;

    const result = await this.makeRequest(query);
    
    if (result.error) {
      throw new Error(`Failed to get GPU pricing: ${result.error}`);
    }

    return result.data?.gpuTypes?.[0] || null;
  }
} 