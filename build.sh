#!/bin/bash
# Trailhead build script with cache busting
# Usage: bash build.sh

set -e

DEPLOY_DIR="deploy-v2.2"
HASH=$(date +%s | md5sum | head -c 8)
BUNDLE_NAME="trailhead-bundle.${HASH}.js"

# Remove old bundles
rm -f ${DEPLOY_DIR}/trailhead-bundle.*.js

# Build new bundle
npx esbuild entry.jsx --bundle --format=iife --loader:.jsx=jsx --minify --target=es2020 --outfile=${DEPLOY_DIR}/${BUNDLE_NAME}

# Update index.html to reference new bundle. This shell is what crawlers
# load when they hit the bare domain (/) — the api/preview function only
# kicks in for entity URLs (/trips/:slug, /forum/:sub/:slug, etc.). So the
# meta tags + JSON-LD here are the baseline SEO for the home page + any
# uncovered route. api/preview.js layers entity-specific overrides on top.
cat > ${DEPLOY_DIR}/index.html << HTMLEOF
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Trailhead — The Overlanding Community App by Lone Peak Overland</title>
<meta name="description" content="Trailhead is the social app for overlanders. Discover camping spots, share trip reports, plan trips, post your build, and connect with the overlanding community.">
<meta name="author" content="Lone Peak Overland">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
<link rel="canonical" href="https://trailhead.lonepeakoverland.com/">
<!-- Default Open Graph + Twitter card (entity-specific overrides come from api/preview.js when applicable). -->
<meta property="og:type" content="website">
<meta property="og:site_name" content="Trailhead">
<meta property="og:title" content="Trailhead — The Overlanding Community App">
<meta property="og:description" content="Discover camping spots, share trip reports, post your build, and connect with the overlanding community.">
<meta property="og:url" content="https://trailhead.lonepeakoverland.com/">
<meta property="og:image" content="https://trailhead.lonepeakoverland.com/summit-lp-logo.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Trailhead — The Overlanding Community App">
<meta name="twitter:description" content="Discover camping spots, share trip reports, post your build, and connect with the overlanding community.">
<meta name="twitter:image" content="https://trailhead.lonepeakoverland.com/summit-lp-logo.png">
<!-- PWA + iOS install support so Add-to-Home-Screen works (required for iOS web push). -->
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#BD472A">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Trailhead">
<meta name="application-name" content="Trailhead">
<link rel="apple-touch-icon" href="/summit-lp-logo.png">
<link rel="icon" type="image/png" href="/summit-lp-logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://babbgaziiyjfaqjsaxgd.supabase.co">
<!-- Non-blocking webfont load. Browser treats the stylesheet as print-only
     (skipped during first paint), then onload swaps media back to all so
     the font CSS applies. Page hits first paint with Georgia/system serif
     and swaps to Source Serif 4 when ready (display=swap). No-JS fallback
     below uses the standard blocking link. -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&display=swap"></noscript>
<!-- WebSite + Organization JSON-LD — establishes Trailhead as the publisher
     entity globally + enables Google sitelinks search box. -->
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebSite","name":"Trailhead","alternateName":"Trailhead by Lone Peak Overland","url":"https://trailhead.lonepeakoverland.com/","publisher":{"@type":"Organization","name":"Lone Peak Overland","url":"https://www.lonepeakoverland.com/","logo":{"@type":"ImageObject","url":"https://trailhead.lonepeakoverland.com/lone-peak-flag.png"}}}
</script>
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Organization","name":"Lone Peak Overland","url":"https://www.lonepeakoverland.com/","logo":"https://trailhead.lonepeakoverland.com/lone-peak-flag.png","sameAs":["https://trailhead.lonepeakoverland.com/"]}
</script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #111111; overflow-x: hidden; }
  #root { width: 100%; min-height: 100vh; }
  /* Suppress iOS Safari's auto-zoom on input focus by forcing the form
     field text size to 16px on touch devices. Inline styles in the app
     set inputs to 13-14px which trips the zoom heuristic; !important is
     required to beat per-element inline style specificity. Desktop and
     non-touch devices keep the designed font sizes. */
  @media (hover: none) and (pointer: coarse) {
    input, textarea, select { font-size: 16px !important; }
  }
</style>
<script>
window.onerror = function(msg, url, line, col, err) {
  document.getElementById("root").innerHTML = '<pre style="color:red;padding:20px;word-wrap:break-word;font-size:12px">ERROR: ' + msg + '\\nLine: ' + line + '\\n' + (err && err.stack ? err.stack : '') + '</pre>';
};
</script>
</head>
<body>
<div id="root">
  <p style="color:#999;padding:20px;font-family:sans-serif">Loading Trailhead...</p>
</div>
<script src="/${BUNDLE_NAME}"></script>
</body>
</html>
HTMLEOF

echo "Built: ${BUNDLE_NAME}"
