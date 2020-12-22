const fetch = require("node-fetch");
const { promisify } = require("util");
const yauzl = require("yauzl");
const { client } = require("../lib/typesense");
const byline = require("byline");
const BatchStream = require("batch-stream");
const Bottleneck = require("bottleneck");
const limiter = new Bottleneck({
  maxConcurrent: 10,
  minTime: 333,
});

const postcodeUrl = "https://download.geonames.org/export/zip/GB_full.csv.zip";

// As we're dealing with zip archives, we've got to dig through and find the file we care about
const importFromZip = (zipfile) => {
  return new Promise((resolve, reject) => {
    zipfile.readEntry();
    zipfile.on("entry", (entry) => {
      // Ignore any other files
      if (entry.fileName !== "GB_full.txt") {
        return zipfile.readEntry();
      }

      zipfile.openReadStream(entry, (err, readStream) => {
        readStream
          .pipe(byline.createStream())
          .pipe(new BatchStream({ size: 1000 }))
          .on("data", importLines);
      });
    });
  });
};

const importLines = (lines) => {
  const documents = lines.map((lineBuffer) => {
    const [
      countryCode,
      postalCode,
      placeName,
      adminName1,
      adminCode1,
      adminName2,
      adminCode2,
      adminName3,
      adminCode3,
      latitude,
      longitude,
      accuracy,
    ] = lineBuffer.toString().split("\t");

    return {
      name: postalCode,
      latitude,
      longitude,
      sort_order: 1 /* all will be equal */,
    };
  });

  limiter.schedule(() => {
    console.log(`Doin an import from ${documents[0].name} to ${documents[documents.length - 1].name}`);
    client.collections("geonames").documents().import(documents);
  });
};

fetch(postcodeUrl)
  .then((res) => res.buffer())
  .then((buffer) => promisify(yauzl.fromBuffer)(buffer, { lazyEntries: true }))
  .then((zipfile) => importFromZip(zipfile));
