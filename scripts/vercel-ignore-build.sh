#!/bin/bash

echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [[ "$VERCEL_GIT_COMMIT_REF" == "main"  ]]; then
  # Proceed with the build for the main branch
  echo "✅ - Build can proceed"
  exit 1;
else
  # Don't build for any other branch
  echo "🛑 - Build cancelled"
  exit 0;
fi
