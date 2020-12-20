const fetch = require("node-fetch");
const { createInterface } = require("readline");
const { promisify } = require("util");
const yauzl = require("yauzl");

const postcodeUrl = "https://download.geonames.org/export/zip/GB_full.csv.zip";

// As we're dealing with zip archives, we've got to dig through and find the file we care about
const lineStreamFromZip = (zipfile) => {
  return new Promise((resolve, reject) => {
    zipfile.readEntry();
    zipfile.on("entry", (entry) => {
      // Ignore any other files
      if (entry.fileName !== "GB_full.txt") {
        return zipfile.readEntry();
      }

      zipfile.openReadStream(entry, (err, readStream) => {
        const lineReader = createInterface({
          input: readStream,
        });
        resolve(lineReader);
      });
    });
  });
};

fetch(postcodeUrl)
  .then((res) => res.buffer())
  .then((buffer) => promisify(yauzl.fromBuffer)(buffer, { lazyEntries: true }))
  .then((zipfile) => lineStreamFromZip(zipfile))
  .then((lineReader) => lineReader.on("line", console.log));
