[![Travis CI](https://travis-ci.org/robertkeizer/rabbit-pipe.svg?branch=master)](https://travis-ci.org/robertkeizer/rabbit-pipe)

## Overview

Allows interaction between a unix pipe and a rabbit queue.

## Installation

```
npm install -g rabbit-pipe
```

## Usage

```
  Usage: rabbit-pipe [options]

  Options:

    -V, --version                     output the version number
    -q, --queue <queue>               Queue name to use
    -P, --producer                    Signal that we're producing
    -C, --consumer                    Signal that we should consume
    -l, --queue-length [queuelength]  Maximum number of items in the queue
    -f, --queue-freq [queuefreq]      How often to check the queue length (ms)
    -H, --host [host]                 Rabbit host to use
    -h, --help                        output usage information
```

## Examples

**Example**: Put each filename into a rabbit queue named `files`. Try and keep a limit of 1000 messages in the queue at one time, and check the queue length every 100ms.
```
$ find / -type f | rabbit-pipe -P -q files -l 1000 -f 100
```

**Example**: Generate the sha512 hashes of each file on disk and send them to a queue named `hashes`. Limit to 10000 messages in the queue at once, and check the queue length every second.
```
$ find / -type f 2>/dev/null | xargs -I{} shasum -a 512 {} 2>/dev/null | awk '{print $1}' | rabbit-pipe -P -q hashes -l 10000 -f 1000
```
