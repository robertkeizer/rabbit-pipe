> Note that this is project is currently under active development. It isn't ready to be used by anyone yet.

[![Travis CI](https://travis-ci.org/robertkeizer/rabbit-pipe.svg?branch=master)](https://travis-ci.org/robertkeizer/rabbit-pipe)

## Overview

A collection of programs that allow you to interact with rabbit pipes on the unix command line. 

Also contains a node module to transit data from a [ReadableStream](https://nodejs.org/api/stream.html#stream_readable_streams) into a Rabbit Queue.

## Installation

```
npm install -g rabbit-pipe
```

## Examples

*Example*: Put each filename into a rabbit queue named `files`.
```
find / -type f | rabbit-pipe -q files
```
