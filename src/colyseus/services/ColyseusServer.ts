import { Server } from "@colyseus/core";
import { Configuration, Logger, registerProvider } from "@tsed/common";
import { WebSocketTransport } from "@colyseus/ws-transport";
import http from "http";
import https from "https";
import { Env } from "@tsed/core";

registerProvider({
  provide: Server,
  deps: [http.Server, https.Server, Logger, Configuration],
  useFactory: (httpServer: http.Server, httpsServer: https.Server, logger: Logger, configuration: Configuration) => {
    return new Server({
      logger,
      devMode: configuration.env !== Env.PROD,
      transport: new WebSocketTransport({
        server: configuration.httpsPort ? httpsServer : httpServer
      })
    });
  }
});
