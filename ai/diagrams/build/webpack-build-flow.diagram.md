---
diagram_id: webpack-build-flow
name: Webpack Build Flow
description: Shows how TypeScript and React source files are bundled for the extension
diagram_type: flow
feature_id: []
spec_id: [webpack]
actor_id: []
---

# Webpack Build Flow

```nomnoml
#direction: down
#padding: 10

[TypeScript Source] -> [Webpack Loader]
[Webpack Loader] -> [TypeScript Compiler]
[TypeScript Compiler] -> [JavaScript Bundle]
[JavaScript Bundle] -> [Extension Entry Point]

[Webview Source] -> [esbuild]
[esbuild] -> [React Bundle]
[React Bundle] -> [Webview Assets]
```
