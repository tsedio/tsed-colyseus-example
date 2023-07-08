// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { monitor as Monitor } from "@colyseus/monitor";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { playground as Playground } from "@colyseus/playground";
import { Constant, Inject, InjectorService, Module, Provider } from "@tsed/di";
import { Configuration, PlatformApplication } from "@tsed/common";
import { Env } from "@tsed/core";
import { Room, Server } from "@colyseus/core";
import "./services/ColyseusServer";
import { ROOM_CONTROLLER } from "./constants/constants";
import { EventsProps } from "./interfaces/EventsProps";

@Module()
export class ColyseusModule {
  @Inject()
  protected app: PlatformApplication;

  @Constant("env")
  protected env: Env;

  @Inject()
  protected server: Server;

  @Inject()
  protected injector: InjectorService;

  @Configuration()
  protected configuration: Configuration;

  @Constant("colyseus", {})
  protected settings: { playground?: false | string; monitor?: boolean };

  #roomsProvider: Provider<Room>[];

  $onInit() {
    this.#roomsProvider = this.injector.getProviders(ROOM_CONTROLLER);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    this.#roomsProvider.forEach((provider) => {
      const { options } = provider.store.get<{ options: any }>(ROOM_CONTROLLER);

      this.server.define(
        provider.path,
        function factory() {
          return self.invoke(provider);
        } as any,
        options
      );
    });
  }

  $afterRoutesInit() {
    const { playground: playgroundPath = "/playground", monitor = true } = this.settings;
    /**
     * Use @colyseus/playground
     * (It is not recommended to expose this route in a production environment)
     */

    if (this.env !== Env.PROD) {
      this.app.use(playgroundPath, Playground);
    }
    /**
     * Use @colyseus/monitor
     * It is recommended to protect this route with a password
     * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
     */
    if (monitor) {
      this.app.use("/colyseus", Monitor());
    }
  }

  $afterListen() {
    const list = this.#roomsProvider.flatMap((provider) => {
      const events = provider.store.get(ROOM_CONTROLLER).events || {};

      return Object.values(events).map((event: EventsProps) => {
        return {
          room: provider.path,
          messageType: event.messageType,
          name: provider.className + "." + event.propertyKey + "()"
        };
      });
    });

    const str = this.injector.logger.drawTable(list, {
      padding: 1,
      header: {
        room: "Room",
        messageType: "Message Type",
        name: "Class"
      }
    });

    this.injector.logger.info("\n" + str);

    if (this.configuration.getBestHost) {
      const { playground: playgroundPath = "/playground" } = this.settings;
      const host = this.configuration.getBestHost();
      const url = host.toString();

      if (this.env !== Env.PROD) {
        this.injector.logger.info(`Colyseus playground is available on ${url}${playgroundPath}`);
      }

      this.injector.logger.info(`Colyseus is ready`);
    }
  }

  private invoke(provider: Provider<Room>) {
    const injector = this.injector;
    const { events = {} } = provider.store.get<{ events: EventsProps }>(ROOM_CONTROLLER);

    const controller = injector.invoke<Room>(provider.token);
    const { onCreate } = controller;

    // bind onCreate
    controller.onCreate = function (...args: any[]) {
      const result = onCreate?.apply(controller, args);

      Object.values(events).forEach(({ propertyKey, messageType }) => {
        const handler = (controller as Record<string, any>)[propertyKey].bind(controller);

        this.onMessage(messageType, handler);
      });

      return result;
    };

    return controller;
  }
}
