const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// pnpm doesn't hoist transitive deps to root node_modules; Metro can't follow
// the virtual store chain for markdown-it's dependencies.
const markdownItDeps = path.resolve(
  __dirname,
  'node_modules/.pnpm/markdown-it@10.0.0/node_modules'
);
config.resolver.extraNodeModules = {
  argparse:       path.join(markdownItDeps, 'argparse'),
  entities:       path.join(markdownItDeps, 'entities'),
  'linkify-it':   path.join(markdownItDeps, 'linkify-it'),
  mdurl:          path.join(markdownItDeps, 'mdurl'),
  'uc.micro':     path.join(markdownItDeps, 'uc.micro'),
};

module.exports = withNativeWind(config, { input: './global.css' });
