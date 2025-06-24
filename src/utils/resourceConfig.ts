import { Logger } from './logger.js';

// GPU Pool types based on RunPod's GPU groups
export enum GpuPool {
  ANY = 'ANY',
  AMPERE_16 = 'AMPERE_16',    // RTX 4000 series, A4000, etc.
  AMPERE_24 = 'AMPERE_24',    // RTX 3090, A5000, etc.
  AMPERE_48 = 'AMPERE_48',    // A6000, A40, etc.
  AMPERE_80 = 'AMPERE_80',    // A100, A100-SXM4-80GB
  ADA_24 = 'ADA_24',          // RTX 4090, RTX 4080
  ADA_48_PRO = 'ADA_48_PRO',  // RTX 6000 Ada
  ADA_80_PRO = 'ADA_80_PRO',  // L40, L40S
  HOPPER_80 = 'HOPPER_80',    // H100, H100-SXM5-80GB
  HOPPER_120 = 'HOPPER_120',  // H100-SXM5-120GB
}

// Cloud type options
export enum CloudType {
  ALL = 'ALL',
  SECURE = 'SECURE',
  COMMUNITY = 'COMMUNITY',
}

// Scaling strategy types
export enum ScalerType {
  NONE = 'NONE',
  QUEUE_DELAY = 'QUEUE_DELAY',
  QUEUE_SIZE = 'QUEUE_SIZE',
}

// Resource configuration interface
export interface ResourceConfig {
  name: string;
  gpus?: GpuPool[];
  gpuCount?: number;
  workersMin?: number;
  workersMax?: number;
  idleTimeout?: number;
  env?: Record<string, string>;
  networkVolumeId?: string;
  executionTimeoutMs?: number;
  scalerType?: ScalerType;
  scalerValue?: number;
  locations?: string[];
  cloudType?: CloudType;
  validate?: () => { valid: boolean; errors: string[] };
}

// Default configuration values
export const DEFAULT_RESOURCE_CONFIG: Partial<ResourceConfig> = {
  gpuCount: 1,
  workersMin: 0,
  workersMax: 3,
  idleTimeout: 5,
  executionTimeoutMs: 0, // No limit
  scalerType: ScalerType.QUEUE_DELAY,
  scalerValue: 4,
  cloudType: CloudType.ALL,
};

export class ResourceConfigBuilder {
  private config: ResourceConfig;

  constructor(name: string) {
    this.config = {
      name,
      ...DEFAULT_RESOURCE_CONFIG,
    };
  }

  // GPU configuration
  withGpus(gpus: GpuPool[]): ResourceConfigBuilder {
    this.config.gpus = gpus;
    return this;
  }

  withGpuCount(count: number): ResourceConfigBuilder {
    this.config.gpuCount = count;
    return this;
  }

  // Worker configuration
  withWorkers(min: number, max: number): ResourceConfigBuilder {
    this.config.workersMin = min;
    this.config.workersMax = max;
    return this;
  }

  withIdleTimeout(minutes: number): ResourceConfigBuilder {
    this.config.idleTimeout = minutes;
    return this;
  }

  // Environment and storage
  withEnvironment(env: Record<string, string>): ResourceConfigBuilder {
    this.config.env = { ...this.config.env, ...env };
    return this;
  }

  withNetworkVolume(volumeId: string): ResourceConfigBuilder {
    this.config.networkVolumeId = volumeId;
    return this;
  }

  // Execution settings
  withExecutionTimeout(ms: number): ResourceConfigBuilder {
    this.config.executionTimeoutMs = ms;
    return this;
  }

  withScaling(scalerType: ScalerType, value: number): ResourceConfigBuilder {
    this.config.scalerType = scalerType;
    this.config.scalerValue = value;
    return this;
  }

  withLocations(locations: string[]): ResourceConfigBuilder {
    this.config.locations = locations;
    return this;
  }

  withCloudType(cloudType: CloudType): ResourceConfigBuilder {
    this.config.cloudType = cloudType;
    return this;
  }

  // Build the final configuration
  build(): ResourceConfig {
    return { ...this.config };
  }

  // Validate the configuration
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.name) {
      errors.push('Name is required');
    }

    if (this.config.workersMin && this.config.workersMax && this.config.workersMin > this.config.workersMax) {
      errors.push('workersMin cannot be greater than workersMax');
    }

    if (this.config.gpuCount && this.config.gpuCount < 1) {
      errors.push('gpuCount must be at least 1');
    }

    if (this.config.idleTimeout && this.config.idleTimeout < 1) {
      errors.push('idleTimeout must be at least 1 minute');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Helper function to create resource configs
export function createResourceConfig(name: string): ResourceConfigBuilder {
  return new ResourceConfigBuilder(name);
}

// Predefined configurations for common use cases
export const PREDEFINED_CONFIGS = {
  // Development/testing configuration
  development: (name: string) => createResourceConfig(name)
    .withGpus([GpuPool.AMPERE_16])
    .withGpuCount(1)
    .withWorkers(0, 1)
    .withIdleTimeout(5)
    .withCloudType(CloudType.COMMUNITY)
    .build(),

  // Production inference configuration
  production: (name: string) => createResourceConfig(name)
    .withGpus([GpuPool.AMPERE_80, GpuPool.HOPPER_80])
    .withGpuCount(1)
    .withWorkers(1, 5)
    .withIdleTimeout(30)
    .withCloudType(CloudType.SECURE)
    .withScaling(ScalerType.QUEUE_DELAY, 4)
    .build(),

  // Training configuration
  training: (name: string) => createResourceConfig(name)
    .withGpus([GpuPool.AMPERE_80, GpuPool.HOPPER_80])
    .withGpuCount(2)
    .withWorkers(0, 2)
    .withIdleTimeout(60)
    .withCloudType(CloudType.SECURE)
    .withExecutionTimeout(3600000) // 1 hour
    .build(),

  // High-performance configuration
  highPerformance: (name: string) => createResourceConfig(name)
    .withGpus([GpuPool.HOPPER_80, GpuPool.HOPPER_120])
    .withGpuCount(4)
    .withWorkers(1, 3)
    .withIdleTimeout(15)
    .withCloudType(CloudType.SECURE)
    .withScaling(ScalerType.QUEUE_SIZE, 2)
    .build(),
}; 