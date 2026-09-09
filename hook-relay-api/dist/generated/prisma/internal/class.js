import * as runtime from "@prisma/client/runtime/client";
const config = {
    "previewFeatures": [],
    "clientVersion": "7.10.0",
    "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
    "activeProvider": "postgresql",
    "inlineSchema": "generator client {\n  provider     = \"prisma-client\"\n  output       = \"../src/generated/prisma\"\n  moduleFormat = \"cjs\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n}\n\nenum DeliveryStatus {\n  PENDING\n  DELIVERED\n  FAILED\n}\n\nmodel Delivery {\n  id                String         @id @default(uuid())\n  eventType         String\n  payload           Json\n  destinationUrl    String\n  status            DeliveryStatus @default(PENDING)\n  destinationStatus Int?\n  errorMessage      String?\n  createdAt         DateTime       @default(now())\n  updatedAt         DateTime       @updatedAt\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"Delivery\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"eventType\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"payload\",\"kind\":\"scalar\",\"type\":\"Json\"},{\"name\":\"destinationUrl\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"status\",\"kind\":\"enum\",\"type\":\"DeliveryStatus\"},{\"name\":\"destinationStatus\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"errorMessage\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null,\"schema\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"Delivery.findUnique\",\"Delivery.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"Delivery.findFirst\",\"Delivery.findFirstOrThrow\",\"Delivery.findMany\",\"data\",\"Delivery.createOne\",\"Delivery.createMany\",\"Delivery.createManyAndReturn\",\"Delivery.updateOne\",\"Delivery.updateMany\",\"Delivery.updateManyAndReturn\",\"create\",\"update\",\"Delivery.upsertOne\",\"Delivery.deleteOne\",\"Delivery.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"Delivery.groupBy\",\"Delivery.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"eventType\",\"payload\",\"destinationUrl\",\"DeliveryStatus\",\"status\",\"destinationStatus\",\"errorMessage\",\"createdAt\",\"updatedAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"string_contains\",\"string_starts_with\",\"string_ends_with\",\"array_starts_with\",\"array_ends_with\",\"array_contains\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "PwsQDBwAAC4AMB0AAAQAEB4AAC4AMB8BAAAAASABAC8AISEAADAAICIBAC8AISQAADEkIiUCADIAISYBADMAISdAADQAIShAADQAIQEAAAABACABAAAAAQAgDBwAAC4AMB0AAAQAEB4AAC4AMB8BAC8AISABAC8AISEAADAAICIBAC8AISQAADEkIiUCADIAISYBADMAISdAADQAIShAADQAIQIlAAA1ACAmAAA1ACADAAAABAAgAwAABQAwBAAAAQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACAJHwEAAAABIAEAAAABIYAAAAABIgEAAAABJAAAACQCJQIAAAABJgEAAAABJ0AAAAABKEAAAAABAQgAAAkAIAkfAQAAAAEgAQAAAAEhgAAAAAEiAQAAAAEkAAAAJAIlAgAAAAEmAQAAAAEnQAAAAAEoQAAAAAEBCAAACwAwAQgAAAsAMAkfAQA7ACEgAQA7ACEhgAAAAAEiAQA7ACEkAAA8JCIlAgA9ACEmAQA-ACEnQAA_ACEoQAA_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"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.js"),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.js");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
export function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}
//# sourceMappingURL=class.js.map