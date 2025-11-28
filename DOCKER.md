# RC Admin - Docker Setup

This repository includes Docker configuration for containerizing the React application.

## Files Created

- **Dockerfile**: Multi-stage build with Node.js for building and Nginx for serving
- **nginx.conf**: Nginx configuration with React Router support and security headers
- **.dockerignore**: Excludes unnecessary files from Docker build context
- **docker-compose.yml**: Docker Compose configuration for local development
- **docker-build.sh**: Automated build and push script

## Quick Start

### Using Docker Compose (Recommended)
```bash
# Build and run the application
docker-compose up -d

# Access the application at http://localhost:3000
```

### Using Docker directly
```bash
# Build the image
docker build -t rc-admin .

# Run the container
docker run -p 3000:80 rc-admin
```

### Using the build script
```bash
# Build with default settings
./docker-build.sh

# Build with custom tag
./docker-build.sh v1.0.0

# Build and specify registry
./docker-build.sh v1.0.0 your-registry.com
```

## Production Deployment

1. Update the registry URL in `docker-build.sh`
2. Run the build script: `./docker-build.sh v1.0.0`
3. Deploy using your container orchestration platform

## Environment Variables

The application supports the following environment variables:

- `VITE_API_BASE_URL`: Backend API URL (defaults to http://4.240.119.167)

To use custom environment variables, create a `.env` file or pass them to the Docker container:

```bash
docker run -p 3000:4173 -e VITE_API_BASE_URL=https://your-api.com rc-admin
```

## Features

- ✅ Single-stage Node.js build
- ✅ Vite preview server for serving built files
- ✅ Production-ready configuration
- ✅ Docker Compose for local development
- ✅ Automated build and push script