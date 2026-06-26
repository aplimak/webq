const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

const pkg = require('../package.json');
const configPath = path.join(__dirname, '..', 'config.xml');
const xml = fs.readFileSync(configPath, 'utf8');

xml2js.parseString(xml, { explicitArray: false, mergeAttrs: false }, (err, result) => {
  if (err) throw err;

  const widget = result.widget;
  if (!widget) throw new Error('No <widget> element found');

  if (pkg.version) widget.$.version = pkg.version;
  if (pkg.name) widget.$.id = pkg.name; // or use a custom field

  if (pkg.displayName) {
    // name might be a string or an object with `_` (if it has attributes)
    if (typeof widget.name === 'string' || !widget.name) {
      widget.name = pkg.displayName;
    } else if (widget.name && typeof widget.name === 'object') {
      widget.name._ = pkg.displayName;
    }
  }

  if (pkg.description) {
    if (typeof widget.description === 'string' || !widget.description) {
      widget.description = pkg.description;
    } else if (widget.description && typeof widget.description === 'object') {
      widget.description._ = pkg.description;
    }
  }

  if (pkg.author) {
    // Ensure author is an object with `_` and `$`
    if (!widget.author || typeof widget.author === 'string') {
      widget.author = { _: '', $: {} };
    }
    if (typeof pkg.author === 'string') {
      widget.author._ = pkg.author;
    } else if (typeof pkg.author === 'object') {
      if (pkg.author.name) widget.author._ = pkg.author.name;
      if (pkg.author.email) widget.author.$.email = pkg.author.email;
      if (pkg.author.url) widget.author.$.href = pkg.author.url;
    }
  }

  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' },
    renderOpts: { pretty: true, indent: '  ' },
  });
  const updatedXml = builder.buildObject(result);
  fs.writeFileSync(configPath, updatedXml, 'utf8');

  console.log('config.xml synced with package.json');
  console.log(`  ID: ${widget.$.id}`);
  console.log(`  Name: ${widget.name}`);
  console.log(`  Version: ${widget.$.version}`);
});
