#!/bin/bash
set -e

echo "🚀 Starting Articul8 AI Platform..."

# Check license key
if [ -z "$ARTICUL8_LICENSE_KEY" ]; then
    echo "❌ Error: ARTICUL8_LICENSE_KEY environment variable is required"
    echo "Please set your license key before starting the platform"
    exit 1
fi

echo "✅ License key found"

# Create necessary directories
mkdir -p /data/models /data/datasets /logs /workspace

# Set permissions
chown -R articul8:articul8 /data /logs /workspace

# Initialize model cache
echo "📦 Initializing model cache..."
python /opt/articul8/scripts/init_models.py

# Start monitoring services
echo "📊 Starting monitoring services..."
/opt/articul8/bin/start-monitoring.sh &

# Start the main platform
echo "🎯 Starting AI platform services..."
exec /opt/articul8/bin/platform-server \
    --config /opt/articul8/config/production.yaml \
    --license-key "$ARTICUL8_LICENSE_KEY" \
    --bind 0.0.0.0:8080 \
    --ssl-bind 0.0.0.0:8443 \
    --workers 4 \
    --log-level "${LOG_LEVEL:-INFO}" 