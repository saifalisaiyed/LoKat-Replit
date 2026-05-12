const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.watchFolders = [__dirname];

const { BlockList } = require("metro-config");
const defaultBlockList = config.resolver.blockList || [];
const blockListArray = Array.isArray(defaultBlockList)
  ? defaultBlockList
  : [defaultBlockList];

config.resolver.blockList = [...blockListArray, /\/\.local\/.*/];

module.exports = config;
