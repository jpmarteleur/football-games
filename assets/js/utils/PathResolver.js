// Path Resolver - Handles relative paths consistently
class PathResolver {
    constructor(basePath = '..') {
        this.basePath = basePath;
    }

    // Get path to assets directory
    assets(path = '') {
        return `${this.basePath}/assets/${path}`;
    }

    // Get path to data directory
    data(filename) {
        return `${this.basePath}/assets/data/${filename}`;
    }

    // Get path to CSS directory
    css(filename) {
        return `${this.basePath}/assets/css/${filename}`;
    }

    // Get path to JS directory
    js(filename) {
        return `${this.basePath}/assets/js/${filename}`;
    }

    // Get path to images directory
    images(filename) {
        return `${this.basePath}/assets/images/${filename}`;
    }

    // Set base path
    setBasePath(path) {
        this.basePath = path;
    }

    // Get base path
    getBasePath() {
        return this.basePath;
    }
}

// Create default instance
const pathResolver = new PathResolver();

