# stack.yaml Schema Reference

This document describes every field supported in a RunPod stack.yaml, including type, required/optional, and usage notes.

| Field           | Type      | Required | Description |
|-----------------|-----------|----------|-------------|
| id              | string    | Yes      | Unique stack ID (lowercase, hyphens only) |
| name            | string    | Yes      | Human-readable name |
| version         | string    | Yes      | Semantic version (x.y.z) |
| description     | string    | Yes      | Short description of the stack |
| author          | string    | Yes      | Author or organization |
| containerImage  | string    | Yes      | Docker image to deploy |
| entrypoint      | array     | No       | Override container entrypoint (e.g. ["/bin/bash"]) |
| command         | array     | No       | Override container command (e.g. ["./run.sh"]) |
| workingDir      | string    | No       | Working directory inside container |
| gpu             | object    | Yes      | GPU requirements (see below) |
| memory          | number    | Yes      | System memory in GB |
| cpu             | number    | No       | CPU cores (default: 1) |
| ports           | array     | No       | Port mappings (see below) |
| env             | array     | No       | Environment variables (see below) |
| volumes         | array     | No       | Volume mounts (see below) |
| docs            | object    | Yes      | Documentation (see below) |
| secure          | object    | No       | Security settings (see below) |
| tags            | array     | No       | Tags for search/discovery |
| category        | string    | No       | Category label |
| license         | string    | No       | License type (e.g. MIT) |
| homepage        | string    | No       | Project homepage URL |
| repository      | string    | No       | Source repository URL |

## Nested Objects

### gpu
| Field     | Type    | Required | Description |
|-----------|---------|----------|-------------|
| type      | string  | Yes      | GPU type (e.g. "A100", "RTX 4090") |
| count     | number  | Yes      | Number of GPUs |
| memoryGB  | number  | No       | Minimum GPU memory (GB) |

### ports
| Field         | Type    | Required | Description |
|---------------|---------|----------|-------------|
| containerPort | number  | Yes      | Port inside container |
| exposedPort   | number  | No       | Port to expose (default: containerPort) |
| protocol      | string  | No       | "tcp" or "udp" (default: tcp) |

### env
| Field   | Type    | Required | Description |
|---------|---------|----------|-------------|
| name    | string  | Yes      | Variable name |
| value   | string  | Yes      | Variable value |
| required| bool    | No       | Mark as required for deployment |

### volumes
| Field         | Type    | Required | Description |
|---------------|---------|----------|-------------|
| containerPath | string  | Yes      | Mount path inside container |
| size          | number  | Yes      | Size in GB |
| persistent    | bool    | No       | Keep data between deployments |

### docs
| Field           | Type      | Required | Description |
|-----------------|-----------|----------|-------------|
| description     | string    | Yes      | Detailed description |
| usage           | string    | No       | Usage instructions |
| examples        | array     | No       | Example commands |
| troubleshooting | string    | No       | Troubleshooting tips |
| changelog       | string    | No       | Changelog notes |

### secure
| Field                 | Type      | Required | Description |
|-----------------------|-----------|----------|-------------|
| allowPrivileged       | bool      | No       | Allow privileged containers |
| readOnlyRootFilesystem| bool      | No       | Enforce read-only root FS |
| runAsUser             | number    | No       | Run as user ID |
| capabilities          | object    | No       | Linux capabilities (add/drop) |

---

For more examples, see the [README.md](../README.md) or the templates/ directory. 