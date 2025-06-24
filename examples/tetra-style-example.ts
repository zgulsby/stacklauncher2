#!/usr/bin/env node

/**
 * Tetra-Style Pod Management Example
 * 
 * This example demonstrates the enhanced pod management features inspired by
 * RunPod's Tetra SDK, including:
 * 
 * 1. Resource Configuration Classes
 * 2. GPU Pool Management
 * 3. Predefined Configurations
 * 4. Advanced GPU Mapping
 * 5. Environment Variable Management
 */

import { GpuMapper } from '../src/utils/gpuMapper.js';
import { createResourceConfig, PREDEFINED_CONFIGS, GpuPool, CloudType, ScalerType } from '../src/utils/resourceConfig.js';
import { RunPodClient } from '../src/runpodClient.js';
import { Logger } from '../src/utils/logger.js';

async function demonstrateGpuMapping() {
  Logger.header('GPU Mapping Demonstration');
  
  // Show available GPU types
  const gpuTypes = ['RTX 4090', 'A100', 'H100', 'L40S', 'V100'];
  
  gpuTypes.forEach(gpuType => {
    const gpuInfo = GpuMapper.getGpuInfo(gpuType);
    if (gpuInfo) {
      Logger.info(`${gpuType}: ${gpuInfo.displayName} (${gpuInfo.memoryInGb}GB, Pool: ${gpuInfo.pool})`);
    } else {
      Logger.warning(`${gpuType}: Unknown GPU type`);
    }
  });

  // Show GPU validation
  Logger.step('GPU Requirement Validation');
  const validation = GpuMapper.validateGpuRequirements('RTX 4090', 30);
  if (!validation.valid) {
    Logger.error(`Validation failed: ${validation.errors.join(', ')}`);
  } else {
    Logger.success('GPU requirements are valid');
  }
}

async function demonstrateResourceConfigs() {
  Logger.header('Resource Configuration Examples');
  
  // Custom configuration
  Logger.step('Creating custom resource configuration...');
  const customConfig = createResourceConfig('my-custom-pod')
    .withGpus([GpuPool.AMPERE_80, GpuPool.HOPPER_80])
    .withGpuCount(2)
    .withWorkers(1, 3)
    .withIdleTimeout(30)
    .withEnvironment({
      MODEL_CACHE_SIZE: '50GB',
      MAX_CONCURRENT_REQUESTS: '100',
      LOG_LEVEL: 'INFO'
    })
    .withCloudType(CloudType.SECURE)
    .withScaling(ScalerType.QUEUE_DELAY, 4)
    .build();

  Logger.info(`Custom config: ${customConfig.gpuCount}x GPU, ${customConfig.workersMin}-${customConfig.workersMax} workers`);
  
  // Predefined configurations
  Logger.step('Available predefined configurations:');
  Object.keys(PREDEFINED_CONFIGS).forEach(preset => {
    const config = PREDEFINED_CONFIGS[preset as keyof typeof PREDEFINED_CONFIGS]('example');
    Logger.info(`${preset}: ${config.gpuCount}x GPU, ${config.workersMin}-${config.workersMax} workers, ${config.idleTimeout}min idle`);
  });
}

async function demonstratePodManagement() {
  Logger.header('Pod Management Demonstration');
  
  // Note: This requires a valid RUNPOD_API_KEY
  if (!process.env.RUNPOD_API_KEY) {
    Logger.warning('RUNPOD_API_KEY not set. Skipping pod management demo.');
    return;
  }

  try {
    const client = new RunPodClient();
    
    // Get available GPU types from RunPod
    Logger.step('Fetching available GPU types from RunPod...');
    const availableGpus = await client.getAvailableGpuTypes();
    Logger.info(`Found ${availableGpus.length} GPU types available`);
    
    // Show pricing for a specific GPU
    Logger.step('Fetching GPU pricing...');
    const pricing = await client.getGpuPricing('NVIDIA GeForce RTX 4090', 1);
    if (pricing) {
      Logger.info(`RTX 4090 pricing: $${pricing.lowestPrice?.minimumBidPrice}/hr (bid), $${pricing.lowestPrice?.uninterruptablePrice}/hr (fixed)`);
    }
    
  } catch (error) {
    Logger.error(`Pod management demo failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function demonstrateAdvancedFeatures() {
  Logger.header('Advanced Features Demonstration');
  
  // GPU filtering by memory
  Logger.step('GPUs with 40GB+ memory:');
  const highMemoryGpus = GpuMapper.getGpusByMemory(40);
  highMemoryGpus.forEach(gpu => {
    Logger.info(`  ${gpu.displayName}: ${gpu.memoryInGb}GB`);
  });
  
  // GPU filtering by cloud type
  Logger.step('GPUs available in community cloud:');
  const communityGpus = GpuMapper.getAvailableGpus('COMMUNITY');
  communityGpus.forEach(gpu => {
    Logger.info(`  ${gpu.displayName}: ${gpu.memoryInGb}GB`);
  });
  
  // GPU filtering by pool
  Logger.step('GPUs in AMPERE_80 pool:');
  const ampere80Gpus = GpuMapper.getGpusByPool(GpuPool.AMPERE_80);
  ampere80Gpus.forEach(gpu => {
    Logger.info(`  ${gpu.displayName}: ${gpu.memoryInGb}GB`);
  });
}

async function main() {
  Logger.info('🚀 Tetra-Style Pod Management SDK Demo');
  Logger.info('This demonstrates the enhanced features inspired by RunPod\'s Tetra SDK\n');
  
  try {
    await demonstrateGpuMapping();
    console.log('\n');
    
    await demonstrateResourceConfigs();
    console.log('\n');
    
    await demonstrateAdvancedFeatures();
    console.log('\n');
    
    await demonstratePodManagement();
    
    Logger.success('\n✅ Demo completed successfully!');
    Logger.info('\nTo try the actual pod management:');
    Logger.info('  export RUNPOD_API_KEY=your_api_key');
    Logger.info('  node dist/cli.js launch -i runpod/tensorflow -g RTX 4090 -c 1 -m 16');
    
  } catch (error) {
    Logger.error(`Demo failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 