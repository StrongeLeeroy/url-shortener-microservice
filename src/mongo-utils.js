import { UrlEntry } from './urlEntry';

export function getShortCode() {
  return UrlEntry
    .find()
    .sort({ shortCode: -1 })
    .limit(1)
    .select({ _id: 0, shortCode: 1 })
    .then(docs => {
      return docs.length === 1 ? docs[0].shortCode + 1 : 0;
    });
}

export function isDuplicate(url) {
  return UrlEntry
    .findOne({ original: url})
    .then(doc => doc ? doc.shortCode : false );
}

export function insertNew(url) {
  return getShortCode().then(newCode => {
    let newUrl = new UrlEntry({ original: url, shortCode: newCode });
    return newUrl.save();
  });
}