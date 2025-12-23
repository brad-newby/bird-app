# Use an official Python runtime as a parent image, using a slim version for a smaller image size
FROM python:3.11-slim as base

# Set the working directory to /app
WORKDIR /app

# Set environment variables to prevent Python from writing pyc files to disc
# and to ensure stdout and stderr are unbuffered
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy the requirements.txt file into the container's working directory
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source code into the container
COPY . .

# Expose port 8000 (or 5000 if using flask run directly)
EXPOSE 8000

# Define the command to run the application using Gunicorn (recommended for production)
CMD ["flask", "--app", "app", "run"]

# Alternatively, for local development using the Flask development server:
# CMD ["python", "app.py"]
