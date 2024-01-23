# Use an official Node.js runtime as the base image
FROM node:20

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv

# Create a Python virtual environment
RUN python3 -m venv /opt/venv

# Activate virtual environment and install packages
RUN . /opt/venv/bin/activate && pip3 install --no-cache-dir \
    tensorflow \
    tensorflow-hub \
    numpy \
    matplotlib \
    IPython \
    scipy \
    json5

# Install FFmpeg
RUN apt update \
    && apt install ffmpeg -y

# Set the working directory inside the container
WORKDIR /app

# Install project dependencies
# RUN npm install

# Build the React app
# RUN npm run build

# Expose the port that the React app will run on
# EXPOSE 3000

# Set the command to start the React app
# CMD ["npm", "run", "dev"]
