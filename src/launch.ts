import { RunPodClient } from './runpodClient.js';
import { Logger } from './utils/logger.js';
import { GpuMapper } from './utils/gpuMapper.js';
import { PREDEFINED_CONFIGS, createResourceConfig } from './utils/resourceConfig.js';

export interface LaunchOptions {
  image: string;
  name: string;
  gpu: string;
  gpuCount: string;
  memory: string;
  preset: string;
}

export async function launchCommand(options: LaunchOptions): Promise<void> {
  Logger.header('Launching Pod with Tetra-Style Configuration');
  
  // Parse numeric options
  const gpuCount = parseInt(options.gpuCount);
  const memory = parseInt(options.memory);
  
  if (isNaN(gpuCount) || gpuCount < 1) {
    throw new Error('GPU count must be a positive number');
  }
  
  if (isNaN(memory) || memory < 1) {
    throw new Error('Memory must be a positive number');
  }

  // Validate GPU type
  const gpuInfo = GpuMapper.getGpuInfo(options.gpu);
  if (!gpuInfo) {
    Logger.warning(`Unknown GPU type: ${options.gpu}. Using as-is.`);
  } else {
    Logger.info(`GPU: ${gpuInfo.displayName} (${gpuInfo.memoryInGb}GB memory)`);
  }

  // Create resource configuration
  let resourceConfig;
  
  if (options.preset && PREDEFINED_CONFIGS[options.preset as keyof typeof PREDEFINED_CONFIGS]) {
    Logger.step(`Using ${options.preset} preset configuration...`);
    resourceConfig = PREDEFINED_CONFIGS[options.preset as keyof typeof PREDEFINED_CONFIGS](options.name);
    
    // Override with command line options
    resourceConfig = createResourceConfig(options.name)
      .withGpuCount(gpuCount)
      .withEnvironment({ MEMORY_GB: memory.toString() })
      .build();
  } else {
    Logger.step('Creating custom resource configuration...');
    resourceConfig = createResourceConfig(options.name)
      .withGpuCount(gpuCount)
      .withWorkers(0, 1)
      .withIdleTimeout(5)
      .withEnvironment({ MEMORY_GB: memory.toString() })
      .build();
  }

  // Validate configuration
  const validation = resourceConfig.validate?.() || { valid: true, errors: [] };
  if (!validation.valid) {
    Logger.error('Resource configuration validation failed:');
    validation.errors.forEach(error => {
      Logger.error(`  ${error}`);
    });
    throw new Error('Invalid resource configuration');
  }

  Logger.success('Resource configuration is valid');
  Logger.info(`Configuration: ${gpuCount}x ${options.gpu}, ${memory}GB RAM`);

  // Initialize RunPod client
  let client: RunPodClient;
  try {
    client = new RunPodClient();
  } catch (error) {
    Logger.error(`Failed to initialize RunPod client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    Logger.info('Make sure to set your RUNPOD_API_KEY environment variable');
    throw error;
  }

  let podInfo;
  try {
    // Launch the pod using resource configuration
    Logger.step('Launching pod with resource configuration...');
    podInfo = await client.launchPodFromResourceConfig(resourceConfig, options.image, options.name);
    
    Logger.success('Pod launched successfully!');
    Logger.info(`Pod ID: ${podInfo.id}`);
    Logger.info(`Pod Name: ${podInfo.name}`);
    Logger.info(`Status: ${podInfo.status}`);
    
    if (podInfo.ipAddress) {
      Logger.info(`IP Address: ${podInfo.ipAddress}`);
    }
    
    if (podInfo.ports) {
      Logger.info(`Ports: ${podInfo.ports}`);
    }
    
    Logger.info(`Resources: ${podInfo.gpuCount} GPU(s), ${podInfo.memoryInGb}GB Memory`);
    
    Logger.warning('Remember to terminate the pod when you\'re done to avoid charges');
    Logger.info(`To terminate: runpod-stack terminate ${podInfo.id}`);
    
  } catch (error) {
    Logger.error(`Pod launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // If we have a pod ID, offer to clean it up
    if (podInfo?.id) {
      Logger.warning(`Attempting to clean up pod ${podInfo.id}...`);
      try {
        await client.terminatePod(podInfo.id);
      } catch (cleanupError) {
        Logger.error(`Failed to clean up pod: ${cleanupError instanceof Error ? cleanupError.message : 'Unknown error'}`);
      }
    }
    
    throw error;
  }
} 