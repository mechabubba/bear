/**
 * This file includes a set of timed caches that can be used under certain conditions.
 * - TimedCache is a simple timed cache that checks if the element should be returned on `get`.
 * - TimedIntervalCache is an alternate version of TimedCache that periodically checks if any contained elements are "stale" and should be removed.
 */

/**
 * TimedIntervalCache is an alternate version of TimedCache that periodically checks if any contained elements are "stale" and should be removed.
 */
class TimedIntervalCache {
    constructor(options = {}) {
        this.options = {};
        this.options.tts = options.tts ?? 900000;  // Def: 15m
        this.options.poll = options.poll ?? 60000; // Def: 60s

        this.data = {};
        this.interval = setInterval(() => {
            for (const key in this.data) {
                const val = this.data[key];
                if (Date.now() > val.timeout) {
                    this.remove(key);
                }
            }
        }, this.options.poll);
    }

    get(key) {
        return this.data[key]?.val;
    }

    getTimeout(key) {
        return this.data[key]?.timeout;
    }

    set(key, val) {
        this.data[key] = {
            val,
            timeout: Date.now() + this.options.tts,
        };
    }

    remove(key) {
        delete this.data[key];
    }

    has(key) {
        return key in this.data;
    }
}

/**
 * TimedCache is a simple timed cache that checks if the element should be returned on `get`.
 */
class TimedCache {
    constructor(options = {}) {
        this.options = {};
        this.options.tts = options.tts ?? 900000;
        this.data = {};
    }

    get(key) {
        if (this.has(key)) return this.data[key].val;
    }

    getTimeout(key) {
        if (this.has(key)) return this.data[key].timeout;
    }

    set(key, val) {
        this.data[key] = {
            val,
            timeout: Date.now() + this.options.tts,
        };
    }

    remove(key) {
        delete this.data[key];
    }

    has(key) {
        if (!(key in this.data)) return false;
        if (Date.now() > this.data[key].timeout) {
            this.remove(key);
            return false;
        }
        return true;
    }
}

/**
 * CircularBuffer acts as a buffer that rolls around itself. Oldest data gets recycled.
 */
class CircularBuffer {
    constructor(length, options = {}) {
        this.length = length;
        this.options = options;

        this.rIndex = 0;
        this.wIndex = 0;

        this.data = [];
    }

    get() {
        if (this.isEmpty())
            return null;
        let data = this.data[this.rIndex++];
        this.rIndex = this.rIndex % this.length;
        return data
    }

    put(data, override = false) {
        if (this.isFull()) {
            // If overridden, read index could inadvertantly be "overlapped". This is indicative by a "false" return code.
            // Work with caution!
            if (!override) return false;
        }
        this.data[this.wIndex++] = data;
        this.wIndex = this.wIndex % this.length;
        return true;
    }

    isFull() {
        return (this.data.length == this.length ? true : false);
    }

    isEmpty() {
        return (this.data.length ? false : true);
    }
}

module.exports = { TimedCache, TimedIntervalCache, CircularBuffer };
