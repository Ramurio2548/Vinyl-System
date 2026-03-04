# Use the official Rust image as a builder
FROM rust:1.80-slim as builder

# Create a new empty shell project
RUN USER=root cargo new --bin backend
WORKDIR /backend

# Copy over your manifests
COPY ./backend/Cargo.toml ./backend/Cargo.toml
COPY ./backend/Cargo.lock ./backend/Cargo.lock

# This build step will cache your dependencies
RUN cargo build --release
RUN rm src/*.rs

# Copy your source tree
COPY ./backend/src ./src
COPY ./backend/migrations ./migrations

# Build for release
RUN rm ./target/release/deps/backend*
RUN cargo build --release

# Final base image
FROM debian:bookworm-slim

# Install OpenSSL and other dependencies
RUN apt-get update && apt-get install -y libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the build artifact from the builder stage
COPY --from=builder /backend/target/release/backend .
# Copy migrations for sqlx at runtime if needed, though sqlx::migrate! embeds them
COPY --from=builder /backend/migrations ./migrations

# Expose the port
EXPOSE 3001

# Run the binary
CMD ["./backend"]
