import { afterEach, describe, test, mock } from "node:test";
import http from "node:http";
import net from "node:net";

import { type Widgets } from "./tsp-output/@typespec/http-server-js/src/generated/models/all/demo-service.js";
import { createDemoServiceRouter } from "./tsp-output/@typespec/http-server-js/src/generated/http/router.js";
import assert from "node:assert";
import {
  createPolicyChain,
  Policy,
} from "./tsp-output/@typespec/http-server-js/src/generated/helpers/router.js";

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

describe("Support for policy functions", () => {
  let server: http.Server;
  afterEach(() => server?.close());

  describe("createPolicyChain", () => {
    test("No policy", () => {
      // Prepare
      const fnHandler = mock.fn();
      const dispatch = createPolicyChain("TestRouterDispatch", [], fnHandler);

      // Act
      dispatch({});

      // Assert
      assert.equal(fnHandler.mock.calls.length, 1, "Handler was not executed");
    });

    test(`Global policy`, async () => {
      // Prepare
      const fnHandler = mock.fn();
      const fnPolicy = mock.fn();
      const policy: Policy = (ctx, next) => {
        fnPolicy();
        next();
      };
      const dispatch = createPolicyChain(
        "TestRouterDispatch",
        [policy],
        fnHandler,
      );

      // Act
      dispatch({});

      // Assert
      assert.equal(fnPolicy.mock.calls.length, 1, "Policy was not executed");
      assert.equal(fnHandler.mock.calls.length, 1, "Handler was not executed");
    });
  });

  describe("With router", () => {
    test("No policy", async () => {
      // Prepare
      const fnHandler = mock.fn(() => Promise.resolve({ items: [] as any }));

      const router = createDemoServiceRouter(
        {
          ...defaultWidgetService,
          list: fnHandler,
        },
        {
          policies: [],
        },
      );

      server = http.createServer(router.dispatch);
      await new Promise<void>((r) => server.listen(undefined, r));
      const address = `http://localhost:${(server.address() as net.AddressInfo).port}`;

      // Act
      await fetch(`${address}/widgets`).then((r) => r.json());

      // Assert
      assert.equal(fnHandler.mock.calls.length, 1, "Handler was not executed");
    });

    test("createDemoServiceRouter", async () => {
      // Prepare
      const fnHandler = mock.fn(() => Promise.resolve({ items: [] as any }));
      const fnPolicy = mock.fn();
      const policy: Policy = (ctx, next) => {
        fnPolicy();
        next();
      };

      const router = createDemoServiceRouter(
        {
          ...defaultWidgetService,
          list: fnHandler,
        },
        {
          policies: [policy],
        },
      );

      server = http.createServer(router.dispatch);
      await new Promise<void>((r) => server.listen(undefined, r));
      const address = `http://localhost:${(server.address() as net.AddressInfo).port}`;

      // Act
      await fetch(`${address}/widgets`).then((r) => r.json());

      // Assert
      assert.equal(fnPolicy.mock.calls.length, 1, "Policy was not executed");
      assert.equal(fnHandler.mock.calls.length, 1, "Handler was not executed");
    });

    test("createDemoServiceRouter", async () => {
      // Prepare
      const fnHandler = mock.fn(() => Promise.resolve({ items: [] as any }));
      const fnPolicy = mock.fn();
      const policy: Policy = (ctx, next) => {
        fnPolicy();
        next();
      };

      const router = createDemoServiceRouter(
        {
          ...defaultWidgetService,
          list: fnHandler,
        },
        {
          routePolicies: {
            widgets: { before: [policy] },
          },
        },
      );

      server = http.createServer(router.dispatch);
      await new Promise<void>((r) => server.listen(undefined, r));
      const address = `http://localhost:${(server.address() as net.AddressInfo).port}`;

      // Act
      await fetch(`${address}/widgets`).then((r) => r.json());

      // Assert
      assert.equal(fnPolicy.mock.calls.length, 1, "Policy was not executed");
      assert.equal(fnHandler.mock.calls.length, 1, "Handler was not executed");
    });
  });
});
