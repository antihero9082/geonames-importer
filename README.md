# geonames-importer

A super-duper simple node.js script that allows you to import the US [Geonames](http://www.geonames.org) database into MongoDB.

## Usage

1. Download & unzip US geonames postal codes [http://download.geonames.org/export/zip/US.zip](http://download.geonames.org/export/zip/US.zip)
2. Run the command: `node import.js -f US.txt`

... some advanced options:
```bash
  -f, --file        The full path to the geonames file, i.e. /tmp/US.txt            [required]
  -u, --url         The url connection string for MongoDB (must include database).  [required]  [default: "mongodb://localhost:27017/geonames"]
  -c, --collection  The mongo collection.                                           [required]  [default: "zips"]
```

## License
This content is released under the MIT License [here](https://github.com/j/geonames-importer/LICENSE).