import { FileLoader } from './utils/fileLoader';
import { validateStack } from './schema';
import { Logger } from './utils/logger';
import { RunPodClient } from './runpodClient';
import fetch from 'node-fetch';

export async function testCommand(options: { file: string; dryRun?: boolean }): Promise<void> {
  Logger.header('Testing Stack Deployment');

  const fileResult = FileLoader.loadYaml(options.file);
  if (!fileResult.success) {
    Logger.error(`Failed to load ${options.file}: ${fileResult.error}`);
    process.exit(1);
  }

  const validationResult = validateStack(fileResult.data);
  if (!validationResult.success) {
    Logger.error('Stack configuration validation failed:');
    validationResult.errors.forEach(error => {
      Logger.error(`  ${error}`);
    });
    process.exit(1);
  }

  const stack = validationResult.data;

  if (options.dryRun) {
    Logger.info('Dry run enabled. No pod will be launched.');
    Logger.info(`Stack: ${stack.name} (${stack.id})`);
    Logger.info(`Image: ${stack.containerImage}`);
    process.exit(0);
  }

  // Warn and log deployment mode
  let deploymentMode = 'COMMUNITY/PUBLIC';
  if ((stack.secureCloud === true) || (stack.network === 'private')) {
    deploymentMode = 'SECURE/PRIVATE';
  }
  Logger.info(`Deployment mode: ${deploymentMode}`);
  if (stack.secureCloud === true && stack.network !== 'private') {
    Logger.warning('secureCloud is true but network is not "private". For secure deployments, network should be set to "private".');
  }

  Logger.info('Launching pod on RunPod...');
  const client = new RunPodClient();
  const podInfo = await client.launchPodFromStack(stack);
  if (!podInfo || !podInfo.ipAddress) {
    Logger.error('Failed to launch pod or retrieve public IP address.');
    process.exit(1);
  }
  Logger.success(`Pod launched! Public IP: ${podInfo.ipAddress}`);

  // Healthcheck logic
  if (stack.healthcheck && stack.healthcheck.path) {
    const healthPath = stack.healthcheck.path;
    const timeoutSeconds = stack.healthcheck.timeoutSeconds || 30;
    const healthUrl = `http://${podInfo.ipAddress.replace(/\/$/, '')}${healthPath}`;
    Logger.info(`Waiting for container to pass healthcheck at ${healthPath}...`);
    const start = Date.now();
    let healthy = false;
    while ((Date.now() - start) / 1000 < timeoutSeconds) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
        clearTimeout(timeout);
        if (res.status === 200) {
          healthy = true;
          break;
        }
      } catch (e) {
        // Ignore errors, keep polling
      }
      await new Promise(r => setTimeout(r, 2000)); // poll every 2s
    }
    if (healthy) {
      Logger.success('✅ Container is healthy');
      process.exit(0);
    } else {
      Logger.error(`❌ Healthcheck timed out after ${timeoutSeconds} seconds`);
      process.exit(1);
    }
  } else {
    Logger.info('No healthcheck defined. Test complete.');
    process.exit(0);
  }
} 