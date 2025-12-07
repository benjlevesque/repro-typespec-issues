import { after, describe, mock, test } from "node:test";
import http from "node:http";
import type net from "node:net";

import { type Widgets } from "./tsp-output/@typespec/http-server-js/src/generated/models/all/demo-service.js";
import { createDemoServiceRouter } from "./tsp-output/@typespec/http-server-js/src/generated/http/router.js";
import assert from "node:assert";
import { ListOptions } from "./tsp-output/@typespec/http-server-js/src/generated/models/synthetic.js";

const notImplemented = () => {
  throw new Error("Not implemented");
};

const defaultWidgetService: Widgets = {
  list: notImplemented,
  analyze: notImplemented,
  create: notImplemented,
  delete: notImplemented,
  read: notImplemented,
  update: notImplemented,
};

describe("Bug reproduction", () => {
  const createServer = async (widgetService: Widgets) => {
    const router = createDemoServiceRouter(widgetService);
    const server = http.createServer(router.dispatch);
    await new Promise<void>((r) => server.listen(undefined, r));
    return {
      address: `http://localhost:${(server.address() as net.AddressInfo).port}`,
      close: () => server.close(),
    };
  };

  test("an optional numeric query parameter should be assignable to undefined", () => {
    const options: ListOptions = {};
    options.page = undefined;
    options.page = 1;
    // @ts-expect-error
    options.page = false;
  });

  test("an optional numeric query parameter should be undefined if unspecified", async () => {
    // Arrange
    const fn = mock.fn();
    const server = await createServer({
      ...defaultWidgetService,
      list: async (_, options) => {
        fn(options);
        return { items: [] };
      },
    });

    // Act
    await fetch(`${server.address}/widgets`).then((r) => r.json());
    server.close();

    // Assert
    assert(fn.mock.calls[0], "mock not called");

    // 🐛 undefined expected, NaN received
    assert.deepEqual(fn.mock.calls[0].arguments[0], { page: undefined });
  });
});
