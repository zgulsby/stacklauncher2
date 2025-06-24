# my-ai-stack

This is a RunPod stack configuration for deploying AI/ML workloads.

## Quick Start

1. Update `stack.yaml` with your configuration:
   - Set your container image
   - Configure resources (GPU, memory, CPU)
   - Add environment variables
   - Set up port mappings

2. Validate your configuration:
   ```bash
   runpod-stack validate
   ```

3. Test deployment:
   ```bash
   runpod-stack test --dry-run  # Check what would be deployed
   runpod-stack test           # Actually deploy for testing
   ```

4. Submit to catalog:
   ```bash
   runpod-stack submit
   ```

## Configuration

See `stack.yaml` for detailed configuration options.

## Requirements

- Docker image hosted on a public registry
- RunPod API key (set `RUNPOD_API_KEY` environment variable)

## Support

For issues and questions, visit the RunPod documentation or community forums.
