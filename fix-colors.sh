#!/bin/bash

echo "🔧 FIXING ALL WHITE BACKGROUNDS TO DARK THEME..."

# Replace all white/light backgrounds with dark equivalents
find components -name "*.tsx" -type f -exec sed -i \
  -e 's/bg-white/bg-gray-900/g' \
  -e 's/bg-gray-50/bg-black/g' \
  -e 's/bg-gray-100/bg-gray-900/g' \
  -e 's/bg-slate-50/bg-black/g' \
  -e 's/bg-slate-100/bg-gray-900/g' \
  -e 's/text-gray-900/text-gray-100/g' \
  -e 's/text-gray-800/text-gray-200/g' \
  -e 's/text-gray-700/text-gray-300/g' \
  -e 's/text-gray-600/text-gray-400/g' \
  -e 's/text-slate-900/text-slate-100/g' \
  -e 's/text-slate-800/text-slate-200/g' \
  -e 's/text-slate-700/text-slate-300/g' \
  -e 's/text-slate-600/text-slate-400/g' \
  -e 's/border-gray-200/border-gray-800/g' \
  -e 's/border-gray-300/border-gray-700/g' \
  -e 's/border-slate-200/border-slate-800/g' \
  -e 's/border-slate-300/border-slate-700/g' \
  {} \;

echo "✅ Fixed all component colors!"