#!/bin/bash

# Build and push script for rc-admin Docker image
# Usage: ./docker-build.sh [tag] [registry]

set -e

# Default values
DEFAULT_TAG="latest"
DEFAULT_REGISTRY="snt1"
PROJECT_NAME="rc-manager-ui"

# Parse arguments
TAG=${1:-$DEFAULT_TAG}
REGISTRY=${2:-$DEFAULT_REGISTRY}

# Full image name
IMAGE_NAME="$REGISTRY/$PROJECT_NAME:$TAG"

echo "Building Docker image: $IMAGE_NAME"

# Build the Docker image
docker build -t $IMAGE_NAME .

echo "Build completed successfully!"

# Ask for push confirmation
read -p "Do you want to push the image to registry? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Pushing image to registry..."
    docker push $IMAGE_NAME
    echo "Image pushed successfully!"
    
    # Display useful information
    echo ""
    echo "Image Information:"
    echo "   Name: $IMAGE_NAME"
    echo "   Size: $(docker images $IMAGE_NAME --format 'table {{.Size}}' | tail -n 1)"
    echo ""
    echo "To run this container:"
    echo "   docker run -p 3000:8080 $IMAGE_NAME"
    echo ""
    echo "Docker Compose:"
    echo "   docker-compose up -d"
else
    echo "Skipping push to registry"
    echo ""
    echo "To run locally:"
    echo "   docker run -p 3000:8080 $IMAGE_NAME"
fi

echo ""
echo "Build process completed!"