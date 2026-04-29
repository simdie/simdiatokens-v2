# === SimdiaTokens Backend Dockerfile ===
FROM rust:1.78-slim-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN apt-get update && apt-get install -y pkg-config libssl-dev
RUN cargo build --release

# Runtime
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/simdiatokens_server ./simdiatokens_server

ENV PORT=8080
EXPOSE 8080

CMD ["./simdiatokens_server"]
