# SimdiaTokens Backend — Single-stage build
# Proven working on Railway. Build is slow but reliable.

FROM rust:slim-bookworm

WORKDIR /app

# Install build + runtime deps
RUN apt-get update && apt-get install -y pkg-config libssl-dev ca-certificates libssl3 sqlite3 && rm -rf /var/lib/apt/lists/*

# Copy source (respects .dockerignore)
COPY . .

# Build
RUN cargo build --release

ENV PORT=8080
EXPOSE 8080

CMD ["./target/release/simdiatokens_server"]
