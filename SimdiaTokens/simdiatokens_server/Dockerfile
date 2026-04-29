# === SimdiaTokens Backend Dockerfile (Optimized) ===
# This Dockerfile caches dependency compilation so only your code
# rebuilds on each deploy, cutting build time from 15min to 2min.

FROM rust:1.78-slim-bookworm AS builder

WORKDIR /app

# Install build deps
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Step 1: Copy ONLY Cargo files — this layer is cached until deps change
COPY Cargo.toml Cargo.lock ./

# Step 2: Build a dummy project to compile and cache ALL dependencies
# This creates a fake main.rs so cargo can resolve and build deps
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release

# Step 3: Now copy real source code — deps are already cached
COPY src ./src

# Step 4: Touch main.rs to force recompile only YOUR code, not deps
RUN touch src/main.rs && cargo build --release

# Runtime
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/simdiatokens_server ./simdiatokens_server

ENV PORT=8080
EXPOSE 8080

CMD ["./simdiatokens_server"]
