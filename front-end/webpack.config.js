const path = require('path');

module.exports = {
  // ... other webpack config
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    }
  }
}; 