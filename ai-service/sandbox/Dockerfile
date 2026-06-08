# Secure Code Execution Sandbox
# Minimal image with Python and Node.js for running untrusted code

FROM python:3.11-slim-bookworm

# Install Node.js
RUN apt-get update && apt-get install -y --no-install-recommends \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for running code
RUN useradd -m -s /bin/bash -u 1000 sandbox \
    && mkdir -p /app/code \
    && chown -R sandbox:sandbox /app

# Set resource limits in profile
RUN echo "ulimit -v 256000" >> /home/sandbox/.bashrc \
    && echo "ulimit -t 10" >> /home/sandbox/.bashrc

# Install common Python packages (read-only)
RUN pip install --no-cache-dir \
    numpy \
    pandas \
    requests \
    && pip cache purge

# Set working directory
WORKDIR /app/code

# Switch to non-root user
USER sandbox

# Default command
CMD ["python3", "--version"]
