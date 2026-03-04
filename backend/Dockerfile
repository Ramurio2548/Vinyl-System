# Use the full Rust image (based on Debian 12 Bookworm) to ensure all build tools are available
FROM rust:1.91-bookworm as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a new empty shell project
RUN USER=root cargo new --bin backend
WORKDIR /backend

# Copy over your manifests from the correct context path
COPY ./backend/Cargo.toml ./Cargo.toml
COPY ./backend/Cargo.lock ./Cargo.lock

# Set SQLX_OFFLINE to true to skip DB checks during compilation
ENV SQLX_OFFLINE=true

# This build step will cache your dependencies
RUN cargo build --release
RUN rm src/*.rs

# Copy your source tree
COPY ./backend/src ./src
COPY ./backend/migrations ./migrations

# Build for release
RUN rm -f ./target/release/deps/backend*
RUN cargo build --release

# Final base image (keep slim for the runtime)
FROM debian:bookworm-slim

# Install OpenSSL and other essentials for runtime
RUN apt-get update && apt-get install -y \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy the build artifact from the builder stage
COPY --from=builder /backend/target/release/backend .
COPY --from=builder /backend/migrations ./migrations

# Expose the port (Render handles PORT env var)
EXPOSE 10000

# Run the binary
CMD ["./backend"]
