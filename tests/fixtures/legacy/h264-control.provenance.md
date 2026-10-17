# Synthetic H264 decoder control

This is a newly derived decoder-control fixture, not an authentic fc50566a saved recording or native screen capture. It contains only synthetic colorbars from the existing committed `tests/fixtures/sample.webm` (SHA-256 `34e62f67d3d9dd50ea7fa0b76cbfe7ed568ddb4be2d6b0a63513d2a97dda95d6`). No microphone, private recording, user profile or live screen was used.

The exact bytes were generated once during external decoder validation1 using the existing pinned LGPL FFmpeg8.1.2 SDK:

```text
ffmpeg -v error -nostdin -i ../tests/fixtures/sample.webm -an -c:v h264_videotoolbox -profile:v high -pix_fmt yuv420p -b:v 2000000 ../tests/fixtures/h264-control.mp4
```

The command cwd was validation1/scratch/crates. The binary was the lead-provided SDK's bin/ffmpeg, not a GPL Homebrew build. Exact command/environment/stdout/stderr/exit0 are retained in `native-decoder-validation-1/generate-h264.{json,stdout,stderr}`. `h264-fixture-probe` confirms H264 High, yuv420p,640x480. This file was copied byte-for-byte into proposalv2; it was not re-encoded. SHA-256: `ddddd9d1df19c56772e1f6d4074e2740e1e43a109a25277d9e7d969c317fadf6`.

Purpose: the same-module pipeline_macos regression verifies that default H264 High Preview still returns actual AV_PIX_FMT_VIDEOTOOLBOX frames across5frames after the software-fallback correction. This is a hardware-retention control, separate from the authentic VP9 Profile1 gbrp regression. The two VP9 cases continue using the existing sample.webm; no authentic legacy fixture is rewritten. Native product/default GIF acceptance is a separate gate.
