import { RunPodClient } from './runpodClient';
import { Logger } from './utils/logger';

export interface TerminateOptions {
  podId: string;
}

export async function terminateCommand(options: TerminateOptions): Promise<void> {
  Logger.header('Terminating Pod');
  
  if (!options.podId) {
    throw new Error('Pod ID is required');
  }

  Logger.info(`Terminating pod: ${options.podId}`);

  // Initialize RunPod client
  let client: RunPodClient;
  try {
    client = new RunPodClient();
  } catch (error) {
    Logger.error(`Failed to initialize RunPod client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    Logger.info('Make sure to set your RUNPOD_API_KEY environment variable');
    throw error;
  }

  try {
    // Get pod info first to confirm it exists
    Logger.step('Getting pod information...');
    const podInfo = await client.getPodInfo(options.podId);
    
    Logger.info(`Pod Name: ${podInfo.name}`);
    Logger.info(`Current Status: ${podInfo.status}`);
    
    if (podInfo.status === 'TERMINATED') {
      Logger.warning('Pod is already terminated');
      return;
    }

    // Terminate the pod
    Logger.step('Terminating pod...');
    await client.terminatePod(options.podId);
    
    Logger.success('Pod termination initiated successfully');
    Logger.info('The pod will be terminated shortly. You can check the status in the RunPod console.');
    
  } catch (error) {
    Logger.error(`Failed to terminate pod: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
} 