[![build](https://github.com/zgulsby/stacklauncher2/actions/workflows/ci.yml/badge.svg)](https://github.com/zgulsby/stacklauncher2/actions)

# RunPod Stack Launcher SDK

## Purpose

**RunPod Stack Launcher SDK** is an enterprise-grade TypeScript CLI for defining, validating, testing, and submitting GPU-based deployment stacks to RunPod's infrastructure catalog. It is designed for infrastructure and ML engineers at companies like Articul8 to confidently build, validate, and publish production-ready stacks.

## Installation

```bash
npm install -g @runpod/stack-launcher-sdk
```

## CLI Usage

```bash
runpod-stack init my-stack         # Scaffold a new stack folder
runpod-stack validate              # Validate stack.yaml
runpod-stack test                  # Deploy a test pod on RunPod
runpod-stack submit                # Submit stack to RunPod catalog
```

## stack.yaml Reference

| Field           | Type      | Required | Description                                      |
|-----------------|-----------|----------|--------------------------------------------------|
| id              | string    | Yes      | Unique stack ID (lowercase, hyphens)             |
| name            | string    | Yes      | Human-readable name                              |
| version         | string    | Yes      | Semantic version (x.y.z)                         |
| description     | string    | Yes      | Short description                                |
| author          | string    | Yes      | Author or organization                           |
| containerImage  | string    | Yes      | Docker image to deploy                           |
| gpu             | object    | Yes      | GPU requirements (type, count, memoryGB)         |
| memory          | number    | Yes      | System memory (GB)                               |
| cpu             | number    | No       | CPU cores                                        |
| ports           | array     | No       | Port mappings                                    |
| env             | array     | No       | Environment variables                            |
| volumes         | array     | No       | Volume mounts                                    |
| docs            | object    | Yes      | Documentation (usage, examples, troubleshooting)  |
| secure          | object    | No       | Security settings                                |
| tags            | array     | No       | Tags for search                                  |
| category        | string    | No       | Category label                                   |
| license         | string    | No       | License type                                     |
| homepage        | string    | No       | Project homepage                                 |
| repository      | string    | No       | Source repository URL                            |

See [docs/STACK_SCHEMA.md](docs/STACK_SCHEMA.md) for full details.

---

For contributing, coding standards, and test instructions, see [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## 🚀 Features

### Core Functionality
- **Stack Definition**: Define GPU-based deployment stacks using YAML configuration
- **Validation**: Comprehensive schema validation using Zod
- **Testing**: Deploy and test stacks on RunPod infrastructure
- **Submission**: Submit validated stacks to the RunPod catalog

### Tetra-Inspired Enhancements
- **Resource Configuration Classes**: Structured resource management with builder pattern
- **GPU Pool Management**: Advanced GPU type mapping and validation
- **Predefined Configurations**: Ready-to-use resource presets (development, production, training, highPerformance)
- **Environment Variable Management**: Sophisticated environment configuration
- **Execution Timeout Management**: Better timeout handling for long-running workloads
- **Network Volume Support**: Persistent storage management
- **GPU Pricing Integration**: Real-time pricing information from RunPod

## 📦 Installation

```bash
npm install @runpod/stack-launcher-sdk
```

Or install globally:
```bash
npm install -g @runpod/stack-launcher-sdk
```

## 🔧 Setup

1. **Get RunPod API Key**: Sign up at [RunPod.io](https://runpod.io) and get your API key
2. **Set Environment Variable**:
   ```bash
   export RUNPOD_API_KEY=your_api_key_here
   ```

## 📖 Usage

### Basic Commands

```bash
# Initialize a new stack
runpod-stack init my-ai-stack

# Validate stack configuration
runpod-stack validate

# Test deployment (dry run)
runpod-stack test --dry-run

# Test deployment (actual)
runpod-stack test

# Submit to catalog
runpod-stack submit
```

### Tetra-Style Pod Management

```bash
# Launch pod with resource configuration
runpod-stack launch -i runpod/tensorflow -g RTX 4090 -c 1 -m 16

# Use predefined configurations
runpod-stack launch -i runpod/pytorch -p production -g A100 -c 2 -m 64

# Terminate a pod
runpod-stack terminate <pod-id>
```

### Advanced Resource Configuration

```typescript
import { createResourceConfig, GpuPool, CloudType } from '@runpod/stack-launcher-sdk';

// Custom configuration
const config = createResourceConfig('my-pod')
  .withGpus([GpuPool.AMPERE_80, GpuPool.HOPPER_80])
  .withGpuCount(2)
  .withWorkers(1, 3)
  .withIdleTimeout(30)
  .withEnvironment({
    MODEL_CACHE_SIZE: '50GB',
    MAX_CONCURRENT_REQUESTS: '100'
  })
  .withCloudType(CloudType.SECURE)
  .build();
```

## 🏗️ Stack Configuration

### Basic Stack Example

```yaml
# stack.yaml
id: "my-ai-stack"
name: "My AI Stack"
version: "1.0.0"
description: "A sample AI/ML stack for RunPod deployment"
author: "Your Name"

# Container configuration
containerImage: "your-registry/your-image:latest"

# Resource requirements
gpu:
  type: "RTX 4090"
  count: 1
  memoryGB: 24

memory: 16
cpu: 4

# Network configuration
ports:
  - containerPort: 8080
    exposedPort: 8080
    protocol: "tcp"

# Environment variables
env:
  - name: "MODEL_NAME"
    value: "llama-2-7b"
    required: true

# Documentation
docs:
  description: "This stack provides a ready-to-use environment for running AI/ML workloads"
  usage: |
    1. Update the containerImage to point to your Docker image
    2. Configure environment variables as needed
    3. Test with: runpod-stack test
```

### Advanced Stack with Tetra Features

```yaml
# advanced-stack.yaml
id: "enterprise-ai-platform"
name: "Enterprise AI Platform"
version: "2.1.0"
description: "Enterprise-grade AI platform with advanced features"
author: "Your Organization"

containerImage: "your-org/ai-platform:v2.1.0"
entrypoint: ["/opt/platform/start.sh"]
workingDir: "/workspace"

# High-performance resources
gpu:
  type: "A100"
  count: 2
  memoryGB: 80

memory: 128
cpu: 16

# Multiple ports for different services
ports:
  - containerPort: 8080  # API
    exposedPort: 8080
    protocol: "tcp"
  - containerPort: 8443  # HTTPS
    exposedPort: 8443
    protocol: "tcp"
  - containerPort: 6006  # TensorBoard
    exposedPort: 6006
    protocol: "tcp"

# Comprehensive environment configuration
env:
  - name: "LICENSE_KEY"
    value: ""
    required: true
  - name: "MODEL_CACHE_SIZE"
    value: "50GB"
    required: false
  - name: "MAX_CONCURRENT_REQUESTS"
    value: "100"
    required: false
  - name: "ENABLE_FINE_TUNING"
    value: "true"
    required: false

# Persistent storage
volumes:
  - containerPath: "/data/models"
    size: 500
    persistent: true
  - containerPath: "/data/datasets"
    size: 200
    persistent: true

# Security settings
secure:
  allowPrivileged: false
  readOnlyRootFilesystem: false
  runAsUser: 1000

# Documentation
docs:
  description: "Enterprise AI platform with LLM inference, fine-tuning, and model management"
  usage: |
    1. Set your LICENSE_KEY environment variable
    2. Configure model cache size as needed
    3. Access API at http://localhost:8080
    4. Monitor with TensorBoard at http://localhost:6006
  examples:
    - 'curl http://localhost:8080/predict -d "{"prompt": "Hello world"}"'
  troubleshooting: |
    Common issues:
    - Ensure LICENSE_KEY is set
    - Check GPU memory requirements
    - Verify port availability
```

## 🔧 GPU Support

### Supported GPU Types

| GPU Type | Memory | Pool | Secure Cloud | Community Cloud |
|----------|--------|------|--------------|-----------------|
| RTX 4090 | 24GB | ADA_24 | ❌ | ✅ |
| RTX 4080 | 16GB | ADA_24 | ❌ | ✅ |
| RTX 3090 | 24GB | AMPERE_24 | ❌ | ✅ |
| A100 | 40GB | AMPERE_80 | ✅ | ❌ |
| A100-80GB | 80GB | AMPERE_80 | ✅ | ❌ |
| H100 | 80GB | HOPPER_80 | ✅ | ❌ |
| H100-120GB | 120GB | HOPPER_120 | ✅ | ❌ |
| L40 | 48GB | ADA_48_PRO | ✅ | ❌ |

### GPU Validation

The SDK automatically validates GPU requirements:

```bash
# This will fail validation
gpu:
  type: "RTX 4090"
  memoryGB: 30  # RTX 4090 only has 24GB
```

## 🎯 Predefined Configurations

### Development
- **GPU**: RTX 4000 series
- **Workers**: 0-1
- **Idle Timeout**: 5 minutes
- **Cloud**: Community

### Production
- **GPU**: A100, H100
- **Workers**: 1-5
- **Idle Timeout**: 30 minutes
- **Cloud**: Secure
- **Scaling**: Queue delay-based

### Training
- **GPU**: A100, H100
- **GPU Count**: 2+
- **Workers**: 0-2
- **Idle Timeout**: 60 minutes
- **Execution Timeout**: 1 hour

### High Performance
- **GPU**: H100 series
- **GPU Count**: 4+
- **Workers**: 1-3
- **Idle Timeout**: 15 minutes
- **Scaling**: Queue size-based

## 🔍 Examples

### Basic Usage

```bash
# Initialize a new stack
runpod-stack init my-project
cd my-project

# Edit stack.yaml with your configuration
# ...

# Validate
runpod-stack validate

# Test (dry run)
runpod-stack test --dry-run

# Test (actual deployment)
runpod-stack test

# Submit to catalog
runpod-stack submit
```

### Tetra-Style Pod Management

```bash
# Launch with custom configuration
runpod-stack launch \
  -i runpod/tensorflow \
  -n my-tensorflow-pod \
  -g RTX 4090 \
  -c 1 \
  -m 16 \
  -p development

# Launch production workload
runpod-stack launch \
  -i your-org/ai-model \
  -n production-inference \
  -g A100 \
  -c 2 \
  -m 64 \
  -p production

# Terminate when done
runpod-stack terminate <pod-id>
```

### Programmatic Usage

```typescript
import { RunPodClient, GpuMapper, createResourceConfig } from '@runpod/stack-launcher-sdk';

// Initialize client
const client = new RunPodClient();

// Validate GPU requirements
const validation = GpuMapper.validateGpuRequirements('RTX 4090', 20);
if (!validation.valid) {
  console.error('GPU validation failed:', validation.errors);
}

// Create resource configuration
const config = createResourceConfig('my-pod')
  .withGpus(['AMPERE_80'])
  .withGpuCount(1)
  .withWorkers(1, 3)
  .withEnvironment({ MODEL_PATH: '/models/llama' })
  .build();

// Launch pod
const podInfo = await client.launchPodFromResourceConfig(config, 'runpod/tensorflow');
console.log('Pod launched:', podInfo.id);

// Get pricing information
const pricing = await client.getGpuPricing('NVIDIA GeForce RTX 4090', 1);
console.log('Pricing:', pricing);
```

## 🛠️ Development

### Building from Source

```bash
git clone https://github.com/your-org/stack-launcher-sdk.git
cd stack-launcher-sdk
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Running Examples

```bash
# Run the Tetra-style demo
node examples/tetra-style-example.ts

# Test with your API key
export RUNPOD_API_KEY=your_key
node dist/cli.js launch -i runpod/tensorflow -g RTX 4090
```

## 📚 API Reference

### Core Classes

#### `RunPodClient`
Main client for interacting with RunPod API.

```typescript
const client = new RunPodClient(apiKey?: string);

// Launch pod from stack
await client.launchPodFromStack(stack: StackConfig, testName?: string);

// Launch pod with resource config
await client.launchPodFromResourceConfig(config: ResourceConfig, image: string);

// Get pod information
await client.getPodInfo(podId: string);

// Terminate pod
await client.terminatePod(podId: string);

// Get available GPU types
await client.getAvailableGpuTypes();

// Get GPU pricing
await client.getGpuPricing(gpuTypeId: string, gpuCount: number);
```

#### `GpuMapper`
Utility for GPU type mapping and validation.

```typescript
// Map GPU type to RunPod ID
GpuMapper.mapGpuType('RTX 4090'); // Returns 'NVIDIA GeForce RTX 4090'

// Get GPU information
GpuMapper.getGpuInfo('A100');

// Validate requirements
GpuMapper.validateGpuRequirements('RTX 4090', 30);

// Filter GPUs
GpuMapper.getGpusByMemory(40);
GpuMapper.getAvailableGpus('COMMUNITY');
GpuMapper.getGpusByPool(GpuPool.AMPERE_80);
```

#### `ResourceConfigBuilder`
Builder pattern for creating resource configurations.

```typescript
const config = createResourceConfig('my-pod')
  .withGpus([GpuPool.AMPERE_80])
  .withGpuCount(2)
  .withWorkers(1, 3)
  .withIdleTimeout(30)
  .withEnvironment({ KEY: 'value' })
  .withCloudType(CloudType.SECURE)
  .withScaling(ScalerType.QUEUE_DELAY, 4)
  .build();
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [RunPod's Tetra SDK](https://github.com/runpod/tetra-rp)
- Built with TypeScript, Commander.js, and Zod
- Powered by RunPod's GPU infrastructure

## 📞 Support

- Documentation: [docs.runpod.io](https://docs.runpod.io)
- Community: [discord.gg/runpod](https://discord.gg/runpod)
- Issues: [GitHub Issues](https://github.com/your-org/stack-launcher-sdk/issues) 