## Benchmark

By comparing the encoding and decoding times of JSON and ProtoBuf (protobufjs) with different data types in a JavaScript environment.
For JSON encoding, the data is first encoded into a string, and then the string is encoded into utf8 binary data. Decoding involves decoding the binary data using utf-8, and then parsing the JSON string.
For ProtoBuf, since it does not support defining array types directly, a single-field object was defined in the test, and the type of this object was set to "repeat". That is, in the test, if JSON and JBOD handle 10,000 8-bit arrays, ProtoBuf handles a single object with 10,000 8-bit arrays.

### Run the benchmarks in your project

Deno is used for benchmarking in order to get more accurate results

- Run the `deno task benchmark` command, and the test results will be output to the "benchmark/dist/result.json" file.
- Run the `deno task bench-ui` command to start the web server and view the test results.

### Comparison of encoding and decoding for different data types

<img src="./bench/cp.png"/>

In the benchmark test of the above figure, it is the encoding and decoding of an array, in which the values of the array are the same. The data of each group of tests are as follows.

| Name                   | Data                                   |
| ---------------------- | -------------------------------------- |
| int32: 8\*10000        | 10000 arrays with a value of 8         |
| int32: -1234567\*10000 | 10000 arrays with a value of -1234567  |
| double \*10000         | 10000 arrays with a value of 4/7       |
| boolean \*10000        | 10000 arrays with a value of true      |
| string \*1000          | 1000 arrays with a value of "中文 abc" |

object list \*1000 ：1000 objects below

```
{
  disabled: false,
  count: 100837,
  name: "Documentation",
  dataStamp: 4 / 7,
  id: 876,
}
```

**Conclusion**

For integer types, you can see that the time that affects JSON encoding is the length of the string, which is especially time-consuming when dealing with floating-point data.

Why is JBOD slow to process objects?\
80% of the time spent in JBOD processing objects is in the key (string).

So why does protobufjs code object types similarly to JSON?\
The keys of the ProtoBuf are mapped by id, the key encoding is actually an integer encoding (varints), and the objects of the ProtoBuf are predefined, fixed data types, which can be seen below Struct encoding and decoding

#### Struct codec comparison

<img src="./bench/struct.png"/>
The above figure is still encoding and decoding an array of 1000 objects. You can see that Struct is a big improvement over any for the same data because there is no need to encode a string key
