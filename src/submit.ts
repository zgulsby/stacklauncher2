import fetch from 'node-fetch';
import { validateStack } from './schema';
import { FileLoader } from './utils/fileLoader';
import { Logger } from './utils/logger';
import { existsSync, readFileSync } from 'fs';
import readline from 'readline';

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
  Logger.info('Submitting Stack to Catalog');
  
  // Load and validate the stack configuration
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

  Logger.success('Stack configuration is valid');
  
  // Check for test result
  const testResultPath = '.runpod/test_result.json';
  let testResultExists = false;
  try {
    testResultExists = existsSync(testResultPath);
  } catch {}

  if (!testResultExists) {
    Logger.warning('No test result found. It is recommended to run `runpod-stack test` before submitting.');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>(resolve => {
      rl.question('Are you sure you want to submit without testing? (y/N): ', resolve);
    });
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      Logger.info('Submission cancelled. Please run `runpod-stack test` first.');
      process.exit(1);
    }
  }

  const stack = validationResult.data;

  // Extract metadata fields
  const stackMeta = {
    name: stack.name,
    id: stack.id,
    docs: stack.docs?.usage || stack.docs?.description || '',
    logo: stack.logo || '',
    maintainer: stack.maintainer || '',
  };

  // Dry-run preview
  Logger.header('Submitting stack:');
  Logger.info(`- Name: ${stackMeta.name}`);
  Logger.info(`- Maintainer: ${stackMeta.maintainer}`);
  Logger.info(`- Docs: ${stack.docsUrl || stackMeta.docs}`);
  Logger.info(`- Logo: ${stackMeta.logo}`);

  // Prepare submission payload
  const payload = {
    stack,
    metadata: {
      submittedAt: new Date().toISOString(),
      sdkVersion: '1.0.0',
      source: options.file,
      ...stackMeta,
    },
  };

  // Determine submission endpoint
  const endpoint = options.endpoint || 
                  process.env.STACK_LAUNCHER_API_URL || 
                  'https://your-stack-catalog-backend.com/api/submit';

  Logger.step(`Submitting to: ${endpoint}`);

  try {
    Logger.info('Packaging and submitting stack...');
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
      process.exit(0);
    } else {
      Logger.error(`Submission failed: ${result.error || 'Unknown error'}`);
      process.exit(3);
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
    
    process.exit(3);
  }
} 