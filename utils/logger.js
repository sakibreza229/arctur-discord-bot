function info(msg) {
    console.log(`[INFO] ${msg}`);
}

function error(msg, err = null) {
    console.error(`[ERROR] ${msg}`, err || '');
}

function warn(msg) {
    console.warn(`[WARN] ${msg}`);
}

function success(msg) {
    console.log(`[SUCCESS] ${msg}`);
}

module.exports = {
    info,
    error,
    warn,
    success
};
