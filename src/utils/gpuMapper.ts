import { GpuPool } from './resourceConfig.js';

// GPU type mapping based on RunPod's GPU types
export interface GpuTypeInfo {
  id: string;
  displayName: string;
  memoryInGb: number;
  pool: GpuPool;
  secureCloud: boolean;
  communityCloud: boolean;
}

export const GPU_TYPES: Record<string, GpuTypeInfo> = {
  // RTX 4000 series
  'RTX 4090': {
    id: 'NVIDIA GeForce RTX 4090',
    displayName: 'RTX 4090',
    memoryInGb: 24,
    pool: GpuPool.ADA_24,
    secureCloud: false,
    communityCloud: true,
  },
  'RTX 4080': {
    id: 'NVIDIA GeForce RTX 4080',
    displayName: 'RTX 4080',
    memoryInGb: 16,
    pool: GpuPool.ADA_24,
    secureCloud: false,
    communityCloud: true,
  },
  'RTX 3090': {
    id: 'NVIDIA GeForce RTX 3090',
    displayName: 'RTX 3090',
    memoryInGb: 24,
    pool: GpuPool.AMPERE_24,
    secureCloud: false,
    communityCloud: true,
  },
  'RTX 3080': {
    id: 'NVIDIA GeForce RTX 3080',
    displayName: 'RTX 3080',
    memoryInGb: 10,
    pool: GpuPool.AMPERE_16,
    secureCloud: false,
    communityCloud: true,
  },

  // Professional GPUs
  'A100': {
    id: 'NVIDIA A100-SXM4-40GB',
    displayName: 'A100',
    memoryInGb: 40,
    pool: GpuPool.AMPERE_80,
    secureCloud: true,
    communityCloud: false,
  },
  'A100-80GB': {
    id: 'NVIDIA A100-SXM4-80GB',
    displayName: 'A100-80GB',
    memoryInGb: 80,
    pool: GpuPool.AMPERE_80,
    secureCloud: true,
    communityCloud: false,
  },
  'A6000': {
    id: 'NVIDIA RTX A6000',
    displayName: 'RTX A6000',
    memoryInGb: 48,
    pool: GpuPool.AMPERE_48,
    secureCloud: true,
    communityCloud: false,
  },
  'A5000': {
    id: 'NVIDIA RTX A5000',
    displayName: 'RTX A5000',
    memoryInGb: 24,
    pool: GpuPool.AMPERE_24,
    secureCloud: true,
    communityCloud: false,
  },
  'A4000': {
    id: 'NVIDIA RTX A4000',
    displayName: 'RTX A4000',
    memoryInGb: 16,
    pool: GpuPool.AMPERE_16,
    secureCloud: true,
    communityCloud: false,
  },

  // H100 series
  'H100': {
    id: 'NVIDIA H100-SXM5-80GB',
    displayName: 'H100',
    memoryInGb: 80,
    pool: GpuPool.HOPPER_80,
    secureCloud: true,
    communityCloud: false,
  },
  'H100-120GB': {
    id: 'NVIDIA H100-SXM5-120GB',
    displayName: 'H100-120GB',
    memoryInGb: 120,
    pool: GpuPool.HOPPER_120,
    secureCloud: true,
    communityCloud: false,
  },

  // L40 series
  'L40': {
    id: 'NVIDIA L40',
    displayName: 'L40',
    memoryInGb: 48,
    pool: GpuPool.ADA_48_PRO,
    secureCloud: true,
    communityCloud: false,
  },
  'L40S': {
    id: 'NVIDIA L40S',
    displayName: 'L40S',
    memoryInGb: 48,
    pool: GpuPool.ADA_48_PRO,
    secureCloud: true,
    communityCloud: false,
  },

  // Legacy GPUs
  'V100': {
    id: 'Tesla V100-SXM2-16GB',
    displayName: 'V100',
    memoryInGb: 16,
    pool: GpuPool.AMPERE_16,
    secureCloud: true,
    communityCloud: false,
  },
  'V100-32GB': {
    id: 'Tesla V100-SXM2-32GB',
    displayName: 'V100-32GB',
    memoryInGb: 32,
    pool: GpuPool.AMPERE_24,
    secureCloud: true,
    communityCloud: false,
  },
};

export class GpuMapper {
  /**
   * Map a user-friendly GPU name to RunPod's GPU type ID
   */
  static mapGpuType(gpuType: string): string {
    const normalizedType = gpuType.trim();
    
    // Direct match
    if (GPU_TYPES[normalizedType]) {
      return GPU_TYPES[normalizedType].id;
    }

    // Case-insensitive match
    const lowerType = normalizedType.toLowerCase();
    for (const [key, info] of Object.entries(GPU_TYPES)) {
      if (key.toLowerCase() === lowerType || info.displayName.toLowerCase() === lowerType) {
        return info.id;
      }
    }

    // Partial match (e.g., "4090" matches "RTX 4090")
    for (const [key, info] of Object.entries(GPU_TYPES)) {
      if (key.toLowerCase().includes(lowerType) || info.displayName.toLowerCase().includes(lowerType)) {
        return info.id;
      }
    }

    // Return the original string if no match found
    return normalizedType;
  }

  /**
   * Get GPU information by type
   */
  static getGpuInfo(gpuType: string): GpuTypeInfo | null {
    const normalizedType = gpuType.trim();
    
    if (GPU_TYPES[normalizedType]) {
      return GPU_TYPES[normalizedType];
    }

    const lowerType = normalizedType.toLowerCase();
    for (const [key, info] of Object.entries(GPU_TYPES)) {
      if (key.toLowerCase() === lowerType || info.displayName.toLowerCase() === lowerType) {
        return info;
      }
    }

    return null;
  }

  /**
   * Get available GPU types for a specific cloud type
   */
  static getAvailableGpus(cloudType: 'SECURE' | 'COMMUNITY' | 'ALL' = 'ALL'): GpuTypeInfo[] {
    return Object.values(GPU_TYPES).filter(gpu => {
      if (cloudType === 'ALL') return true;
      if (cloudType === 'SECURE') return gpu.secureCloud;
      if (cloudType === 'COMMUNITY') return gpu.communityCloud;
      return false;
    });
  }

  /**
   * Get GPU types by memory requirement
   */
  static getGpusByMemory(minMemoryGb: number, maxMemoryGb?: number): GpuTypeInfo[] {
    return Object.values(GPU_TYPES).filter(gpu => {
      if (maxMemoryGb) {
        return gpu.memoryInGb >= minMemoryGb && gpu.memoryInGb <= maxMemoryGb;
      }
      return gpu.memoryInGb >= minMemoryGb;
    });
  }

  /**
   * Get GPU types by pool
   */
  static getGpusByPool(pool: GpuPool): GpuTypeInfo[] {
    return Object.values(GPU_TYPES).filter(gpu => gpu.pool === pool);
  }

  /**
   * Validate GPU type and requirements
   */
  static validateGpuRequirements(gpuType: string, requiredMemoryGb?: number): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const gpuInfo = this.getGpuInfo(gpuType);

    if (!gpuInfo) {
      errors.push(`Unknown GPU type: ${gpuType}`);
      return { valid: false, errors };
    }

    if (requiredMemoryGb && gpuInfo.memoryInGb < requiredMemoryGb) {
      errors.push(`GPU ${gpuInfo.displayName} has ${gpuInfo.memoryInGb}GB memory, but ${requiredMemoryGb}GB is required`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
} 