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

// Health check schema
const HealthCheckSchema = z.object({
  path: z.string().min(1), // URL path to check container readiness
  timeoutSeconds: z.number().int().min(1).max(300).default(30), // max wait for readiness
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
  
  // Enterprise-specific metadata
  logo: z.string().url().optional(), // public image URL
  docsUrl: z.string().url().optional(), // documentation URL
  maintainer: z.string().min(1).optional(), // org or user who maintains the stack
  
  // Enterprise deployment options
  secureCloud: z.boolean().default(false), // whether the pod must run in secure cloud
  network: z.enum(['public', 'private']).optional(), // required if secureCloud is true
  
  // Health check configuration
  healthcheck: HealthCheckSchema.optional(),
  
  // Additional metadata
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  license: z.string().optional(),
  homepage: z.string().url().optional(),
  repository: z.string().url().optional(),
}).refine((data) => {
  // If secureCloud is true, network must be specified
  if (data.secureCloud && !data.network) {
    return false;
  }
  return true;
}, {
  message: "Network type must be specified when secureCloud is true",
  path: ["network"]
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