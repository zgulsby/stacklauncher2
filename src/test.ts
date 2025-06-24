import { validateStack } from './schema.js';
import { FileLoader } from './utils/fileLoader.js';
import { Logger } from './utils/logger.js';
import { RunPodClient } from './runpodClient.js';

export interface TestOptions {
  file: string;
  dryRun?: boolean;
}

export async function testCommand(options: TestOptions): Promise<void> {
  Logger.header('Testing Stack Deployment');
  
  // Load and validate the stack configuration
  const fileResult = FileLoader.loadYaml(options.file);
  
  if (!fileResult.success) {
    Logger.error(`Failed to load ${options.file}: ${fileResult.error}`);
    throw new Error('Failed to load stack file');
  }

  const validationResult = validateStack(fileResult.data);
  
  if (!validationResult.success) {
    Logger.error('Stack configuration validation failed:');
    validationResult.errors.forEach(error => {
      Logger.error(`  ${error}`);
    });
    throw new Error('Validation failed');
  }

  Logger.success('Stack configuration is valid');
  
  const stack = validationResult.data;
  Logger.info(`Testing stack: ${stack.name} (${stack.id})`);
  
  if (options.dryRun) {
    Logger.info('Dry run mode - showing what would be deployed:');
    Logger.info(`  Container: ${stack.containerImage}`);
    Logger.info(`  GPU: ${stack.gpu.count}x ${stack.gpu.type}`);
    Logger.info(`  Memory: ${stack.memory}GB`);
    Logger.info(`  CPU: ${stack.cpu || 1} cores`);
    
    if (stack.env && stack.env.length > 0) {
      Logger.info(`  Environment variables: ${stack.env.length}`);
      stack.env.forEach(env => {
        Logger.info(`    ${env.name}=${env.value}`);
      });
    }
    
    if (stack.ports && stack.ports.length > 0) {
      Logger.info(`  Ports:`);
      stack.ports.forEach(port => {
        Logger.info(`    ${port.containerPort}:${port.exposedPort || port.containerPort}/${port.protocol}`);
      });
    }
    
    if (stack.volumes && stack.volumes.length > 0) {
      Logger.info(`  Volumes:`);
      stack.volumes.forEach(volume => {
        Logger.info(`    ${volume.containerPath} (${volume.size}GB)`);
      });
    }
    
    Logger.success('Dry run completed - configuration looks good!');
    return;
  }

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
    // Launch the test pod
    Logger.step('Launching test deployment...');
    podInfo = await client.launchPodFromStack(stack);
    
    Logger.success('Test deployment launched successfully!');
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
    
    Logger.warning('Remember to terminate the pod when you\'re done testing to avoid charges');
    Logger.info(`To terminate: runpod-stack terminate ${podInfo.id}`);
    
  } catch (error) {
    Logger.error(`Test deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
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