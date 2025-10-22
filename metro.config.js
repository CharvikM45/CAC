const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = config.resolver.assetExts || [];
if (!config.resolver.assetExts.includes('csv')) config.resolver.assetExts.push('csv');
if (!config.resolver.assetExts.includes('tsv')) config.resolver.assetExts.push('tsv');

module.exports = config;


