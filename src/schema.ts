import { z } from 'zod';

// Port mapping schema
const PortSchema = z.object({
  containerPort: z.number().int().min(1).max(65535),
  exposedPort: z.number().int().min(1).max(65535).optional(),
  protocol: z.enum(['tcp', 'udp']).default('tcp'),
});

// Environment variable schema
const EnvVarSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
  required: z.boolean().default(false),
});

// GPU requirements schema
const GpuSchema = z.object({
  type: z.string().min(1), // e.g., "NVIDIA GeForce RTX 4090", "A100"
  count: z.number().int().min(1).default(1),
  memoryGB: z.number().min(1).optional(),
});

// Volume mount schema
const VolumeSchema = z.object({
  containerPath: z.string().min(1),
  size: z.number().min(1), // Size in GB
  persistent: z.boolean().default(false),
});

// Documentation schema
const DocsSchema = z.object({
  description: z.string().min(1),
  usage: z.string().optional(),
  examples: z.array(z.string()).optional(),
  troubleshooting: z.string().optional(),
  changelog: z.string().optional(),
});

// Security configuration schema
const SecuritySchema = z.object({
  allowPrivileged: z.boolean().default(false),
  readOnlyRootFilesystem: z.boolean().default(false),
  runAsUser: z.number().int().min(0).optional(),
  capabilities: z.object({
    add: z.array(z.string()).optional(),
    drop: z.array(z.string()).optional(),
  }).optional(),
});

// Main stack schema
export const StackSchema = z.object({
  // Basic metadata
  id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'ID must contain only lowercase letters, numbers, and hyphens'),
  name: z.string().min(1),
  version: z.string().min(1).regex(/^\d+\.\d+\.\d+$/, 'Version must follow semantic versioning (x.y.z)'),
  description: z.string().min(1),
  author: z.string().min(1),
  
  // Container configuration
  containerImage: z.string().min(1),
  entrypoint: z.array(z.string()).optional(),
  command: z.array(z.string()).optional(),
  workingDir: z.string().optional(),
  
  // Resource requirements
  gpu: GpuSchema,
  memory: z.number().min(1), // Memory in GB
  cpu: z.number().min(0.1).optional(), // CPU cores
  
  // Networking
  ports: z.array(PortSchema).optional(),
  
  // Environment and configuration
  env: z.array(EnvVarSchema).optional(),
  volumes: z.array(VolumeSchema).optional(),
  
  // Documentation and metadata
  docs: DocsSchema,
  
  // Security settings
  secure: SecuritySchema.optional(),
  
  // Additional metadata
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
});

export type StackConfig = z.infer<typeof StackSchema>;

// Validation helper function
export function validateStack(data: unknown): { success: true; data: StackConfig } | { success: false; errors: string[] } {
  const result = StackSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
  
  return { success: false, errors };
} 