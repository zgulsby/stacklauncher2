import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Logger } from './utils/logger';

export interface InitOptions {
  directory: string;
}

const DEFAULT_STACK_YAML = `# RunPod Stack Configuration
# This file defines your GPU-based deployment stack for the RunPod Infrastructure Catalog

# Basic metadata
id: "my-stack"
name: "My AI Stack"
version: "1.0.0"
description: "A sample AI/ML stack for RunPod deployment"
author: "Your Name"

# Container configuration
containerImage: "your-registry/your-image:latest"
# entrypoint: ["/bin/bash"]  # Optional: Override container entrypoint
# command: ["./run.sh"]      # Optional: Override container command
# workingDir: "/workspace"   # Optional: Set working directory

# Resource requirements
gpu:
  type: "RTX 4090"    # GPU type (RTX 4090, A100, A6000, etc.)
  count: 1            # Number of GPUs
  # memoryGB: 24      # Optional: Specific GPU memory requirement

memory: 16            # System memory in GB
cpu: 4               # Optional: CPU cores (defaults to 1)

# Network configuration (optional)
ports:
  - containerPort: 8080
    exposedPort: 8080
    protocol: "tcp"
  - containerPort: 7860
    exposedPort: 7860
    protocol: "tcp"

# Environment variables (optional)
env:
  - name: "MODEL_NAME"
    value: "llama-2-7b"
    required: true
  - name: "API_KEY"
    value: "your-api-key"
    required: false

# Volume mounts (optional)
volumes:
  - containerPath: "/data"
    size: 50          # Size in GB
    persistent: true  # Keep data between deployments

# Documentation
docs:
  description: "This stack provides a ready-to-use environment for running AI/ML workloads"
  usage: |
    1. Update the containerImage to point to your Docker image
    2. Configure environment variables as needed
    3. Adjust resource requirements
    4. Test with: runpod-stack test
    5. Submit with: runpod-stack submit
  examples:
    - 'curl http://localhost:8080/predict -d "{\"prompt\": \"Hello world\"}"'
  troubleshooting: |
    Common issues:
    - Ensure your container image is publicly accessible
    - Check that all required environment variables are set
    - Verify GPU requirements match available hardware

# Security settings (optional)
secure:
  allowPrivileged: false
  readOnlyRootFilesystem: false
  # runAsUser: 1000
  # capabilities:
  #   add: ["SYS_ADMIN"]
  #   drop: ["ALL"]

# Additional metadata (optional)
tags:
  - "ai"
  - "machine-learning"
  - "pytorch"
category: "AI/ML"
license: "MIT"
homepage: "https://your-project.com"
repository: "https://github.com/your-username/your-repo"
`;

const DEFAULT_README = `# My AI Stack

This is a RunPod stack configuration for deploying AI/ML workloads.

## Quick Start

1. Update \`stack.yaml\` with your configuration:
   - Set your container image
   - Configure resources (GPU, memory, CPU)
   - Add environment variables
   - Set up port mappings

2. Validate your configuration:
   \`\`\`bash
   runpod-stack validate
   \`\`\`

3. Test deployment:
   \`\`\`bash
   runpod-stack test --dry-run  # Check what would be deployed
   runpod-stack test           # Actually deploy for testing
   \`\`\`

4. Submit to catalog:
   \`\`\`bash
   runpod-stack submit
   \`\`\`

## Configuration

See \`stack.yaml\` for detailed configuration options.

## Requirements

- Docker image hosted on a public registry
- RunPod API key (set \`RUNPOD_API_KEY\` environment variable)

## Support

For issues and questions, visit the RunPod documentation or community forums.
`;

const DEFAULT_GITIGNORE = `# Dependencies
node_modules/
*.log

# Environment files
.env
.env.local
.env.*.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# RunPod local state
.runpod/

# Build artifacts
dist/
build/
`;

export async function initCommand(name: string, options: InitOptions): Promise<void> {
  Logger.header(`Initializing Stack: ${name}`);
  
  const stackDir = join(options.directory, name);
  
  // Check if directory already exists
  if (existsSync(stackDir)) {
    Logger.error(`Directory ${stackDir} already exists`);
    throw new Error('Directory already exists');
  }

  try {
    // Create the stack directory
    Logger.step(`Creating directory: ${stackDir}`);
    mkdirSync(stackDir, { recursive: true });

    // Create stack.yaml with customized template
    const customizedYaml = DEFAULT_STACK_YAML
      .replace('"my-stack"', `"${name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}"`)
      .replace('"My AI Stack"', `"${name}"`);
    
    Logger.step('Creating stack.yaml...');
    writeFileSync(join(stackDir, 'stack.yaml'), customizedYaml);

    // Create README.md
    Logger.step('Creating README.md...');
    const customizedReadme = DEFAULT_README.replace('# My AI Stack', `# ${name}`);
    writeFileSync(join(stackDir, 'README.md'), customizedReadme);

    // Create .gitignore
    Logger.step('Creating .gitignore...');
    writeFileSync(join(stackDir, '.gitignore'), DEFAULT_GITIGNORE);

    // Create examples directory (optional)
    const examplesDir = join(stackDir, 'examples');
    mkdirSync(examplesDir);
    
    Logger.step('Creating example files...');
    writeFileSync(join(examplesDir, 'run.sh'), `#!/bin/bash
# Example startup script for your stack
echo "Starting ${name}..."

# Add your initialization commands here
# python app.py
# jupyter lab --ip=0.0.0.0 --port=8080 --allow-root
`);

    Logger.success(`Stack "${name}" initialized successfully!`);
    Logger.info(`Created in: ${stackDir}`);
    
    Logger.header('Next Steps:');
    Logger.info(`1. cd ${name}`);
    Logger.info('2. Edit stack.yaml with your configuration');
    Logger.info('3. runpod-stack validate    # Validate your config');
    Logger.info('4. runpod-stack test        # Test deployment');
    Logger.info('5. runpod-stack submit      # Submit to catalog');

  } catch (error) {
    Logger.error(`Failed to initialize stack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
} 