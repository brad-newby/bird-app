# Use an official Python runtime as the base image
FROM python:3.12-slim

# Set the working directory in the container to /app
WORKDIR /app

# Copy the current directory (our Flask app) into the container at /app
COPY . /app

# Install Flask and other dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Run the command to start the Flask app
CMD ["flask", "run", "-u", "--host=0.0.0.0", "--port=8080"]