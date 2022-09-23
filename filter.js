function filterRawFile(ext) {
  const rawList = {
    ARW: "image/x-sony-arw",
    CR2: "image/x-canon-cr2",
    CRW: "image/x-canon-crw",
    DCR: "image/x-kodak-dcr",
    DNG: "image/x-adobe-dng",
    ERF: "image/x-epson-erf",
    K25: "image/x-kodak-k25",
    KDC: "image/x-kodak-kdc",
    MRW: "image/x-minolta-mrw",
    NEF: "image/x-nikon-nef",
    ORF: "image/x-olympus-orf",
    PEF: "image/x-pentax-pef",
    RAF: "image/x-fuji-raf",
    RAW: "image/x-panasonic-raw",
    SR2: "image/x-sony-sr2",
    SRF: "image/x-sony-srf",
    X3F: "image/x-sigma-x3f",
  };
  for (const key in rawList) {
    if (Object.hasOwnProperty.call(rawList, key)) {
      const rawMime = rawList[key];
      if (key == ext.toUpperCase()) {
        return true;
      }
    }
  }
  return false;
}

export { filterRawFile };
