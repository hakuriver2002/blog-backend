const slugifyLib = require('slugify');

const slugify = (text) => {
    return slugifyLib(text, {
        lower: true,
        strict: true,
        locale: 'vi',
        trim: true,
    });
};

const slugifyUnique = (text) => {
    const base = slugify(text);
    const ts = Date.now().toString(36);
    return `${base}-${ts}`;
};

module.exports = { slugify, slugifyUnique };