import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";
import {
  ReadableStream,
  TextDecoderStream,
  TextEncoderStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";

Object.assign(globalThis, {
  ReadableStream,
  structuredClone:
    globalThis.structuredClone ??
    ((value: unknown) => JSON.parse(JSON.stringify(value)) as unknown),
  TextDecoder,
  TextDecoderStream,
  TextEncoder,
  TextEncoderStream,
  TransformStream,
  WritableStream,
});

const edgeRuntimePrimitives = require("next/dist/compiled/@edge-runtime/primitives") as {
  fetch: typeof fetch;
  Headers: typeof Headers;
  Request: typeof Request;
  Response: typeof Response;
};

Object.assign(globalThis, {
  fetch: edgeRuntimePrimitives.fetch,
  Headers: edgeRuntimePrimitives.Headers,
  Request: edgeRuntimePrimitives.Request,
  Response: edgeRuntimePrimitives.Response,
});
