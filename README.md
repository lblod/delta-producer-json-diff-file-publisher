# delta-production-json-diff-file-manager
- Produces delta diff files based on modifications of the delta-cache graph
- Provides endpoint so consumers can query the produced dela-files
## Reference
### Configuration
#### deltanotifier
Append the following entry:
```
  {
    match: {
      graph: {
        type: 'uri',
        value: 'http://uri/of/the/cache/graph'
      }
    },
    callback: {
      url: 'http://name/of/service/in/cache/graph/delta',
      method: 'POST'
    },
    options: {
      resourceFormat: 'v0.0.1',
      gracePeriod: 1000,
      ignoreFromSelf: true
    }
  }
```
#### Environment variables
The following enviroment variables can be optionally configured:
* `LOG_INCOMING_DELTA (default: "false")`: log the delta message as received from the delta-notifier to the console
* `LOG_OUTGOING_DELTA (default: "false")`: log the resulting delta message that will be written to the diff file to the console
* `LOG_DELTA_REWRITE (default: "false")`: verbose log output during the rewrite of the incoming delta to the resulting delta. Only useful for debugging purposes.
* `RELATIVE_FILE_PATH (default: "deltas")`: relative path of the delta files compared to the root folder of the file service that will host the files.
* `PUBLISHER_URI (default: "http://data.lblod.info/services/delta-production-json-diff-file-manager")`: URI underneath which delta files will be saved.
* `CACHE_GRAPH (required)`: The cache graph the incoming deltas should come from.
### API
#### POST /delta
Endpoint that receives delta's from the [delta-notifier](https://github.com/mu-semtech/delta-notifier). The delta's are rewritten based on the configured export for mandatees. The resulting delta's are written to files that can be retrieved via the `GET /files` endpoint.

#### GET /files?since=<datetime>
Get a list of diff files generated since the request timestamp. The list is ordered by creation date, oldest first. This is also the order in which the files must be consumed.

Example response:
```json
{
  "data": [
    {
      "type": "files",
      "id": "3be63fd0-c030-11ea-a482-b30a6eeb477f",
      "attributes": {
        "name": "delta-2020-07-07T08:59:58.409Z.json",
        "created": "2020-07-07T08:59:58.413Z"
      }
    },
    {
      "type": "files",
      "id": "3fd04b40-c030-11ea-a482-b30a6eeb477f",
      "attributes": {
        "name": "delta-2020-07-07T09:00:04.977Z.json",
        "created": "2020-07-07T09:00:04.980Z"
      }
    }
  ]
}
```

### File format
The generated delta files follow the [delta-notifier v0.0.1](https://github.com/mu-semtech/delta-notifier#v001) format.

### Model
#### Diff files
The generated diff files are written to the store according to the [model of the file service](https://github.com/mu-semtech/file-service#resources). The virtual file is enriched with the following properties:

| Name      | Predicate       | Range           | Definition                                                                                                                    |
|-----------|-----------------|-----------------|-------------------------------------------------------------------------------------------------------------------------------|
| publisher | `dct:publisher` | `rdfs:Resource` | Publisher of the file, in this case always `<http://data.lblod.info/services/loket-mandatarissen-producer>` |

## Known limitations
* The service keeps an in-memory cache of delta's to write to a file. If the service is killed before the delta's have been written to a file, the delta's are lost. Hence, shortening the `DELTA_INTERVAL`, decreases the chance to loose data on restart.

## Roadmap
* Add support for a prefix map in the export configuration
* fold incoming delta messages to what is the actual case in the cache-graph. I.e. is the delta-notification not out dated?
