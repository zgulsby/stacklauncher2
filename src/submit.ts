import fetch from 'node-fetch';
import { validateStack } from './schema.js';
import { FileLoader } from './utils/fileLoader.js';
import { Logger } from './utils/logger.js';

export interface SubmitOptions {
  file: string;
  endpoint?: string;
}

interface SubmissionResponse {
  success: boolean;
  submissionId?: string;
  message?: string;
  error?: string;
}

export async function submitCommand(options: SubmitOptions): Promise<void> {
  Logger.header('Submitting Stack to Catalog');
  
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
    throw new Error('Validation failed - cannot submit invalid stack');
  }

  Logger.success('Stack configuration is valid');
  
  const stack = validationResult.data;
  Logger.info(`Preparing to submit: ${stack.name} (${stack.id}) v${stack.version}`);
  
  // Prepare submission payload
  const payload = {
    stack,
    metadata: {
      submittedAt: new Date().toISOString(),
      sdkVersion: '1.0.0',
      source: options.file,
    },
  };

  // Determine submission endpoint
  const endpoint = options.endpoint || 
                  process.env.STACK_LAUNCHER_API_URL || 
                  'https://your-stack-catalog-backend.com/api/submit';

  Logger.step(`Submitting to: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RunPod-Stack-Launcher-SDK/1.0.0',
        // Add auth header if API key is available
        ...(process.env.RUNPOD_API_KEY && {
          'Authorization': `Bearer ${process.env.RUNPOD_API_KEY}`
        }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as SubmissionResponse;

    if (result.success) {
      Logger.success('Stack submitted successfully!');
      
      if (result.submissionId) {
        Logger.info(`Submission ID: ${result.submissionId}`);
      }
      
      if (result.message) {
        Logger.info(`Message: ${result.message}`);
      }
      
      Logger.info('Your stack will be reviewed and published to the catalog if approved.');
      Logger.info('You will receive notification about the review status.');
      
    } else {
      Logger.error(`Submission failed: ${result.error || 'Unknown error'}`);
      throw new Error('Submission failed');
    }

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        Logger.error('Failed to connect to submission endpoint');
        Logger.info('This might be a network issue or the endpoint might be unavailable');
        Logger.info('If you\'re testing locally, you can use a mock endpoint with --endpoint flag');
      } else {
        Logger.error(`Submission failed: ${error.message}`);
      }
    } else {
      Logger.error('Submission failed with unknown error');
    }
    
    throw error;
  }
} 