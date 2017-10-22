> Note that this is project is currently under active development. It isn't ready to be used by anyone yet.

[![Travis CI](https://travis-ci.org/robertkeizer/rabbit-pipe.svg?branch=master)](https://travis-ci.org/robertkeizer/rabbit-pipe)

## Overview

A collection of programs that allow you to interact with rabbit pipes on the unix command line. 

Also contains a node module to transit data from a [ReadableStream](https://nodejs.org/api/stream.html#stream_readable_streams) into a Rabbit Queue.

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
    -l, --queue-length [queuelength]  Maximum number of items in the queue
    -f, --queue-freq [queuefreq]      How often to check the queue length (ms)
    -H, --host [host]                 Rabbit host to use
    -h, --help                        output usage information
```

## Examples

**Example**: Put each filename into a rabbit queue named `files`. Try and keep a limit of 1000 messages in the queue at one time, and check the queue length every 100ms.
```
find / -type f | rabbit-pipe -q files -l 1000 -f 100
```
